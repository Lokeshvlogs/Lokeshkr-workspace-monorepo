"use client";

import React, { CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  /** Message to show under the trigger; also puts it in its error state. */
  errorValue?: string;
  /** Focus left the trigger. Suppressed while the calendar is open. */
  onBlur?: () => void;
  /** "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm". */
  value?: string;
  onChange: (value: string) => void;
  /** Youngest allowed. Dates more recent than this are not selectable. */
  minAge?: number;
  /** Oldest allowed, bounding the year list. */
  maxAge?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const pad = (n: number) => String(n).padStart(2, "0");

function parseValue(value?: string) {
  if (!value) return { date: null as Date | null, time: "" };
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return { date: null, time: "" };
  return { date: new Date(y, m - 1, d), time: timePart ? timePart.slice(0, 5) : "" };
}

function ageFrom(date: Date): number {
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const before =
    now.getMonth() < date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() < date.getDate());
  return before ? age - 1 : age;
}

/** 12-hour parts for a "HH:mm" string. */
function to12h(time: string) {
  if (!time) return { hour: 12, minute: 0, meridiem: "AM" as "AM" | "PM" };
  const [h, m] = time.split(":").map(Number);
  const meridiem: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return { hour, minute: m || 0, meridiem };
}

function to24h(hour: number, minute: number, meridiem: "AM" | "PM") {
  let h = hour % 12;
  if (meridiem === "PM") h += 12;
  return `${pad(h)}:${pad(minute)}`;
}

/**
 * Combined date-and-time-of-birth picker.
 *
 * A birth date is a poor fit for a plain calendar: it is always years in the
 * past, so this leads with month and year selects and keeps the grid for the
 * final click. Time of birth is genuinely optional - many people do not know
 * it - so it is opt-in rather than defaulting to midnight.
 */
