"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
  labelClassName?: string;
  errorValue?: string;
  showError?: boolean;
  focuseValue?: boolean;
  LabelBorderScale?: number;
  LabelX?: number;
  LabelY?: number;
  PlaceholderX?: number;
  PlaceholderY?: number;
}

export const PasswordInput = ({ 
  label, 
  focuseValue = false,
  errorValue,
  showError = true, 
  LabelBorderScale = 75, 
  LabelX = 0, 
  LabelY = -20, 
  PlaceholderX = 0, 
  PlaceholderY = 0, 
  className = '',
  labelClassName = '',
  ...props
}: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const isNotEmpty = String(props.value || "").trim().length > 0;
  const isActive = focuseValue || isNotEmpty;

  const getX = isActive 
    ? (LabelX !== 0 ? `${LabelX}%` : '2%') 
    : (PlaceholderX !== 0 ? `${PlaceholderX}px` : '0');

  const getY = isActive 
    ? (LabelY !== 0 ? `${LabelY}px` : '-1rem') 
    : (PlaceholderY !== 0 ? `${PlaceholderY}px` : '0');

  const scale = isActive ? LabelBorderScale / 100 : 1;

  return (
    <div className="relative w-full flex flex-col">
      {/* 1. Wrapper with relative and flex to lock the button and input together */}
      <div className="relative flex items-center w-full">
        <input
          {...props}
          type={isVisible ? "text" : "password"}
          // Added pr-12 to ensure text doesn't go under the enlarged icon
          className={`input peer w-full ${errorValue ? 'input-error' : ''} ${className} pr-12`}
        />
        
        <label
          htmlFor={props.id}
          className={`text-field-label ${errorValue ? 'text-color-error' : ''} ${labelClassName}`}
          style={{ 
            position: 'absolute',
            left: '0',
            top: '0',
            pointerEvents: 'none',
            transition: 'all 0.2s ease',
            transformOrigin: 'left top',
            transform: `translate(${getX}, ${getY}) scale(${scale})`
          }}
        >
          {label}
        </label>

        {/* 2. Centered Button - added h-full to match input height */}
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="absolute right-0 top-0 h-full flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          <div className="flex items-center justify-center h-full">
            {isVisible ? <EyeOff size={22} strokeWidth={2} /> : <Eye size={22} strokeWidth={2} />}
          </div>
        </button>
      </div>

      {showError && errorValue && (
        <p id={`${props.id}-error`} className="mt-1 text-xs text-red-500" role="alert">
          {errorValue}
        </p>
      )}
    </div>
  );
};
