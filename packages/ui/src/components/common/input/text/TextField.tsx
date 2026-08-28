"use client";

import React from "react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
  labelClassName?: string;
  errorValue?: string;
  showError?: boolean;
  /**
   * @deprecated Label placement is CSS-driven now (see `.text-field-label` in
   * styles.css). These are accepted so existing call sites keep compiling, but
   * they no longer move anything - the label can never leave the field's box,
   * which is what used to get clipped by the wizard's overflow-hidden track.
   */
  LabelBorderScale?: number;
  focuseValue?: boolean;
  LabelX?: number;
  LabelY?: number;
  PlaceholderX?: number;
  PlaceholderY?: number;
}

export const TextField = ({
  label,
  id,
  className = "",
  labelClassName = "",
  errorValue,
  showError = true,
  // Deprecated positioning props - destructured only to keep them out of the
  // DOM spread below.
  LabelBorderScale,
  focuseValue,
  LabelX,
  LabelY,
  PlaceholderX,
  PlaceholderY,
  placeholder,
  ...props
}: TextFieldProps) => (
  <div className="input-wrapper">
    <input
      {...props}
      id={id}
      /* A non-empty placeholder is what makes `:not(:placeholder-shown)` flip
         the label to its floated state. It renders transparent until focus. */
      placeholder={placeholder || " "}
      aria-invalid={errorValue ? "true" : "false"}
      aria-describedby={errorValue ? `${id}-error` : undefined}
      className={`input ${errorValue ? "input-error" : ""} ${className}`}
    />
    <label htmlFor={id} className={`text-field-label ${labelClassName}`}>
      {label}
    </label>
    {showError && errorValue && (
      <p id={`${id}-error`} className="error-text" role="alert">
        {errorValue}
      </p>
    )}
  </div>
);
