import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';

interface Option { value: string; label: string }

interface Props {
  label: string;
  options: Option[];
  initialValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void; // returns the selected or typed text
  className?: string;
}

export default function TypeaheadDropdown({ label, options, initialValue = '', placeholder = '', onChange, className = '' }: Props) {
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<Option[]>(options);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useEffect(() => setValue(initialValue), [initialValue]);
  useEffect(() => setFiltered(options), [options]);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setStyle({ position: 'fixed', top: rect.bottom + 8, left: rect.left, width: rect.width, zIndex: 9999 });
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', () => setOpen(false), true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', () => setOpen(false), true);
    };
  }, [open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (inputRef.current && inputRef.current.contains(target)) return;
      if (popupRef.current && popupRef.current.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleInput = (v: string) => {
    setValue(v);
    const q = v.trim().toLowerCase();
    setFiltered(q ? options.filter(o => o.label.toLowerCase().includes(q)) : options);
    setOpen(true);
    if (onChange) onChange(v);
  };

  const handleSelect = (o: Option) => {
    setValue(o.label);
    setOpen(false);
    if (onChange) onChange(o.label);
  };

  return (
    <div className={`relative flex flex-col ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder || label}
        className="p-2 border border-pink-200 rounded-md w-full"
        onFocus={() => { setFiltered(options); setOpen(true); }}
        onChange={(e) => handleInput(e.target.value)}
        aria-label={label}
      />

      {open && style && createPortal(
        <div ref={popupRef} style={style} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-60 overflow-y-auto">
          {filtered.length === 0 && <div className="text-gray-400 p-2">No matches</div>}
          <div className="divide-y divide-pink-50">
            {filtered.map((o) => (
              <button key={o.value} className="w-full text-left p-2 hover:bg-pink-50" onClick={() => handleSelect(o)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
