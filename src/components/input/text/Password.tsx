"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const PasswordInput = ({ label, ...props }: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative mt-4 w-full">
      {/* Border Label */}
      <label
        htmlFor={props.id}
        className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-medium text-gray-600 transition-all peer-focus:text-blue-600"
      >
        {label}
      </label>

      {/* Input Field */}
      <input
        {...props}
        type={isVisible ? "text" : "password"}
        className="peer block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label={isVisible ? "Hide password" : "Show password"}
      >
        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};