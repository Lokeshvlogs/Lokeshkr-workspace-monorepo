"use client";
import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';

interface Option { value: string; label: string; short?: string; flag?: string }

interface Props {
  name?: string;
  options: Option[];
  initialValue?: string;
  className?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export default function SelectDropdown({ name, options, initialValue = '', className = '', onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(initialValue);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useEffect(() => setSelected(initialValue), [initialValue]);

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
    const updatePosition = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setStyle({ position: 'fixed', top: rect.bottom + 6, left: rect.left, width: rect.width + 50, zIndex: 9999 });
      }
    };
    updatePosition();

    const onScrollClose = (e?: Event) => {
      try {
        const target = e && (e.target as Node | null);
        if (popupRef.current && target && popupRef.current.contains(target)) return;
      } catch (err) {
        // ignore DOM errors and proceed to close
      }
      setOpen(false);
    };

    window.addEventListener('resize', updatePosition);
    // Close on scrolls that originate outside the popup. Some containers dispatch
    // scroll on their own element (not window) and 'scroll' doesn't bubble,
    // so listen on capture phase and other events that bubble.
    window.addEventListener('scroll', onScrollClose, true);
    document.addEventListener('scroll', onScrollClose, true);
    document.addEventListener('wheel', onScrollClose as EventListener, { passive: true, capture: true } as any);
    document.addEventListener('touchmove', onScrollClose as EventListener, { passive: true, capture: true } as any);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', onScrollClose, true);
      document.removeEventListener('scroll', onScrollClose, true);
      document.removeEventListener('wheel', onScrollClose as EventListener, true as any);
      document.removeEventListener('touchmove', onScrollClose as EventListener, true as any);
    };
  }, [open]);

  function doSelect(v: string) {
    setSelected(v);
    setOpen(false);
    if (onChange) onChange(v);
  }

  const selectedOption = options.find(o => o.value === selected);
  const displayShort = selectedOption?.short || '';
  const displayValue = selectedOption?.value || '';
  const displayLabel = displayShort ? `${displayShort} ${displayValue}` : (selectedOption?.label || selected || (initialValue ? initialValue : name) || 'Select');
  const displayFlag = selectedOption?.flag;

  return (
    <div className={`relative flex flex-col ${className}`}>
      {name && <input type="hidden" name={name} value={selected} />}
      <button
        type="button"
        ref={btnRef}
        className={`p-2 border border-pink-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => { if (!disabled) setOpen(v => !v); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        title={selectedOption?.label || displayLabel}
      >
        <div className="flex items-center gap-2">
          {displayFlag && <img src={displayFlag} alt={displayLabel} className="w-5 h-4 object-contain" />}
          <span className="text-sm">{displayLabel}</span>
        </div>
      </button>

      {open && style && createPortal(
        <div ref={popupRef} style={style} className="z-50 bg-white border border-pink-100 rounded-md p-1 shadow max-h-56 overflow-y-auto hide-scrollbar">
          <div className="divide-y divide-pink-50">
            {options.map(o => {
              const isSelected = selected === o.value;
              return (
                <div key={o.value}>
                  <button
                    type="button"
                    className={`flex items-center justify-between gap-2 w-full text-left p-2 ${isSelected ? 'bg-pink-500 text-white' : 'bg-white text-black hover:bg-pink-100'}`}
                    onClick={() => doSelect(o.value)}
                    title={o.label}
                  >
                    {o.flag && <img src={o.flag} alt={o.short || o.label} className="w-5 h-4 object-contain" />}
                    <span className="text-sm">{o.short ? `${o.short} ${o.value}` : o.label}</span>
                    <div className="ml-4 flex-1 text-right">
                      <span className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>{o.label}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
