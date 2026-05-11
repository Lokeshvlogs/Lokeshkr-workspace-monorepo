"use client";

import React from "react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
  labelClassName?: string;
  errorValue?: string;
  showError?: boolean;
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
  labelClassName, 
  errorValue, 
  showError = true, 
  LabelBorderScale = 75, 
  focuseValue = false, 
  LabelX = 0, 
  LabelY = -20, 
  PlaceholderX = 0, 
  PlaceholderY = 0, 
  ...props 
}: TextFieldProps) => {

  // KEY FIX: Check if the input has text or is focused
  // Using String(props.value || "") to handle undefined/null safely
  const isNotEmpty = String(props.value || "").trim().length > 0;
  const isActive = focuseValue || isNotEmpty;

  // Helper to format the coordinates safely
  const getX = isActive 
    ? (LabelX !== 0 ? `${LabelX}%` : '2%') 
    : (PlaceholderX !== 0 ? `${PlaceholderX}px` : '0');

  const getY = isActive 
    ? (LabelY !== 0 ? `${LabelY}px` : '-1rem') 
    : (PlaceholderY !== 0 ? `${PlaceholderY}px` : '0');

  const scale = isActive ? LabelBorderScale / 100 : 1;

  return (
    <div className="input-wrapper relative">
        <input
          {...props}
          id={id}
          aria-invalid={errorValue ? 'true' : 'false'}
          aria-describedby={`${id}-error`}
          className={`input peer ${errorValue ? 'input-error' : ''} ${props.className}`}
        />
        <label
            htmlFor={id}
            className={`text-field-label ${errorValue ? 'text-color-error' : ''} ${labelClassName}`}
            style={{ 
              position: 'absolute',
              pointerEvents: 'none', // Ensures clicks pass through to input
              transition: 'transform 0.2s ease, color 0.2s ease',
              transform: `translate(${getX}, ${getY}) scale(${scale})`,
              transformOrigin: 'left top'
            }}
          >
            {label}
        </label>
        {showError && errorValue && (
          <p id={`${id}-error`} className="error-text" role="alert">
            {errorValue}
          </p>
        )}
    </div>
  );
};