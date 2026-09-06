"use client";
import { Check, ChevronDown } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState, CSSProperties, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { SelectIconOption } from '../../../../types/select';
import FloatingLabel from '../FloatingLabel';

interface Props {
  id?: string;
  label: string;
  /**
   * Drawn ahead of the floating label. Decorative only - it is sized in `em`
   * so it shrinks with the label as the field fills, and `label` remains the
   * accessible name.
   */
  icon?: React.ReactNode;
  options: SelectIconOption[];
  /**
   * The chosen values. `[]` is the canonical "nothing chosen".
   *
   * Typed as an array, but a stray string is tolerated rather than thrown on -
   * see the normalisation in the body.
   */
  value: string[] | string | null | undefined;
  /** Emits the complete next array, never a delta. */
  onChange: (values: string[]) => void;
  /**
   * Focus left the control. Suppressed while the list is open, so opening it
   * - which moves focus into the portal - does not read as leaving the field.
   */
  onBlur?: () => void;
  searchable?: boolean;
  /** Refuses further picks once reached; already-chosen values stay removable. */
  maxSelected?: number;
  /**
   * A value meaning "no preference" (the codebase uses 'any'). Choosing it
   * clears the selection, so "no preference" has exactly one representation -
   * an empty array - rather than two that have to be kept in sync.
   */
  exclusiveValue?: string;
  emptyText?: string;
  disabled?: boolean;
  errorValue?: string;
  showError?: boolean;
  className?: string;
  zIndex?: number;
}

/**
 * Pick several options; each shows as a tag you can remove.
 *
 * Deliberately not a fork of SelectDropdown: the interaction differs in the one
 * way that matters - choosing a row here keeps the list open, because the whole
 * point is picking more than one thing.
 *
 * The tags below the field reuse the `.search-chip` markup the match filters
 * already use, so removable tokens look the same everywhere and this adds no
 * new CSS.
 */
