"use client";

import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { months } from 'src/constants/selectOptions/timeDate';

interface Props {
  value: string;
  onMonthChange: (month: string) => void;
  inputClassName?: string;
}

export default function MonthSelector({ value, onMonthChange, inputClassName = '' }: Props) {
  const [popupwidth, setPopupWidth] = useState<number>(160);
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState<string>('');
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const btnRef = useRef<HTMLInputElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  // Sync display text when value changes
  useEffect(() => {
    const mo = months.find(m => m.value === value);
    setInputText(mo ? mo.label : '');
  }, [value]);


   useEffect(() => {
      function onDocClick(e: MouseEvent) {
        const target = e.target as Node;
        if (btnRef.current && btnRef.current.contains(target)) return;
        if (popupRef.current && popupRef.current.contains(target)) return;
        setOpen(false);
      }
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;

    let rafId: number | null = null;

    const updateWidthAndPosition = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();

      // Choose the widest between the button and the popup content
      let maxPopupWidth = rect.width;

      if (popupRef.current) {
        // scrollWidth reflects the widest content inside the popup
        const contentWidth = popupRef.current.scrollWidth;
        // Add small fudge for borders/padding if needed
        maxPopupWidth = Math.max(rect.width, contentWidth);
      }

      setPopupWidth(maxPopupWidth);
        setStyle({
          position: 'fixed',
          top: rect.bottom + 2,
          left: rect.left,
          width: popupwidth,
          zIndex: 9999,
        });
      }
    };

        // Run once after render to ensure popupRef is available, then keep in sync on resize
    const scheduleUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateWidthAndPosition);
      // fallback in case RAF didn't capture final layout
      setTimeout(updateWidthAndPosition, 0);
    };

    scheduleUpdate();

    const onScrollClose = (e?: Event) => {
      // If the scroll/wheel/touch event originated from inside the popup, ignore it.
      try {
        const target = e && (e.target as Node | null);
        if (popupRef.current && target && popupRef.current.contains(target)) return;
      } catch (err) {
        // ignore DOM access errors and proceed to close
      }
     // Recalculate position in case of scroll-induced layout changes
      setOpen(false);
    };

    //updateWidthAndPosition(); // initial
    // Close on various user scroll interactions. Some containers dispatch scroll
    // on their own element (not window) and 'scroll' doesn't bubble, so also
    // listen for wheel/touchmove which do bubble.
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', onScrollClose, true);
    document.addEventListener('scroll', onScrollClose, true);
    document.addEventListener('wheel', onScrollClose as EventListener, { passive: true, capture: true } as any);
    document.addEventListener('touchmove', onScrollClose as EventListener, { passive: true, capture: true } as any);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', onScrollClose, true);
      document.removeEventListener('scroll', onScrollClose, true);
      document.removeEventListener('wheel', onScrollClose as EventListener, true as any);
      document.removeEventListener('touchmove', onScrollClose as EventListener, true as any);
    };
  }, [open]);



  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.trim();
    setInputText(raw);
    if (raw === '') {
      onMonthChange('');
      return;
    }
    // Try parsing as numeric month
    const numeric = Number(raw);
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 12) {
      onMonthChange(String(numeric).padStart(2, '0'));
      return;
    }
    // Try matching month label
    const match = months.find(m => m.label.toLowerCase().startsWith(raw.toLowerCase()));
    if (match) onMonthChange(match.value);
    else onMonthChange('');
  }

  function handleMonthSelect(month: string) {
    onMonthChange(month);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        ref={btnRef}
        type="text"
        placeholder="Month"
        value={inputText}
        onClick={() => {
          if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setStyle({
              position: 'fixed',
              top: rect.bottom + 2,
              left: rect.left,
              width: popupwidth,
              zIndex: 9999,
            });
          }
          setOpen(v => !v);
        }}
        
        onChange={handleInputChange}
        className={inputClassName || 'p-3 border border-pink-300 rounded-md bg-white text-left w-20 focus:outline-none focus:ring-0 focus:border-pink-300'}
      />
      {open && style && createPortal(
        <div ref={popupRef} style={style} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-72 overflow-y-auto grid grid-cols-3 gap-2">
          {months.map((mo) => (
            <button
              key={mo.value}
              className={`p-2 text-sm rounded-md ${value === mo.value ? 'bg-pink-500 text-white' : 'hover:bg-pink-400 hover:text-white'}`}
              onClick={() => handleMonthSelect(mo.value)}
            >
              {mo.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
