"use client";

import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { days } from 'src/constants/selectOptions/timeDate';

interface Props {
  value: string;
  onDayChange: (day: string) => void;
  inputClassName?: string;
}

export default function DaySelector({ value, onDayChange, inputClassName = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState<string>('');
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const btnRef = useRef<HTMLInputElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  // Sync display text when value changes
  useEffect(() => {
    setInputText(value ? String(Number(value)) : '');
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current && btnRef.current.contains(target)) return;
      if (popupRef.current && popupRef.current.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Close picker on scroll outside the popup
  useEffect(() => {
    function onScroll(e: Event) {
      if (!open) return;
      const target = (e.target as Node) || null;
      const isInsidePopup = popupRef.current && target && (popupRef.current === target || popupRef.current.contains(target));
      const isInsideBtn = btnRef.current && target && (btnRef.current === target || btnRef.current.contains(target));
      if (isInsidePopup || isInsideBtn) return;
      setOpen(false);
    }
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, [open]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInputText(raw);
    if (raw === '') {
      onDayChange('');
      return;
    }
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 1 && n <= 31) {
      const pad = String(n).padStart(2, '0');
      onDayChange(pad);
    } else {
      onDayChange('');
    }
  }

  function handleDaySelect(day: string) {
    onDayChange(day);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        ref={btnRef}
        type="text"
        inputMode="numeric"
        placeholder="Day"
        value={inputText}
        onClick={() => {
          if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setStyle({ position: 'fixed', top: rect.bottom + 8, left: rect.left, width: 200 });
          }
          setOpen(v => !v);
        }}
        onChange={handleInputChange}
        className={inputClassName || 'p-3 border border-pink-300 rounded-md bg-white text-left w-20 focus:outline-none focus:ring-0 focus:border-pink-300'}
      />
      {open && style && createPortal(
        <div ref={popupRef} style={style} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-72 overflow-y-auto pb-6 grid grid-cols-5 gap-2 hide-scrollbar">
          {days.map((day) => (
            <button
              key={day.value}
              className={`p-1 text-sm text-center text-lg rounded-md ${value === day.value ? 'bg-pink-500 text-white' : 'hover:bg-pink-400 hover:text-white'}`}
              onClick={() => handleDaySelect(day.value)}
            >
              {Number(day.label)}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
