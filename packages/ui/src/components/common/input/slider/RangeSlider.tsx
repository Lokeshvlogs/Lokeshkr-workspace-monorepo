"use client";

import React from "react";

interface RangeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Captions shown under the track ends, e.g. ["Never", "Daily"]. */
  endLabels?: [string, string];
  /**
   * Words describing the current value, spread evenly across the range - far
   * more meaningful than a bare "7/10" on a subjective question.
   */
  captions?: string[];
  /** Draws a tick per step. Off for wide ranges where ticks become noise. */
  showTicks?: boolean;
  className?: string;
}

/** Labelled slider with a filled track, ticks and a plain-language caption. */
export default function RangeSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  endLabels,
  captions,
  showTicks = true,
  className = "",
}: RangeSliderProps) {
  const id = `range-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  const span = max - min || 1;
  const progress = ((value - min) / span) * 100;

  const caption = captions?.length
    ? captions[Math.min(captions.length - 1, Math.round(((value - min) / span) * (captions.length - 1)))]
    : undefined;

  const tickCount = Math.floor(span / step) + 1;

  return (
    <div className={`range-slider ${className}`}>
      <div className="range-slider-header">
        <label htmlFor={id} className="range-slider-label">{label}</label>
        <span className="range-slider-value">{caption ?? value}</span>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-input"
        style={{ ["--range-progress" as string]: `${progress}%` } as React.CSSProperties}
        aria-valuetext={caption ?? String(value)}
      />

      {showTicks && tickCount <= 21 && (
        <div className="range-slider-ticks" aria-hidden="true">
          {Array.from({ length: tickCount }, (_, i) => (
            <span
              key={i}
              className={`range-tick ${min + i * step <= value ? "range-tick-active" : ""}`}
            />
          ))}
        </div>
      )}

      {endLabels && (
        <div className="range-slider-ends">
          <span>{endLabels[0]}</span>
          <span>{endLabels[1]}</span>
        </div>
      )}
    </div>
  );
}
