"use client";

import { RefreshCcw } from 'lucide-react';
import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { months } from 'src/constants/selectOptions/timeDate';
import { useOverlay } from 'src/hooks/useOverlay';

interface Props {
  value: string;
  onMonthChange: (month: string) => void;
  inputClassName?: string;
  popupwidth?: number;
}

export default function MonthSelector({ value, onMonthChange, inputClassName = '', popupwidth: initialPopupWidth = 160 }: Props) {

  const [inputText, setInputText] = useState<string>('');
  const { open, setOpen, popupWidth, style, setStyle, btnRef, popupRef } = useOverlay({ initialPopupWidth });

  // Sync display input text when value changes
  useEffect(() => {
    const mo = months.find(m => m.value === value);
    setInputText(mo ? mo.label : '');
  }, [value]);

  //called when typing in the month input field
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

  //called when clicking a month in the Month picker popup
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
            console.log('onClick() -- Button popup width:', popupWidth);
            setStyle({position: 'fixed', top: rect.bottom + 2, left: rect.left,  width: popupWidth, zIndex: 9999,});
          }
          setOpen(v => !v);
        }}
        
        onChange={handleInputChange}
        className={inputClassName || 'p-3 border border-pink-300 rounded-md bg-white text-left w-20 focus:outline-none focus:ring-0 focus:border-pink-300'}
      />
      {open && style && createPortal(
        <div ref={popupRef} style={style} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-72 overflow-y-auto grid grid-cols-3 gap-2 hide-scrollbar">
          {months.map((mo) => (
            <button
              key={mo.value}
              className={`p-2 min-w-[50px] text-sm rounded-md ${value === mo.value ? 'bg-pink-500 text-white' : 'hover:bg-pink-400 hover:text-white'}`}
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
