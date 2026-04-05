"use client";
import { cp } from 'fs';
import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { SelectIconOption, SelectOption } from 'src/types/select';
import { de } from 'zod/v4/locales';


interface Props {
  placeholder: string;
  options:  SelectIconOption[];
  initialValue?: string;
  value?: string;
  name?: string;
  //tailwind classes to apply to the container
  className?: string;
  buttonClassName?: string;
  showButtonValue?: boolean;
  iconClassName?: string;
  labelClassName?: string;
  extraLabelClassName?: string;

  align?: 'left' | 'center' | 'right';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onChange?: (value: string) => void;
  onBlur?: (value: string, index: number) => void;
  disabled?: boolean;
}

export default function SelectDropdown({ placeholder, options, initialValue = '', value, name, className = '', buttonClassName = '', showButtonValue = false, iconClassName = '', labelClassName = '', extraLabelClassName  = '', onChange, onBlur, onClick, disabled = false, align = 'left' }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ value: string; index: number }>({ value: '', index: -1 });
  const [popupWidth, setPopupWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    console.log('SelectDropdown initialValue changed:', initialValue);
    if (initialValue == '') {
      return
    }
    const initialIndex = options.findIndex(option => option.value === initialValue);
    if (initialIndex === -1) {
      console.warn(`Invalid initial value "${initialValue}" not found in options`);
      setSelected({ value: initialValue, index: -1 });
      return;
    }
    setSelected({ value: initialValue, index: initialIndex });
  }, [options]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {      
      const target = e.target as Node;
      if (containerRef.current && containerRef.current.contains(target)) return;
      if (popupRef.current && popupRef.current.contains(target)) return;
      console.log('Document click outside dropdown, closing ', placeholder);
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;

    let rafId: number | null = null;

    const updateWidthAndPosition = () => {
      if (!btnRef.current) return;
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
      setStyle({ position: 'fixed', top: rect.bottom + 6, left: rect.left, width: maxPopupWidth, zIndex: 9999 });
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
      try {
        // If the scroll/wheel event originated from within the popup, don't close
        const target = e && (e.target as Node | null);
        if (popupRef.current && target && popupRef.current.contains(target)) return;
      } catch (err) {
        // ignore DOM errors and proceed to close
      }
      // For any scroll/wheel event outside the popup, close the dropdown
      setOpen(false);
    };

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
  }, [open, options]);

  function doSelect(v: string, idx: number) {
    console.log('Option selected:', v);
    setSelected({ value: v, index: idx });
    setOpen(false);
    if (onChange) onChange(v);
  }

  function doBlur() {
    if (!open && onBlur) {
      const val = selected.value;
      onBlur(val, selected.index);
    }
  }


  const currentValue = value ?? initialValue ?? selected.value;
  const selectedOption = options.find(o => o.value === currentValue);
  const displayLabel = selectedOption?.label || currentValue || placeholder;
  const displayFlag = selectedOption?.icon ? selectedOption.icon : undefined;

    const justify =
    align === "center"
      ? "justify-center"
      : align === "right"
      ? "justify-end"
      : "justify-start";

  return (
    <div ref={containerRef} className={`relative flex flex-col ${className}`}>
      {placeholder && <input type="hidden" name={name ?? placeholder} value={value ?? selected.value} />}
      <button
        type="button"
        ref={btnRef}
        className={`${buttonClassName ? buttonClassName : 'p-4'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => { if (!disabled) setOpen(v => !v); }}
        disabled={disabled}
        title={placeholder}
        onBlur={() => doBlur()}
      >
        <div className="flex items-center gap-2">
          {displayFlag && <img src={displayFlag} alt={displayLabel} className="w-5 h-4 object-contain" />}
          <span className="text-lg">{showButtonValue ? selectedOption?.value ? selectedOption.value + ' ' + displayLabel: displayLabel : displayLabel}</span>
        </div>
      </button>

      {open && style && createPortal(
        <div ref={popupRef} style={style} className="z-50 bg-white w-max border border-pink-100 rounded-md p-1 shadow max-h-56 overflow-y-auto hide-scrollbar">
          <div className="divide-y divide-pink-50">
            {options.map((o, idx) => {
              const isSelected = selected.value === o.value;
              return (
                <div
                  key={`${idx}`}
                  data-option
                  className={`flex gap-2 w-full text-left p-2 ${isSelected ? 'bg-pink-500 text-white' : 'bg-white text-black hover:bg-pink-100'}`}
                  onClick={() => doSelect(o.value, idx)}
                  >
                    {o.icon && <img src={o.icon} alt={o.label || o.extra_label} className={`w-5 h-4 object-contain ${iconClassName}`} />}
                    {o.label && <label className={`text-lg ml-1  align-left ${isSelected ? 'text-white/90' : 'text-gray-500'} ${labelClassName}`}>{o.label}</label>}
                    {o.extra_label && <label className={`text-lg ml-5  align-right ${isSelected ? 'text-white/90' : 'text-gray-500'} ${extraLabelClassName}`}>{o.extra_label}</label>}
                  
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
