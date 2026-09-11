"use client";

import React from "react";

import type { ChipOption } from "./ChipGroup";

interface Props {
  label?: string;
  icon?: React.ReactNode;
  options: ChipOption[];
  /** Chosen values. `[]` is the canonical "nothing chosen". */
  value: string[];
  /** Emits the complete next array, never a delta. */
  onChange: (values: string[]) => void;
  /** Refuses further picks once reached; already-chosen values stay removable. */
  maxSelected?: number;
  /**
   * A line under the label - what to choose, or how many are still wanted.
   *
   * Belongs to the group rather than being placed around it by the caller: it
   * has to sit between the legend and the chips, and anything rendered outside
   * the fieldset lands above the label instead.
   */
  hint?: string;
  className?: string;
}

/**
 * Pick several from a short list, as chips.
 *
 * The multi-select sibling of `ChipGroup`, which is single-select and cannot be
 * reused here: it is a `radiogroup`, and a radio group with several things
 * checked is a lie to a screen reader. This is a plain `group` of toggle
 * buttons carrying `aria-pressed`.
 *
 * Chips rather than a dropdown because seeing the whole vocabulary is the
 * point - somebody picking hobbies is browsing for things that describe them,
 * not looking up a value they already had in mind.
 */
export default function ChipMultiGroup({
  label,
  icon,
  options,
  value,
  onChange,
  maxSelected,
  hint,
  className = "",
}: Props) {
  const chosen = new Set(value);
  const atLimit = maxSelected !== undefined && value.length >= maxSelected;

  const toggle = (optionValue: string) => {
    if (chosen.has(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
      return;
    }
    if (atLimit) return;
    onChange([...value, optionValue]);
  };

  return (
    <fieldset className={`chip-group ${className}`}>
      {label && (
        <legend className={`chip-group-label ${icon ? "chip-group-label-icon" : ""}`}>
          {icon && (
            <span className="field-label-icon" aria-hidden="true">
              {icon}
            </span>
          )}
          {label}
          {maxSelected !== undefined && value.length > 0 && (
            <span className="chip-count">
              {value.length}/{maxSelected}
            </span>
          )}
        </legend>
      )}

      {hint && <p className="chip-group-hint">{hint}</p>}

      <div className="chip-group-options" role="group" aria-label={label}>
        {options.map((option) => {
          const optionValue = String(option.value);
          const selected = chosen.has(optionValue);
          // Blocked rather than hidden: the cap should read as "that is enough"
          // and not as options disappearing while you browse.
          const blocked = atLimit && !selected;

          return (
            <button
              key={optionValue}
              type="button"
              aria-pressed={selected}
              disabled={blocked}
              onClick={() => toggle(optionValue)}
              className={`chip ${selected ? "chip-selected" : ""}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
