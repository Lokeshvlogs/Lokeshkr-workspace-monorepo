"use client";

import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
// days are generated dynamically now based on `maxDays` prop
import { useOverlay } from '../../../../hooks/useOverlay';

interface Props {
  value: string;
  onDayChange: (day: string) => void;
  inputClassName?: string;
  popupwidth?: number;
  maxDays?: number;
}

export default function DaySelector({ value, onDayChange, inputClassName = '', popupwidth: initialPopupWidth = 200, maxDays = 31 }: Props) {
   
  const [inputText, setInputText] = useState<string>('');
  const { open, setOpen, popupWidth, setPopupWidth, style, setStyle, btnRef, popupRef } = useOverlay({ initialPopupWidth });

  // Sync display text when value changes
  useEffect(() => {
    setInputText(value ? String(Number(value)) : '');
  }, [value]);

  //called when typing in the day input field
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInputText(raw);
    if (raw === '') {
      onDayChange('');
      return;
    }
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 1 && n <= maxDays) {
      const pad = String(n).padStart(2, '0');
      onDayChange(pad);
    } else {
      onDayChange('');
    }
  }

  // when clicking on the day selector popups
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
            setStyle({ position: 'fixed', top: rect.bottom + 8, left: rect.left, width: popupWidth, zIndex: 9999 });
          }
          setOpen(v => !v);
        }}
        onChange={handleInputChange}
        className={inputClassName || 'p-3 border border-pink-300 rounded-md bg-white text-left w-20 focus:outline-none focus:ring-0 focus:border-pink-300'}
      />
      {open && style && createPortal(
        <div ref={popupRef} style={style} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-72 overflow-y-auto pb-6 grid grid-cols-5 gap-2 hide-scrollbar">
          {Array.from({ length: maxDays }, (_, i) => {
            const v = String(i + 1).padStart(2, '0');
            return (
              <button
                key={v}
                className={`p-1 text-sm min-w-[32px] text-center text-lg rounded-md ${value === v ? 'bg-pink-500 text-white' : 'hover:bg-pink-400 hover:text-white'}`}
                onClick={() => handleDaySelect(v)}
              >
                {i + 1}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
