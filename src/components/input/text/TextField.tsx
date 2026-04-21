"use client";

import React from "react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
  inputLabelClassName?: string;
  errorValue?: string;
  showError?: boolean;
  labelUpScale?: number;
  xTranslate?: number;
  yTranslate?: number;
}

export const TextField = ({ label, id, inputLabelClassName, errorValue, showError = true, labelUpScale = 75, ...props }: TextFieldProps) => {
  return (
    <div className="relative mt-4 w-full">
      {/* Border Label */}
        <input
          {...props}
          aria-invalid={errorValue ? 'true' : 'false'}
          aria-describedby={`${id}-error`}
          className={`input peer ${errorValue ? 'input-error' : ''} ${props.className}`}
        />
        <label
            htmlFor={id}
            className={`text-field-label ${labelUpScale ? `scale-[.${labelUpScale}]` : ''} ${props.xTranslate ? `-translate-x-[.${props.xTranslate}]` : ''} ${props.yTranslate ? `-translate-y-[.${props.yTranslate}]` : ''} ${errorValue ? 'text-color-error' : ''} ${inputLabelClassName}`}
          >
            {label}
        </label>
        {showError && errorValue && <p id={`${id}-error`} className="error-text" role="alert">{errorValue}</p>}
    </div>
  );
};