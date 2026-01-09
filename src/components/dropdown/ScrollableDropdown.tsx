import React, { useState, useRef, useEffect, CSSProperties } from 'react';

interface DropdownOption {
  value: string;
  label: string;
}

interface ScrollableDropdownProps {
  options: DropdownOption[];
  label: string;
  initialValue?: string;
  onChange?: (value: string) => void;
}

const ScrollableDropdown: React.FC<ScrollableDropdownProps> = ({ options, label, initialValue = '', onChange }) => {
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

  return (
    <div className="flex flex-col relative">
      <button
        ref={btnRef}
        type="button"
        className={`p-2 border border-pink-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-300 ${selectedValue ? 'text-black' : 'text-gray-400'}`}
        onClick={() => { setOpen(true); setSearch(''); }}
        aria-label={label}
      >
        {options.find(o => o.value === selectedValue)?.label || label}
      </button>
      {open && (
        <div
          ref={popupRef}
          className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-60 overflow-y-auto absolute left-0 top-full w-full"
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
        </div>
      )}
    </div>
  );
};

export default ScrollableDropdown;
