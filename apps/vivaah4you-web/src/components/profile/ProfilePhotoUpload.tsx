"use client";

import React, { useRef, useState, DragEvent } from "react";

type Props = {
  value?: string;
  onChange: (dataUrl: string) => void;
  maxSizeMB?: number;
};

export default function ProfilePhotoUpload({ value, onChange, maxSizeMB = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    setError(null);
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be under ${maxSizeMB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string | null;
      if (res) onChange(res);
    };
    reader.readAsDataURL(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    handleFile(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setHover(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    handleFile(f);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        onDragOver={(e) => { e.preventDefault(); setHover(true); }}
        onDragLeave={() => setHover(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-full w-40 h-40 border-2 ${hover ? 'border-pink-500 bg-pink-50' : 'border-dashed border-pink-200'} overflow-hidden relative`}
        style={{ background: value ? 'transparent' : undefined }}
      >
        {value ? (
          <>
            <img src={value} alt="avatar" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow text-sm text-pink-600 border border-pink-100"
            >
              Remove
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center px-4 text-center text-sm text-pink-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15a4 4 0 004 4h10a4 4 0 004-4v-6a4 4 0 00-4-4H7a4 4 0 00-4 4v6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 11l2 2 4-4" />
            </svg>
            <div className="font-medium">Upload profile photo</div>
            <div className="text-xs text-gray-500 mt-1">Drag & drop or <button type="button" onClick={() => inputRef.current?.click()} className="text-pink-600 underline">browse</button></div>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={onInputChange} className="hidden" />

      {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
      <div className="text-xs text-gray-500 mt-2">Recommended: 400x400, JPG/PNG, &lt; {maxSizeMB}MB</div>
    </div>
  );
}
