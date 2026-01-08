import { useState, useRef, useEffect, CSSProperties } from "react";
import { createPortal } from "react-dom";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  inputClassName?: string;
}

export default function TimePicker({ value, onChange, inputClassName }: TimePickerProps) {
  const [openHour, setOpenHour] = useState(false);
  const [openMinute, setOpenMinute] = useState(false);
  const [hour, setHour] = useState<string>(value.split(":")[0] || "00");
  const [minute, setMinute] = useState<string>(value.split(":")[1] || "00");
  const hourRef = useRef<HTMLDivElement | null>(null);
  const minuteRef = useRef<HTMLDivElement | null>(null);
  const hourPopupRef = useRef<HTMLDivElement | null>(null);
  const minutePopupRef = useRef<HTMLDivElement | null>(null);
  const [hourStyle, setHourStyle] = useState<CSSProperties | null>(null);
  const [minuteStyle, setMinuteStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (hourRef.current && hourRef.current.contains(target)) return;
      if (minuteRef.current && minuteRef.current.contains(target)) return;
      if (hourPopupRef.current && hourPopupRef.current.contains(target)) return;
      if (minutePopupRef.current && minutePopupRef.current.contains(target)) return;
      setOpenHour(false);
      setOpenMinute(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  function handleHourOpen() {
    if (hourRef.current) {
      const r = hourRef.current.getBoundingClientRect();
      setHourStyle({ position: "fixed", top: r.bottom + 8, left: r.left, minWidth: 80 });
    }
    setOpenHour(true);
    setOpenMinute(false);
  }

  function handleMinuteOpen() {
    if (minuteRef.current) {
      const r = minuteRef.current.getBoundingClientRect();
      setMinuteStyle({ position: "fixed", top: r.bottom + 8, left: r.left, minWidth: 80 });
    }
    setOpenMinute(true);
    setOpenHour(false);
  }

  function handleHourSelect(h: string) {
    setHour(h);
    setOpenHour(false);
    onChange(`${h}:${minute}`);
  }

  function handleMinuteSelect(m: string) {
    setMinute(m);
    setOpenMinute(false);
    onChange(`${hour}:${m}`);
  }

  return (
    <div className={"relative w-full " + (inputClassName || "")}>
      <div className="flex items-center border border-pink-200 rounded-md bg-white w-full px-2 py-1 focus-within:ring-2 focus-within:ring-pink-300">
        <div ref={hourRef} className="relative">
          <button
            type="button"
            className={`px-2 py-1 rounded-md w-12 text-center focus:outline-none focus:ring-2 focus:ring-pink-300 ${inputClassName || ''}`}
            style={{ background: openHour ? '#f9a8d4' : 'transparent', color: openHour ? '#fff' : '#000', height: '2.75rem' }}
            onClick={handleHourOpen}
          >
            {hour}
          </button>
          {openHour && hourStyle && createPortal(
            <div ref={hourPopupRef} style={hourStyle} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-48 overflow-y-auto w-16 flex flex-col gap-1">
              {hours.map(h => (
                <button
                  key={h}
                  className={`p-2 text-sm rounded-md border transition-colors w-full text-center ${h === hour ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-black border-gray-200 hover:bg-pink-100'}`}
                  onClick={() => handleHourSelect(h)}
                >{h}</button>
              ))}
            </div>,
            document.body
          )}
        </div>
        <span className="mx-1 text-lg font-semibold select-none">:</span>
        <div ref={minuteRef} className="relative">
          <button
            type="button"
            className={`px-2 py-1 rounded-md w-12 text-center focus:outline-none focus:ring-2 focus:ring-pink-300 ${inputClassName || ''}`}
            style={{ background: openMinute ? '#f9a8d4' : 'transparent', color: openMinute ? '#fff' : '#000', height: '2.75rem' }}
            onClick={handleMinuteOpen}
          >
            {minute}
          </button>
          {openMinute && minuteStyle && createPortal(
            <div ref={minutePopupRef} style={minuteStyle} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-48 overflow-y-auto w-16 flex flex-col gap-1">
              {minutes.map(m => (
                <button
                  key={m}
                  className={`p-2 text-sm rounded-md border transition-colors w-full text-center ${m === minute ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-black border-gray-200 hover:bg-pink-100'}`}
                  onClick={() => handleMinuteSelect(m)}
                >{m}</button>
              ))}
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
}
