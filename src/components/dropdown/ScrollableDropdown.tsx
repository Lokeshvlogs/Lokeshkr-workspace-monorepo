import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';

interface DropdownOption {
  value: string;
  label: string;
}

interface ScrollableDropdownProps {
  options: DropdownOption[];
  label: string;
  initialValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const ScrollableDropdown: React.FC<ScrollableDropdownProps> = ({ options, label, initialValue = '', onChange, className = '' }) => {
  const [selectedValue, setSelectedValue] = useState<string>(initialValue);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  // Sync selectedValue with initialValue and options
  useEffect(() => {
    setSelectedValue(initialValue);
  }, [initialValue]);
  useEffect(() => {
    if (!options.find(o => o.value === selectedValue)) {
      setSelectedValue('');
    }
  }, [options]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current && btnRef.current.contains(target)) return;
      if (popupRef.current && popupRef.current.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function handleOpen() {
    setOpen(true);
  }

  function handleSelect(val: string) {
    setSelectedValue(val);
    setOpen(false);
    if (onChange) onChange(val);
  }

  // Filter options by search
  const filteredOptions = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Calculate popup position for portal
  // Recalculate popup position while open (on scroll/resize)
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
          zIndex: 9999,
        });
      }
    };
    update(); // initial
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  return (
    <div className={`flex flex-col relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        className={`p-2 border border-pink-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-300 ${selectedValue ? 'text-black' : 'text-gray-400'}`}
        onClick={() => { setOpen(true); setSearch(''); }}
        aria-label={label}
      >
        {options.find(o => o.value === selectedValue)?.label || label}
      </button>
      {open && style && createPortal(
        <div
          ref={popupRef}
          style={style}
          className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-60 overflow-y-auto"
        >
          <input
            type="text"
            className="mb-2 p-2 w-full border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
            placeholder={`Search ${label.toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {filteredOptions.length === 0 && (
            <div className="text-gray-400 p-2">No options found</div>
          )}
          {filteredOptions.map(option => (
            <button
              key={option.value}
              className={`block w-full text-left p-2 rounded-md border mb-1 last:mb-0 ${selectedValue === option.value ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-black border-gray-200 hover:bg-pink-100'}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ScrollableDropdown;
