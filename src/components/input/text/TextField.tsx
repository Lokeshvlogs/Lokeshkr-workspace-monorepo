"use client";

import React from "react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
  inputLabelClassName?: string;
  errorValue?: string;
}

export const TextField = ({ label, id, inputLabelClassName, errorValue, ...props }: TextFieldProps) => {
  return (
    <div className="relative mt-4 w-full">
      {/* Border Label */}
        <input
          {...props}
          aria-invalid={props['aria-invalid']}
          aria-describedby={errorValue ? `${id}-error` : props['aria-describedby']}
          className={`input peer ${errorValue ? 'input-error' : ''} ${props.className}`}
        />
        <label
            htmlFor={id}
            className={`text-field-label ${errorValue ? 'text-color-error' : ''} ${inputLabelClassName}`}
          >
            {label}
        </label>
        {errorValue && <p id={`${id}-error`} className="error-text" role="alert">{errorValue}</p>}
    </div>
  );
};