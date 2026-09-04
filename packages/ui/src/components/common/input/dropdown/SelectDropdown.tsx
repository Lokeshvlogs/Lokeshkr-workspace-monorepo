"use client";
import { Check, ChevronDown } from 'lucide-react';
import React, { useState, useRef, useEffect, useMemo, CSSProperties, useLayoutEffect } from 'react';
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
  /**
   * @deprecated The floating label is CSS-driven now (see `.text-field-label`).
   * Still accepted so existing call sites compile, but they position nothing -
   * the label can no longer stray outside the control and get clipped.
   */
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
  /**
   * Native-select style type-ahead: typing "sw" jumps to the first option
   * starting with "sw". Matches label, extra label and value, so it works
   * for lists whose label is not the human-readable part (country dial codes
   * are labelled "+46" with the country name in extra_label).
   */
  typeahead?: boolean;
  /** Milliseconds before the typed prefix resets. */
  typeaheadTimeout?: number;
}

export default function SelectDropdown({ id, label, placeholder, value, name, options, className = '', selectLabelClassName = '', selectPopupClassName = '', showButtonValue = false, iconClassName = '', optionsLabelClassName = '', extraLabelClassName = '', extraLabelAlighn = 'right', onChange, onBlur, onClick, disabled = false, align = 'left', errorValue, showError = true, LabelBorderScale = 75, PlaceHolderX = 2, PlaceHolderY = 5, LabelX = 2, LabelY = -18, labelClassName, zIndex = 10, searchable = false, emptyText = 'No options found', typeahead = true, typeaheadTimeout = 800 }: Props) {
  
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [popupStyle, setPopupStyle] = useState<CSSProperties | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const typedRef = useRef<string>('');
  const typedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setActiveIndex(-1);
      typedRef.current = '';
    }
  }, [open]);

  useEffect(() => () => {
    if (typedTimer.current) clearTimeout(typedTimer.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const selectedIdx = options.findIndex(o => o.value === value);
    setActiveIndex(selectedIdx);
    if (selectedIdx >= 0) requestAnimationFrame(() => scrollOptionIntoView(selectedIdx));
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


  /**
   * Options with any repeated value dropped, first occurrence winning.
   *
   * A duplicate value is always a data bug: both rows set the same thing, so
   * the second is unreachable however it is drawn. Filtering it here removes
   * the phantom row and keeps `value` usable as a React key - the option lists
   * are long hand-maintained files (the caste list alone is ~1,600 entries),
   * and a repeat there used to surface only as a duplicate-key warning.
   */
  const uniqueOptions = useMemo(() => {
    const seen = new Set<string>();
    return options.filter(o => {
      const key = String(o.value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [options]);

  const visibleOptions = searchable && search
    ? uniqueOptions.filter(o =>
        `${o.label ?? ''} ${o.extra_label ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    : uniqueOptions;

  /** Text a typed prefix is matched against, most human-readable first. */
  function searchableTextsFor(option: any): string[] {
    return [option?.label, option?.extra_label, option?.value]
      .filter(Boolean)
      .map((t: any) => String(t).toLowerCase());
  }

  function findByPrefix(prefix: string, from = 0): number {
    if (!prefix) return -1;
    const list = visibleOptions;
    // Wrap around so repeated searches keep cycling through the list.
    for (let i = 0; i < list.length; i += 1) {
      const idx = (from + i) % list.length;
      if (searchableTextsFor(list[idx]).some(t => t.startsWith(prefix))) return idx;
    }
    return -1;
  }

  function scrollOptionIntoView(index: number) {
    const node = listRef.current?.querySelector(`[data-option-index="${index}"]`);
    if (node && 'scrollIntoView' in node) {
      (node as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }

  function moveActive(delta: number) {
    if (visibleOptions.length === 0) return;
    setActiveIndex(prev => {
      const start = prev < 0
        ? visibleOptions.findIndex(o => o.value === value)
        : prev;
      const base = start < 0 ? (delta > 0 ? -1 : 0) : start;
      const next = Math.min(visibleOptions.length - 1, Math.max(0, base + delta));
      scrollOptionIntoView(next);
      return next;
    });
  }

  function handleTypeahead(char: string): boolean {
    if (!typeahead) return false;

    if (typedTimer.current) clearTimeout(typedTimer.current);
    typedTimer.current = setTimeout(() => { typedRef.current = ''; }, typeaheadTimeout);

    const buffer = typedRef.current + char.toLowerCase();
    typedRef.current = buffer;

    let match = findByPrefix(buffer);
    // Nothing matches the accumulated prefix - treat this key as a fresh start,
    // which is how a native <select> behaves.
    if (match === -1 && buffer.length > 1) {
      typedRef.current = char.toLowerCase();
      match = findByPrefix(typedRef.current);
    }

    if (match === -1) return false;

    setOpen(true);
    setActiveIndex(match);
    // The popup may not be mounted yet on the first keystroke.
    requestAnimationFrame(() => scrollOptionIntoView(match));
    return true;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      moveActive(e.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      if (!open) return;
      e.preventDefault();
      const idx = e.key === 'Home' ? 0 : visibleOptions.length - 1;
      setActiveIndex(idx);
      scrollOptionIntoView(idx);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      // A space mid-search belongs to the typed prefix ("united st..."), not to
      // activating the button.
      if (e.key === ' ' && typeahead && typedRef.current) {
        if (handleTypeahead(' ')) e.preventDefault();
        return;
      }
      if (!open) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (activeIndex >= 0 && activeIndex < visibleOptions.length) {
        e.preventDefault();
        doSelect(visibleOptions[activeIndex]);
      }
      return;
    }
    // Printable single characters drive the type-ahead.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (handleTypeahead(e.key)) e.preventDefault();
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
        className={`select-button ${errorValue ? 'select-error' : ''}`}
        data-filled={selectedOption ? 'true' : 'false'}
        onClick={() => { if (!disabled) setOpen(v => !v); }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={errorValue ? 'true' : 'false'}
        disabled={disabled}
        onBlur={(e) => doBlur(e)}
      >
        {/* Floated by CSS off data-filled / aria-expanded - see .text-field-label
            in styles.css. The old per-call-site LabelX/LabelY nudges are gone. */}
        <label htmlFor={id} className={`text-field-label ${labelClassName ?? ''}`}>
          {label}
        </label>

        {displayFlag && <img src={displayFlag} alt={displayLabel} className={`select-icon ${iconClassName}`} />}

        <span className={`${selectedOption ? 'select-label' : 'select-placeholder'} truncate ${selectLabelClassName}`}>
          {showButtonValue && value ? `${value} ${displayLabel}` : displayLabel}
        </span>

        <span className="select-chevron" aria-hidden="true">
          <ChevronDown size={18} />
        </span>
      </button>

      {open && popupStyle && typeof document !== 'undefined' && createPortal(
        <div
          ref={popupRef}
          className={`select-popup ${selectPopupClassName}`}
          style={popupStyle}
        >
          {searchable && (
            <div className="select-search">
              <input
                type="text"
                autoFocus
                className="select-search-input"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false);
                    return;
                  }
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    moveActive(e.key === 'ArrowDown' ? 1 : -1);
                    return;
                  }
                  if (e.key === 'Enter' && visibleOptions.length > 0) {
                    e.preventDefault();
                    doSelect(visibleOptions[activeIndex >= 0 ? activeIndex : 0]);
                  }
                }}
              />
            </div>
          )}
          {/* The only scrolling box. Rows are clipped by it, so one that has
              passed behind the search header cannot be drawn above it. */}
          <div ref={listRef} role="listbox" aria-label={label} className="select-options">
          {visibleOptions.length === 0 && (
            <div className="select-empty">{emptyText}</div>
          )}
          {visibleOptions.map((option, index) => {
            const isSelected = value === option.value;
            return (
              <div
                key={`${option.value}`}
                data-option-index={index}
                role="option"
                aria-selected={isSelected}
                className={`select-option ${isSelected ? 'select-selected-option' : ''} ${index === activeIndex ? 'select-option-active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => doSelect(option)}
              >
                {option.icon && <img src={option.icon} alt={option.label || option.extra_label} className={`select-icon ${iconClassName}`} />}
                {option.label && <span className={`select-option-label ${optionsLabelClassName}`}>{option.label}</span>}
                <span className={`select-option-extra ${extraLabelJustify}`}>
                  {option.extra_label && <span className={`truncate ${extraLabelClassName}`}>{option.extra_label}</span>}
                </span>
                <Check size={16} strokeWidth={2.75} className="select-option-check" aria-hidden="true" />
              </div>
            )
          })}
          </div>
        </div>,
        document.body
      )}
      {showError && errorValue && <p id={`${id}-error`} className="error-text" role="alert">{errorValue}</p>}
    </div>
  );
}