export default function BirthDateTimePicker({
  value,
  onChange,
  minAge = 18,
  maxAge = 80,
  placeholder = "Select date of birth",
  className = "",
  disabled = false,
  errorValue,
  onBlur,
}: Props) {
  const parsed = useMemo(() => parseValue(value), [value]);
  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<CSSProperties | null>(null);
  const [withTime, setWithTime] = useState(Boolean(parsed.time));

  const today = useMemo(() => new Date(), []);
  const latest = useMemo(
    () => new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate()),
    [today, minAge],
  );
  const earliestYear = today.getFullYear() - maxAge;

  const [viewYear, setViewYear] = useState(parsed.date?.getFullYear() ?? latest.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.date?.getMonth() ?? 0);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  // Re-sync when the value changes from outside (hydration, reset).
  useEffect(() => {
    if (parsed.date) {
      setViewYear(parsed.date.getFullYear());
      setViewMonth(parsed.date.getMonth());
    }
    setWithTime(Boolean(parsed.time));
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Portaled and fixed, so a scrolling/transformed ancestor cannot clip it.
  useLayoutEffect(() => {
    if (!open) {
      setPopupStyle(null);
      return;
    }
    const place = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const margin = 8;
      const width = Math.min(330, window.innerWidth - margin * 2);
      const estimated = withTime ? 430 : 350;
      const openUp = window.innerHeight - rect.bottom < estimated && rect.top > estimated;
      setPopupStyle({
        position: "fixed",
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin)),
        ...(openUp ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
        width,
        zIndex: 9999,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, withTime]);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = latest.getFullYear(); y >= earliestYear; y -= 1) list.push(y);
    return list;
  }, [latest, earliestYear]);

  const grid = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  const isDisabledDay = (day: number) => new Date(viewYear, viewMonth, day) > latest;

  const selected = parsed.date;
  const isSelected = (day: number) =>
    !!selected &&
    selected.getFullYear() === viewYear &&
    selected.getMonth() === viewMonth &&
    selected.getDate() === day;

  const emit = (date: Date | null, time: string) => {
    if (!date) {
      onChange("");
      return;
    }
    const base = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    onChange(time ? `${base}T${time}` : base);
  };

  const pickDay = (day: number) => {
    if (isDisabledDay(day)) return;
    emit(new Date(viewYear, viewMonth, day), withTime ? parsed.time || "12:00" : "");
  };

  const { hour, minute, meridiem } = to12h(parsed.time || "12:00");
  const setTime = (h: number, m: number, mer: "AM" | "PM") => {
    if (!selected) return;
    emit(selected, to24h(h, m, mer));
  };

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    if (next > latest) return;
    if (next.getFullYear() < earliestYear) return;
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const summary = selected
    ? `${selected.getDate()} ${MONTHS_SHORT[selected.getMonth()]} ${selected.getFullYear()}` +
      (parsed.time ? ` · ${to12h(parsed.time).hour}:${pad(to12h(parsed.time).minute)} ${to12h(parsed.time).meridiem}` : "")
    : "";

  return (
    <div className={`dob-picker ${className}`}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => { if (!open) onBlur?.(); }}
        className={`dob-trigger ${errorValue ? "dob-trigger-error" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={errorValue ? "true" : "false"}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
        <span className={summary ? "dob-trigger-value" : "dob-trigger-placeholder"}>
          {summary || placeholder}
        </span>
        {selected && <span className="dob-age">{ageFrom(selected)} yrs</span>}
      </button>

      {errorValue && <p className="error-text" role="alert">{errorValue}</p>}

      {open && popupStyle && typeof document !== "undefined" && createPortal(
        <div ref={popupRef} style={popupStyle} className="dob-popup" role="dialog" aria-label="Choose date of birth">
          <div className="dob-head">
            <button type="button" className="dob-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
            <div className="dob-head-selects">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="dob-select"
                aria-label="Month"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="dob-select"
                aria-label="Year"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" className="dob-nav" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
          </div>

          <div className="dob-weekdays">
            {WEEKDAYS.map((d, i) => <span key={`${d}-${i}`}>{d}</span>)}
          </div>

          <div className="dob-grid">
            {grid.map((day, i) =>
              day === null ? (
                <span key={`pad-${i}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabledDay(day)}
                  onClick={() => pickDay(day)}
                  className={`dob-day ${isSelected(day) ? "dob-day-selected" : ""}`}
                >
                  {day}
                </button>
              ),
            )}
          </div>

          <div className="dob-time">
            <label className="dob-time-toggle">
              <input
                type="checkbox"
                checked={withTime}
                onChange={(e) => {
                  setWithTime(e.target.checked);
                  if (selected) emit(selected, e.target.checked ? parsed.time || "12:00" : "");
                }}
              />
              I know my time of birth
            </label>

            {withTime && (
              <div className="dob-time-row">
                <select className="dob-select" value={hour} onChange={(e) => setTime(Number(e.target.value), minute, meridiem)} aria-label="Hour">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{pad(h)}</option>)}
                </select>
                <span className="dob-time-colon">:</span>
                <select className="dob-select" value={minute} onChange={(e) => setTime(hour, Number(e.target.value), meridiem)} aria-label="Minute">
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => <option key={m} value={m}>{pad(m)}</option>)}
                </select>
                <div className="dob-meridiem">
                  {(["AM", "PM"] as const).map((mer) => (
                    <button
                      key={mer}
                      type="button"
                      onClick={() => setTime(hour, minute, mer)}
                      className={`dob-mer-btn ${meridiem === mer ? "dob-mer-selected" : ""}`}
                    >
                      {mer}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="dob-time-hint">Used for horoscope matching. Leave it off if unsure.</p>
          </div>

          <div className="dob-footer">
            <button type="button" className="chip chip-square" onClick={() => { emit(null, ""); setOpen(false); }}>
              Clear
            </button>
            <button type="button" className="chip chip-selected chip-square" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
