"use client";

import React from "react";

interface FloatingLabelProps {
  htmlFor?: string;
  /** The accessible, visible label text. */
  label: string;
  /**
   * Decorative only - it is marked `aria-hidden` and sized in `em`, so it
   * shrinks along with the label as the field floats it up on fill.
   */
  icon?: React.ReactNode;
  className?: string;
}

/**
 * The floated label shared by TextField, SelectDropdown and MultiSelect.
 *
 * It has to stay a direct child of the control it labels: the rules that float
 * it are descendant selectors keyed off the control's `data-filled` and
 * `aria-expanded` (see `.text-field-label` in styles.css). This component only
 * standardises the icon slot, which was otherwise about to be written out
 * three times.
 */
export default function FloatingLabel({
  htmlFor,
  label,
  icon,
  className = "",
}: FloatingLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-field-label ${icon ? "text-field-label-icon" : ""} ${className}`}
    >
      {/* Without an icon the label keeps its own ellipsis, so the plain string
          is rendered directly rather than wrapped - see the modifier's CSS. */}
      {icon ? (
        <>
          <span className="field-label-icon" aria-hidden="true">
            {icon}
          </span>
          <span className="field-label-text">{label}</span>
        </>
      ) : (
        label
      )}
    </label>
  );
}
