"use client";

import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { years } from '../../../../constants/selectOptions/timeDate';
import { useOverlay } from '../../../../hooks/useOverlay';

interface Props
 {
  value: string;
  onYearChange: (year: string) => void;
  inputClassName?: string;
}

export default function YearSelector({ value, onYearChange, inputClassName = '' }: Props) {

  const [inputText, setInputText] = useState<string>('');
  const { open, setOpen, popupWidth, setPopupWidth, style, setStyle, btnRef, popupRef } = useOverlay({ initialPopupWidth: 80 });

  // Sync display text when value changes
  useEffect(() => {
    setInputText(value || '');
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
    // Open the year popup while typing
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, width: 144 });
    setOpen(true);

    if (raw === '') {
      onYearChange('');
      return;
    }
    const matchingYear = years.find(y => y.value === raw);
    if (matchingYear) onYearChange(matchingYear.value);
  }

  function handleYearSelect(year: string) {
    onYearChange(year);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        ref={btnRef}
        type="text"
        inputMode="numeric"
        placeholder="Year"
        value={inputText}
        onClick={() => {
          if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setStyle({ position: 'fixed', top: rect.bottom + 8, left: rect.left, width: popupWidth });
          }
          setOpen(v => !v);
        }}
        onChange={handleInputChange}
        className={inputClassName || 'p-3 border border-pink-300 rounded-md bg-white text-left w-20 focus:outline-none focus:ring-0 focus:border-pink-300'}
      />
      {open && style && createPortal(
        <div ref={popupRef} style={style} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-72 overflow-y-auto pb-6  grid grid-cols-1 gap-2 hide-scrollbar">
          {(inputText ? years.filter(y => y.value.startsWith(inputText)) : years).map((y) => (
            <button
              key={y.value}
              className={`p-2 text-sm rounded-md ${value === y.value ? 'bg-pink-500 text-white' : 'hover:bg-pink-400 hover:text-white'} text-left`}
              onClick={() => handleYearSelect(y.value)}
            >
              {y.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
