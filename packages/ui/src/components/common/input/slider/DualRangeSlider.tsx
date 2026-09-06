"use client";

import React from "react";

interface DualRangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  /** `[null, null]` means no preference expressed yet. */
  value: [number | null, number | null];
  /** Always emits a concrete pair; use `onClear` for "no preference". */
  onChange: (value: [number, number]) => void;
  /** Renders a raw number for display, e.g. 64 -> "5 ft 4 in". */
  format?: (n: number) => string;
  /** Smallest allowed gap between the thumbs. */
  minGap?: number;
  onClear?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * A two-thumb range. Min can never cross max.
 *
 * Built as a sibling of RangeSlider rather than an extension of it: that one is
 * `value: number`, and widening it to `number | [number, number]` would force
 * every call site to narrow a union for a capability it does not use.
 *
 * Two stacked native range inputs, so each thumb is separately focusable and
 * arrow keys, Home/End and per-thumb `aria-valuenow` all come from the platform
 * rather than a drag library.
 */
export default function DualRangeSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  format = (n) => String(n),
  minGap = 1,
  onClear,
  disabled = false,
  className = "",
}: DualRangeSliderProps) {
  const id = `dual-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  const span = max - min || 1;

  // Until someone interacts, an unset range shows as the full span - which
  // reads correctly as "anyone" - while `value` stays null so the caller can
  // still tell that nothing was chosen.
  const untouched = value[0] === null && value[1] === null;
  const lo = value[0] ?? min;
  const hi = value[1] ?? max;

  /*
   * Clamp, never swap.
   *
   * Dragging the low thumb past the high one could either push the other along
   * or exchange their roles. Swapping means the thumb under the cursor is no
   * longer the one being dragged, so the handle appears to stick while the
   * other end runs away. Clamping just stops.
   */
  const setLow = (raw: number) => onChange([Math.min(raw, hi - minGap), hi]);
  const setHigh = (raw: number) => onChange([lo, Math.max(raw, lo + minGap)]);

  const pct = (n: number) => ((n - min) / span) * 100;

  return (
    <div className={`dual-range ${disabled ? "dual-range-disabled" : ""} ${className}`}>
      <div className="dual-range-head">
        <span className="dual-range-label" id={`${id}-label`}>{label}</span>
        <span className="dual-range-readout">
          {untouched ? "Any" : `${format(lo)} – ${format(hi)}`}
        </span>
      </div>

      <div
        className="dual-range-track-wrap"
        style={{
          // Two percentages rather than RangeSlider's single --range-progress,
          // so that component's fill is untouched.
          ["--range-start" as any]: `${pct(lo)}%`,
          ["--range-end" as any]: `${pct(hi)}%`,
        }}
      >
        <span className="dual-range-rail" aria-hidden="true" />
        <span className="dual-range-fill" aria-hidden="true" />

        <input
          type="range"
          className="dual-range-input dual-range-input-low"
          min={min}
          max={max}
          step={step}
          value={lo}
          disabled={disabled}
          aria-labelledby={`${id}-label`}
          aria-label={`Minimum ${label}`}
          aria-valuetext={format(lo)}
          onChange={(e) => setLow(Number(e.target.value))}
        />
        <input
          type="range"
          className="dual-range-input dual-range-input-high"
          min={min}
          max={max}
          step={step}
          value={hi}
          disabled={disabled}
          aria-labelledby={`${id}-label`}
          aria-label={`Maximum ${label}`}
          aria-valuetext={format(hi)}
          onChange={(e) => setHigh(Number(e.target.value))}
        />
      </div>

      <div className="dual-range-ends" aria-hidden="true">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>

      {onClear && !untouched && (
        <div className="dual-range-actions">
          <button type="button" className="dual-range-clear" onClick={onClear} disabled={disabled}>
            No preference
          </button>
        </div>
      )}
    </div>
  );
}
