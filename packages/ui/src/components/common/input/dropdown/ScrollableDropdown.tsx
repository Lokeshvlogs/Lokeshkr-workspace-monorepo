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
  optionButtonClassName?: string;
}

const ScrollableDropdown: React.FC<ScrollableDropdownProps> = ({ options, label, initialValue = '', onChange, className = '', optionButtonClassName = '' }) => {
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
  // When open: position initially and on resize. Close popup on any page scroll.
  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setStyle({
          position: 'fixed',
          top: rect.bottom + 2,
          left: rect.left,
          width: rect.width + 5,
          zIndex: 9999,
        });
      }
    };

    const onScrollClose = (e?: Event) => {
      // If the scroll/wheel/touch event originated from inside the popup, ignore it.
      try {
        const target = e && (e.target as Node | null);
        if (popupRef.current && target && popupRef.current.contains(target)) return;
      } catch (err) {
        // ignore DOM access errors and proceed to close
      }
      setOpen(false);
    };

    updatePosition(); // initial
    // Close on various user scroll interactions. Some containers dispatch scroll
    // on their own element (not window) and 'scroll' doesn't bubble, so also
    // listen for wheel/touchmove which do bubble.
    window.addEventListener('scroll', onScrollClose, true);
    document.addEventListener('scroll', onScrollClose, true);
    document.addEventListener('wheel', onScrollClose as EventListener, { passive: true, capture: true } as any);
    document.addEventListener('touchmove', onScrollClose as EventListener, { passive: true, capture: true } as any);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', onScrollClose, true);
      document.removeEventListener('scroll', onScrollClose, true);
      document.removeEventListener('wheel', onScrollClose as EventListener, true as any);
      document.removeEventListener('touchmove', onScrollClose as EventListener, true as any);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  return (
    <div className={`flex flex-col relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        className={`p-2 border border-color-border rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-color-primary-extra-light ${selectedValue ? 'text-black' : 'text-gray-400'}`}
        onClick={() => { setOpen(true); setSearch(''); }}
        aria-label={label}
      >
        {options.find(o => o.value === selectedValue)?.label || label}
      </button>
      {open && style && createPortal(
        <div
          ref={popupRef}
          style={style}
          className="z-50 bg-white border border-color-primary-tint rounded-md p-2 shadow max-h-60 overflow-y-auto hide-scrollbar"
        >
          <input
            type="text"
            className="mb-2 p-2 w-full border border-color-border rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary-extra-light"
            placeholder={`Search ${label.toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {filteredOptions.length === 0 && (
            <div className="text-gray-400 p-2">No options found</div>
          )}

          <div className="mt-2 divide-y divide-color-primary-surface">
            {filteredOptions.map(option => (
              <div key={option.value}>
                <button
                  className={`block w-full text-left p-2 first:rounded-t-md last:rounded-b-md ${selectedValue === option.value ? 'bg-color-primary text-white' : 'bg-white text-black hover:bg-color-primary-tint'} ${optionButtonClassName}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ScrollableDropdown;