export default function MultiSelect({
  id,
  label,
  icon,
  options,
  value: rawValue,
  onChange,
  onBlur,
  searchable = false,
  maxSelected,
  exclusiveValue,
  emptyText = 'No options found',
  disabled = false,
  errorValue,
  showError = true,
  className = '',
  zIndex = 10,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [popupStyle, setPopupStyle] = useState<CSSProperties | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  /*
   * Tolerate a non-array `value`.
   *
   * The types say string[], but this reads from a profile payload and a
   * localStorage draft that can predate the field becoming multi-select - and a
   * bare string there used to throw on `value.map`, taking down the entire
   * wizard step rather than one control. A shared input should degrade, not
   * bring the page with it. A single string is read as a one-item selection,
   * which is what it meant when it was written.
   */
  const value = useMemo<string[]>(() => {
    if (Array.isArray(rawValue)) return rawValue.filter((v) => v != null).map(String);
    if (typeof rawValue === 'string' && rawValue) return [rawValue];
    return [];
  }, [rawValue]);

  const selected = useMemo(() => new Set(value), [value]);

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

  // Same fixed-position portal treatment as SelectDropdown: rendered inline, a
  // long list grows the document's scroll width, which inside the wizard's
  // translated slider track exposes the neighbouring step.
  useLayoutEffect(() => {
    if (!open) return;
    let rafId: number | null = null;

    const updatePosition = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const margin = 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 260 && rect.top > spaceBelow;

      setPopupStyle({
        position: 'fixed',
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - rect.width - margin)),
        ...(openUp ? { bottom: window.innerHeight - rect.top } : { top: rect.bottom }),
        minWidth: rect.width,
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
      if (popupRef.current && target && popupRef.current.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', onScrollClose, true);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', onScrollClose, true);
    };
  }, [open, options, zIndex]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setPopupStyle(null);
      setActiveIndex(-1);
    }
  }, [open]);

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

  const atLimit = maxSelected !== undefined && value.length >= maxSelected;

  function toggle(optionValue: string) {
    if (exclusiveValue !== undefined && optionValue === exclusiveValue) {
      onChange([]);
      return;
    }
    if (selected.has(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
      return;
    }
    if (atLimit) return;
    onChange([...value, optionValue]);
  }

  const labelFor = (v: string) =>
    uniqueOptions.find(o => String(o.value) === v)?.label ?? v;

  // Empty renders NOTHING, not a placeholder. The floating label sits centred
  // in the control until something is chosen, so any text here would print
  // directly underneath it. SelectDropdown behaves the same way.
  const summary = value.length === 0
    ? ''
    : value.length === 1
      ? labelFor(value[0])
      : `${value.length} selected`;

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === 'Escape') { setOpen(false); return; }
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault(); setOpen(true); return;
    }
    if (!open) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(i => {
        const next = i + delta;
        if (next < 0) return visibleOptions.length - 1;
        if (next >= visibleOptions.length) return 0;
        return next;
      });
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && activeIndex >= 0) {
      e.preventDefault();
      const option = visibleOptions[activeIndex];
      if (option) toggle(String(option.value));
    }
  }

  const popup = open && popupStyle ? createPortal(
    <div ref={popupRef} style={popupStyle} className="select-popup">
      {searchable && (
        <div className="select-search">
          <input
            type="text"
            className="select-search-input"
            value={search}
            autoFocus
            placeholder={`Search ${label.toLowerCase()}...`}
            onChange={(e) => { setSearch(e.target.value); setActiveIndex(-1); }}
            aria-label={`Search ${label}`}
            // The search box has focus, so it owns the keyboard while open -
            // without this, arrows and Enter would do nothing at all.
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setOpen(false); return; }
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const delta = e.key === 'ArrowDown' ? 1 : -1;
                setActiveIndex(i => {
                  const next = i + delta;
                  if (next < 0) return visibleOptions.length - 1;
                  if (next >= visibleOptions.length) return 0;
                  return next;
                });
                return;
              }
              if (e.key === 'Enter' && visibleOptions.length > 0) {
                e.preventDefault();
                const option = visibleOptions[activeIndex >= 0 ? activeIndex : 0];
                if (option) toggle(String(option.value));
              }
            }}
          />
        </div>
      )}

      <div role="listbox" aria-multiselectable="true" aria-label={label} className="select-options">
        {visibleOptions.length === 0 && <div className="select-empty">{emptyText}</div>}

        {visibleOptions.map((option, index) => {
          const optionValue = String(option.value);
          const isSelected = selected.has(optionValue);
          const isExclusive = exclusiveValue !== undefined && optionValue === exclusiveValue;
          // The exclusive row reads as chosen when nothing else is.
          const shown = isExclusive ? value.length === 0 : isSelected;
          const blocked = atLimit && !isSelected && !isExclusive;

          return (
            <div
              key={optionValue}
              role="option"
              aria-selected={shown}
              aria-disabled={blocked || undefined}
              className={`select-option ${shown ? 'select-selected-option' : ''} ${index === activeIndex ? 'select-option-active' : ''} ${blocked ? 'select-option-blocked' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              // Selecting deliberately does NOT close the popup.
              onClick={() => !blocked && toggle(optionValue)}
            >
              {option.label && <span className="select-option-label">{option.label}</span>}
              {option.extra_label && <span className="select-option-extra">{option.extra_label}</span>}
              {shown && <Check className="select-option-check" size={16} />}
            </div>
          );
        })}
      </div>

      {atLimit && (
        <p className="select-limit-note">
          {maxSelected} is the maximum. Remove one to choose another.
        </p>
      )}
    </div>,
    document.body,
  ) : null;

  return (
    <div className={`multiselect ${className}`}>
      {/* Structure mirrors SelectDropdown deliberately: `.select-wrapper` is
          what supplies the positioning context for the absolutely-positioned
          floating label, and that label has to be a CHILD of the button because
          the rules that float it are descendant selectors
          (`.select-button[data-filled="true"] .text-field-label`). Getting
          either wrong lets the label escape its panel entirely. */}
      <div className="select-wrapper">
        <button
          id={id}
          ref={btnRef}
          type="button"
          disabled={disabled}
          className={`select-button ${errorValue ? 'select-error' : ''}`}
          data-filled={value.length > 0 ? 'true' : 'false'}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={errorValue ? 'true' : 'false'}
          onClick={() => !disabled && setOpen(o => !o)}
          onKeyDown={onKeyDown}
          onBlur={() => { if (!open) onBlur?.(); }}
        >
          <FloatingLabel htmlFor={id} label={label} icon={icon} />

          <span className="select-label truncate">{summary}</span>

          {/* Rotation on open comes from
              `.select-button[aria-expanded="true"] .select-chevron`. */}
          <span className="select-chevron" aria-hidden="true">
            <ChevronDown size={18} />
          </span>
        </button>
      </div>

      {/* Same markup as the match-filter chips, so removable tokens look the
          same wherever they appear. */}
      {value.length > 0 && (
        <div className="search-chips multiselect-tags">
          {value.map((v) => (
            <button
              key={v}
              type="button"
              className="search-chip"
              onClick={() => toggle(v)}
              aria-label={`Remove ${labelFor(v)}`}
            >
              <span className="search-chip-key">{labelFor(v)}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
          {value.length > 1 && (
            <button type="button" className="search-chip-clear" onClick={() => onChange([])}>
              Clear all
            </button>
          )}
        </div>
      )}

      {showError && errorValue && <p className="error-text" role="alert">{errorValue}</p>}
      {popup}
    </div>
  );
}
