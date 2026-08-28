"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
  labelClassName?: string;
  errorValue?: string;
  showError?: boolean;
  /** @deprecated See the note on TextField - label placement is CSS-driven. */
  focuseValue?: boolean;
  LabelBorderScale?: number;
  LabelX?: number;
  LabelY?: number;
  PlaceholderX?: number;
  PlaceholderY?: number;
}

export const PasswordInput = ({
  label,
  id,
  errorValue,
  showError = true,
  className = "",
  labelClassName = "",
  // Deprecated positioning props - kept out of the DOM spread.
  focuseValue,
  LabelBorderScale,
  LabelX,
  LabelY,
  PlaceholderX,
  PlaceholderY,
  placeholder,
  ...props
}: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="input-wrapper">
      <input
        {...props}
        id={id}
        type={isVisible ? "text" : "password"}
        placeholder={placeholder || " "}
        aria-invalid={errorValue ? "true" : "false"}
        aria-describedby={errorValue ? `${id}-error` : undefined}
        /* Right padding keeps the value clear of the reveal button. */
        className={`input pr-12 ${errorValue ? "input-error" : ""} ${className}`}
      />
      <label htmlFor={id} className={`text-field-label ${labelClassName}`}>
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsVisible((v) => !v)}
        className="password-toggle"
        aria-label={isVisible ? "Hide password" : "Show password"}
      >
        {isVisible ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
      </button>

      {showError && errorValue && (
        <p id={`${id}-error`} className="error-text" role="alert">
          {errorValue}
        </p>
      )}
    </div>
  );
};
