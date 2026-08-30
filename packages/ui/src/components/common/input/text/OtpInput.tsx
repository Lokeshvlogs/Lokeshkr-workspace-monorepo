"use client";

import React, { useEffect, useMemo, useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired once the last box is filled, so the form can submit itself. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  errorValue?: string;
  autoFocus?: boolean;
  label?: string;
  id?: string;
}

/**
 * Fixed-length numeric passcode entry.
 *
 * One input per digit rather than a single field: it makes the expected length
 * obvious, gives each digit a big touch target, and lets the caret land on the
 * digit the member wants to correct. `value` is still a plain string, so the
 * caller never deals with the per-box state.
 */
export const OtpInput = ({
  value,
  onChange,
  onComplete,
  length = 4,
  disabled = false,
  errorValue,
  autoFocus = false,
  label,
  id = "otp",
}: OtpInputProps) => {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(() => {
    const chars = value.replace(/\D/g, "").slice(0, length).split("");
    return Array.from({ length }, (_, i) => chars[i] ?? "");
  }, [value, length]);

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next: string) => {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const setDigit = (index: number, digit: string) => {
    const chars = [...digits];
    chars[index] = digit;
    // Trailing blanks are dropped so `value.length` is a usable "how far in are
    // we" measure and the completion check stays a simple length comparison.
    commit(chars.join("").replace(/\s/g, ""));
  };

  const handleChange = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    if (!typed) {
      setDigit(index, "");
      return;
    }

    // A keyboard gives one character; an autofilled SMS code arrives whole.
    if (typed.length > 1) {
      const filled = (digits.join("").slice(0, index) + typed).slice(0, length);
      commit(filled);
      inputs.current[Math.min(filled.length, length - 1)]?.focus();
      return;
    }

    setDigit(index, typed);
    if (index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // Nothing to delete here, so step back and clear the previous box -
      // otherwise backspace appears to do nothing on an empty field.
      e.preventDefault();
      setDigit(index - 1, "");
      inputs.current[index - 1]?.focus();
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    commit(pasted);
    inputs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="otp-field">
      {label && (
        <span className="field-label" id={`${id}-label`}>
          {label}
        </span>
      )}
      <div
        className="otp-boxes"
        role="group"
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-describedby={errorValue ? `${id}-error` : undefined}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputs.current[index] = el;
            }}
            id={index === 0 ? id : `${id}-${index}`}
            className={`otp-box ${errorValue ? "otp-box-error" : ""}`}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            /* maxLength 1 keeps typing to a digit, but a paste or an SMS
               autofill still arrives whole and is spread across the boxes. */
            maxLength={1}
            aria-label={`Digit ${index + 1} of ${length}`}
          />
        ))}
      </div>
      {errorValue && (
        <p id={`${id}-error`} className="error-text" role="alert">
          {errorValue}
        </p>
      )}
    </div>
  );
};
