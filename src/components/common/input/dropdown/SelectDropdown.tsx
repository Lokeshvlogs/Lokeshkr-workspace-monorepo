"use client";
import { cp } from 'fs';
import { ChevronDown } from 'lucide-react';
import React, { useState, useRef, useEffect, CSSProperties, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { SelectIconOption, SelectOption } from 'src/types/select';
import { de } from 'zod/v4/locales';


interface Props {
  id?: string;
  placeholder: string;
  label: string;
  options: SelectIconOption[];
  value?: any;
  name?: string;
  showButtonValue?: boolean;
  errorValue?: string;
  showError?: boolean;
  LabelBorderScale?: number;
  PlaceHolderX?: number;
  PlaceHolderY?: number;
  LabelX?: number;
  LabelY?: number;

  //tailwind classes to apply to the container
  className?: string;
  labelClassName?: string;
  selectLabelClassName?: string;
  selectPopupClassName?: string;
  iconClassName?: string;
  optionsLabelClassName?: string;
  extraLabelClassName?: string;
  
  zIndex?: number;
  align?: 'left' | 'center' | 'right';
  extraLabelAlighn?: 'left' | 'center' | 'right';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  disabled?: boolean;
}

export default function SelectDropdown({ id, label, placeholder, value, name, options, className = '', selectLabelClassName = '', selectPopupClassName = '', showButtonValue = false, iconClassName = '', optionsLabelClassName = '', extraLabelClassName = '', extraLabelAlighn = 'right', onChange, onBlur, onClick, disabled = false, align = 'left', errorValue, showError = true, LabelBorderScale = 75, PlaceHolderX = 2, PlaceHolderY = 5, LabelX = 2, LabelY = -18, labelClassName, zIndex = 10 }: Props) {
  
  const [open, setOpen] = useState(false);
  const [popupWidth, setPopupWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;

      if (btnRef.current && btnRef.current.contains(target)) return;
      if (popupRef.current && popupRef.current.contains(target)) return;
      console.log('Document click outside dropdown, closing');
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);


  useLayoutEffect(() => {
    if (!open) return;

    let rafId: number | null = null;

    const updateWidthAndPosition = () => {
      if (!btnRef.current || !popupRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();

      // Choose the widest between the button and the popup content
      let maxPopupWidth = rect.width;


      // scrollWidth reflects the widest content inside the popup
      const contentWidth = popupRef.current.scrollWidth;
      // Add small fudge for borders/padding if needed
      maxPopupWidth = Math.max(rect.width, contentWidth);

      popupRef.current.style.minWidth = `${rect.width}px`; // ensure it doesn't go below button width
      //popupRef.current.style.width = `${maxPopupWidth}px`; // set the width to the maximum calculated
      setPopupWidth(maxPopupWidth); 
      // setStyle({ position: 'fixed', top: rect.bottom + 6, left: rect.left, width: maxPopupWidth, zIndex: 9999 });
    };

    // Run once after render to ensure popupRef is available, then keep in sync on resize
    const scheduleUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateWidthAndPosition);
      // fallback in case RAF didn't capture final layout
      setTimeout(updateWidthAndPosition, 0);
    };

    scheduleUpdate();

    const observer = new ResizeObserver(() => {
      updateWidthAndPosition();
    });
    observer.observe(btnRef.current!); // Observe the button too!
    if (popupRef.current) observer.observe(popupRef.current); // observe popup for any layout changes that might affect positioning
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
      observer.disconnect();
    };
  }, [open, options]);

  function doSelect(option: any) {
    console.log('Option selected! -- new option:', option);
    setOpen(false);
    if (onChange) onChange(option.value);
  }

  function doBlur(e: any) {
    if (!open && onBlur) {
      onBlur(e);
    }
  }


  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption?.label || "";
  const displayFlag = selectedOption?.icon ? selectedOption.icon : undefined;

  const justify =
    align === "center"
      ? "justify-center"
      : align === "right"
        ? "justify-end"
        : "justify-start";

  const extraLabelJustify =
    extraLabelAlighn === "center"
      ? "justify-center"
      : extraLabelAlighn === "right"
        ? "justify-end"
        : "justify-start";

  return (
    <div ref={containerRef} className={`select-wrapper ${justify} ${className}`}>
      {name && <input placeholder={placeholder} type="hidden" name={name} value={value ?? ""} />}
      <button
        id={id}
        type="button"
        ref={btnRef}
        className={`select-button order-2 peer ${errorValue ? 'select-error' : ''}`}
        onClick={() => { if (!disabled) setOpen(v => !v); }}
        disabled={disabled}
        onBlur={(e) => doBlur(e)}
      >
        <label
          htmlFor={id}
          className={`text-field-label order-1 transition-all duration-150`}
          style={{
            transform: `
                        translate(${selectedOption ?
                `${LabelX ? `${LabelX < 0 ? `-${Math.abs(LabelX)}%` : `${Math.abs(LabelX)}%`}` : '2%'}` :
                `${PlaceHolderX ? `${PlaceHolderX < 0 ? `-${Math.abs(PlaceHolderX)}px` : `${Math.abs(PlaceHolderX)}px`}` : '0'}`}, 
                        
                                  ${selectedOption ?
                `${LabelY ? `${LabelY < 0 ? `-${Math.abs(LabelY)}px` : `${Math.abs(LabelY)}px`}` : '-1rem'}` :
                `${PlaceHolderY ? `${PlaceHolderY < 0 ? `-${Math.abs(PlaceHolderY)}px` : `${Math.abs(PlaceHolderY)}px`}` : '0'}`}) 
                        scale(${selectedOption ? LabelBorderScale / 100 : 1})
                      `
          }}
        >
          {label}
        </label>
        <div className="flex items-center gap-2 z-5">
          {displayFlag && <img src={displayFlag} alt={displayLabel} className={`select-icon ${iconClassName}`} />}
        </div>

        <div className="flex items-center mr-2 gap-2">
          <span className={`${selectedOption ? 'select-label' : 'select-placeholder'} ${selectLabelClassName} `}>{showButtonValue ? value ? value + ' ' + displayLabel : displayLabel : displayLabel}</span>
        </div>
        <div className="ml-auto flex items-center z-5">
          <ChevronDown size={18} />
        </div>
      </button>

      {open && (
        <div ref={popupRef} className={`select-popup divide-y divide-pink-50  ${selectPopupClassName}`} style={{ width: 'max-content', zIndex: zIndex }}>
          {options.map((option) => {
            const isSelected = value === option.value;
            return (
              <div
                key={`${option.value}`}
                className={`select-option ${isSelected ? 'select-selected-option' : ''}`}
                onClick={() => doSelect(option)}
              >
                {option.icon && <img src={option.icon} alt={option.label || option.extra_label} className={`select-icon ${iconClassName}`} />}
                {option.label && <label className={`${optionsLabelClassName}`}>{option.label}</label>}
                <div className={`flex-auto flex items-center ${extraLabelJustify} gap-2`}>
                  {option.extra_label && <label className={`whitespace-nowrap ${extraLabelClassName} mr-2`}>{option.extra_label}</label>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {showError && errorValue && <p id={`${id}-error`} className="error-text" role="alert">{errorValue}</p>}
    </div>
  );
}
