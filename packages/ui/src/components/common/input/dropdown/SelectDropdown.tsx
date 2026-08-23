"use client";
import { ChevronDown } from 'lucide-react';
import React, { useState, useRef, useEffect, CSSProperties, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { SelectIconOption } from '../../../../types/select';


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
  /** Adds a filter box inside the popup - use for long option lists. */
  searchable?: boolean;
  /** Shown when the filter matches nothing. */
  emptyText?: string;
}

export default function SelectDropdown({ id, label, placeholder, value, name, options, className = '', selectLabelClassName = '', selectPopupClassName = '', showButtonValue = false, iconClassName = '', optionsLabelClassName = '', extraLabelClassName = '', extraLabelAlighn = 'right', onChange, onBlur, onClick, disabled = false, align = 'left', errorValue, showError = true, LabelBorderScale = 75, PlaceHolderX = 2, PlaceHolderY = 5, LabelX = 2, LabelY = -18, labelClassName, zIndex = 10, searchable = false, emptyText = 'No options found' }: Props) {
  
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [popupStyle, setPopupStyle] = useState<CSSProperties | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

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


  /*
   * The popup is portaled to <body> and placed with fixed coordinates.
   * Rendered inline it was `position: absolute` with `width: max-content`, so a
   * long option list (caste/community, cities) grew wider than the viewport and
   * extended the document's scroll width. Because the wizard's slider track is
   * `width: 500%` and translated, that extra width exposed the neighbouring
   * step - and the layout change fired a scroll event, which this component's
   * own close-on-scroll handler acted on, so the first click looked inert.
   */
  useLayoutEffect(() => {
    if (!open) return;

    let rafId: number | null = null;

    const updatePosition = () => {
      const btn = btnRef.current;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const margin = 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Flip above the field when there is not enough room underneath.
      const openUp = spaceBelow < 260 && spaceAbove > spaceBelow;

      setPopupStyle({
        position: 'fixed',
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - rect.width - margin)),
        ...(openUp
          ? { bottom: window.innerHeight - rect.top }
          : { top: rect.bottom }),
        minWidth: rect.width,
        // Never let the popup push past the viewport edge.
        maxWidth: Math.max(rect.width, window.innerWidth - rect.left - margin),
        width: 'max-content',
        zIndex: Math.max(zIndex, 9999),
      });
    };

    const schedule = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePosition);
    };

    schedule();

    const onScrollClose = (e?: Event) => {
      const target = e && (e.target as Node | null);
      // Scrolling within the option list must not dismiss it.
      if (popupRef.current && target && popupRef.current.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', onScrollClose, true);
    document.addEventListener('wheel', onScrollClose as EventListener, { passive: true, capture: true } as any);
    document.addEventListener('touchmove', onScrollClose as EventListener, { passive: true, capture: true } as any);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', onScrollClose, true);
      document.removeEventListener('wheel', onScrollClose as EventListener, true as any);
      document.removeEventListener('touchmove', onScrollClose as EventListener, true as any);
    };
  }, [open, options, zIndex]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setPopupStyle(null);
    }
  }, [open]);

  function doSelect(option: any) {
    setOpen(false);
    if (onChange) onChange(option.value);
  }

  function doBlur(e: any) {
    if (!open && onBlur) {
      onBlur(e);
    }
  }


  const visibleOptions = searchable && search
    ? options.filter(o =>
        `${o.label ?? ''} ${o.extra_label ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    : options;

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
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        aria-haspopup="listbox"
        aria-expanded={open}
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

      {open && popupStyle && typeof document !== 'undefined' && createPortal(
        <div ref={popupRef} className={`select-popup divide-y divide-pink-50 ${selectPopupClassName}`} style={popupStyle}>
          {searchable && (
            <input
              type="text"
              autoFocus
              className="sticky top-0 z-10 mb-1 w-full rounded-md border border-color-border bg-color-bg p-2 text-base focus:outline-none focus:ring-2 focus:ring-color-primary-light"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
                if (e.key === 'Enter' && visibleOptions.length > 0) {
                  e.preventDefault();
                  doSelect(visibleOptions[0]);
                }
              }}
            />
          )}
          {visibleOptions.length === 0 && (
            <div className="p-2 text-color-placeholder-text">{emptyText}</div>
          )}
          {visibleOptions.map((option) => {
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
        </div>,
        document.body
      )}
      {showError && errorValue && <p id={`${id}-error`} className="error-text" role="alert">{errorValue}</p>}
    </div>
  );
}
