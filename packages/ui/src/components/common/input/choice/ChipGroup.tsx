"use client";

import React from "react";

export interface ChipOption<T extends string | number = string> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string | number> {
  label?: string;
  /** Decorative glyph drawn ahead of the legend. */
  icon?: React.ReactNode;
  options: ChipOption<T>[];
  value?: T | null;
  onChange: (value: T) => void;
  className?: string;
  chipClassName?: string;
  error?: string;
  name?: string;
  /** Shows a tick inside the selected chip. */
  showCheck?: boolean;
}

const Check = () => (
  <svg className="chip-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

/**
 * Single-select pill buttons - a lighter alternative to a dropdown when the
 * option list is short enough to show all at once.
 */
export default function ChipGroup<T extends string | number>({
  label,
  icon,
  options,
  value,
  onChange,
  className = "",
  chipClassName = "",
  error,
  name,
  showCheck = true,
}: ChipGroupProps<T>) {
  return (
    <fieldset className={`chip-group ${className}`}>
      {label && (
        <legend className={`chip-group-label ${icon ? 'chip-group-label-icon' : ''}`}>
          {icon && (
            <span className="field-label-icon" aria-hidden="true">
              {icon}
            </span>
          )}
          {label}
        </legend>
      )}
      <div className="chip-group-options" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              name={name}
              onClick={() => onChange(option.value)}
              className={`chip ${selected ? "chip-selected" : ""} ${chipClassName}`}
            >
              {selected && showCheck && <Check />}
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
    </fieldset>
  );
}
