"use client";

import React from "react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
}

export const TextField = ({ label, id, ...props }: TextFieldProps) => {
  return (
    <div className="relative mt-4 w-full">
      {/* Border Label */}
        <input
          {...props}
          aria-invalid={props['aria-invalid']}
          aria-describedby={props['aria-describedby']}
          className={`input peer ${props.className}`}
        />
        <label
            htmlFor={id}
            className="absolute left-3 top-2 -translate-y-4 scale-75 bg-color-bg px-1 text-xl text-color-placeholder-text transition-all 
               peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 
               peer-focus:-translate-y-5 peer-focus:scale-75 peer-focus:text-color-primary"
          >
            {label}
        </label>
    </div>
  );
};