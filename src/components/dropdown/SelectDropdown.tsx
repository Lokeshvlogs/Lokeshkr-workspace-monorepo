"use client";
import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';

interface Option { 
          // Optional icon URL to display alongside the option
          icon?: string | null;
          // Optional short label for the option
          short?: string; 
          // The main label to display for the option
          label: string;
          // The actual value that will be set when this option is selected 
          value: string; 
        }

interface Props {
  name?: string;
  options: Option[];
  initialValue?: string;
  //tailwind classes to apply to the container
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
  shortClassName?: string;
  labelClassName?: string;

  align?: 'left' | 'center' | 'right';

  onChange?: (value: string) => void;
  disabled?: boolean;
}

export default function SelectDropdown({ name, options, initialValue = '', className = '', buttonClassName = '', iconClassName = '', shortClassName = '', labelClassName = '', onChange, disabled = false, align = 'left' }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(initialValue);
  const [popupWidth, setPopupWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useEffect(() => setSelected(initialValue), [initialValue]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {      
      const target = e.target as Node;
      if (btnRef.current && btnRef.current.contains(target)) return;
      if (popupRef.current && popupRef.current.contains(target)) return;1
      console.log('Document click outside dropdown, closing');
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

  function doSelect(v: string) {
    setSelected(v);
    setOpen(false);
    if (onChange) onChange(v);
  }

  const selectedOption = options.find(o => o.value === selected);
  const displayShort = selectedOption?.short || '';
  const displayValue = selectedOption?.value || '';
  const displayLabel = displayShort ? `${displayShort} ${displayValue}` : (selectedOption?.label || selected || (initialValue ? initialValue : name) || 'Select');
  const displayFlag = selectedOption?.icon;

    const justify =
    align === "center"
      ? "justify-center"
      : align === "right"
      ? "justify-end"
      : "justify-start";

  return (
    <div ref={containerRef} className={`relative flex flex-col ${className}`}>
      {name && <input type="hidden" name={name} value={selected} />}
      <button
        type="button"
        ref={btnRef}
        className={`${buttonClassName ? buttonClassName : 'p-4'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => { if (!disabled) setOpen(v => !v); }}
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
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
        <div ref={popupRef} style={style} className="z-50 bg-white w-max border border-pink-100 rounded-md p-1 shadow max-h-56 overflow-y-auto hide-scrollbar">
          <div className="divide-y divide-pink-50">
            {options.map((o, idx) => {
              const isSelected = selected === o.value;
              return (
                <div
                  key={`${o.value}-${idx}`}
                  data-option
                  className={`flex gap-2 w-full text-left p-2 ${isSelected ? 'bg-pink-500 text-white' : 'bg-white text-black hover:bg-pink-100'}`}
                  onClick={() => doSelect(o.value)}
                  >
                    {o.icon && <img src={o.icon} alt={o.short || o.label} className={`w-5 h-4 object-contain ${iconClassName}`} />}
                    {o.short && <span className={`text-sm ml-1  align-left ${isSelected ? 'text-white/90' : 'text-gray-500'} ${shortClassName}`}>{o.short}</span>}
                    {o.label && <span className={`text-sm ml-5  text-right ${isSelected ? 'text-white/90' : 'text-gray-500'} ${labelClassName}`}>{o.label}</span>}
                  
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
