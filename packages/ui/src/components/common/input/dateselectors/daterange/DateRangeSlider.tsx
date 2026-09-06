"use client";

import React, { useMemo, useState } from 'react';

interface Props {
  initialMonth?: Date; // starting left-month
  onRangeChange?: (from: string | null, to: string | null) => void;
}

function addMonths(d: Date, months: number) {
  const copy = new Date(d.getFullYear(), d.getMonth(), 1);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function monthNameYear(d: Date) {
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function formatIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildMonthMatrix(year: number, month: number) {
  // month: 0..11
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay(); // 0 Sun .. 6 Sat

  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = Array.from({ length: 7 }, () => null);
  let day = 1;
  // fill first week
  for (let i = startWeekday; i < 7; i++) {
    week[i] = new Date(year, month, day++);
  }
  weeks.push(week);
  while (day <= daysInMonth) {
    week = Array.from({ length: 7 }, () => null);
    for (let i = 0; i < 7 && day <= daysInMonth; i++) {
      week[i] = new Date(year, month, day++);
    }
    weeks.push(week);
  }
  return weeks;
}

function addDays(d: Date, delta: number) {
  const nd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  nd.setDate(nd.getDate() + delta);
  return nd;
}

export default function DateRangeSlider({ initialMonth, onRangeChange }: Props) {
  const start = initialMonth ? new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [leftMonth, setLeftMonth] = useState<Date>(start);
  const rightMonth = useMemo(() => addMonths(leftMonth, 1), [leftMonth]);

  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);

  function handlePrev() {
    setLeftMonth(m => addMonths(m, -1));
  }
  function handleNext() {
    setLeftMonth(m => addMonths(m, 1));
  }

  function onDayClick(date: Date) {
    if (!from || (from && to)) {
      setFrom(date);
      setTo(null);
      onRangeChange && onRangeChange(formatIso(date), null);
      return;
    }
    // from exists and to is null => set to
    if (from && !to) {
      if (date.getTime() < from.getTime()) {
        // swap
        const oldFrom = from;
        setFrom(date);
        setTo(oldFrom);
        onRangeChange && onRangeChange(formatIso(date), formatIso(oldFrom));
      } else {
        setTo(date);
        onRangeChange && onRangeChange(formatIso(from), formatIso(date));
      }
    }
  }

  function onDayKeyDown(e: React.KeyboardEvent, date: Date) {
    const key = e.key;
    let target: Date | null = null;
    if (key === 'ArrowLeft') target = addDays(date, -1);
    else if (key === 'ArrowRight') target = addDays(date, 1);
    else if (key === 'ArrowUp') target = addDays(date, -7);
    else if (key === 'ArrowDown') target = addDays(date, 7);
    else if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      onDayClick(date);
      return;
    }
    if (target) {
      e.preventDefault();
      const id = `day-${formatIso(target)}`;
      const el = document.getElementById(id) as HTMLElement | null;
      if (el) el.focus();
      else {
        // if target outside visible months, navigate months and then focus next tick
        if (target.getTime() < leftMonth.getTime()) setLeftMonth(m => addMonths(m, -1));
        else if (target.getFullYear() > rightMonth.getFullYear() || (target.getFullYear() === rightMonth.getFullYear() && target.getMonth() > rightMonth.getMonth())) setLeftMonth(m => addMonths(m, 1));
        setTimeout(() => {
          const el2 = document.getElementById(id) as HTMLElement | null;
          if (el2) el2.focus();
        }, 100);
      }
    }
  }

  function inRange(d: Date) {
    if (!from) return false;
    if (!to) return d.getTime() === from.getTime();
    return d.getTime() >= from.getTime() && d.getTime() <= to.getTime();
  }

  const leftWeeks = useMemo(() => buildMonthMatrix(leftMonth.getFullYear(), leftMonth.getMonth()), [leftMonth]);
  const rightWeeks = useMemo(() => buildMonthMatrix(rightMonth.getFullYear(), rightMonth.getMonth()), [rightMonth]);

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <button onClick={handlePrev} aria-label="Previous month" className="p-2 rounded-md hover:bg-color-primary-tint">◀</button>
        <div className="flex-1 text-center font-medium">Select Date Range</div>
        <button onClick={handleNext} aria-label="Next month" className="p-2 rounded-md hover:bg-color-primary-tint">▶</button>
      </div>

      <div className="overflow-hidden">
        <div className="flex gap-4 transition-transform duration-300">
          {[{ month: leftMonth, weeks: leftWeeks }, { month: rightMonth, weeks: rightWeeks }].map((mObj, idx) => (
            <div key={idx} className="min-w-[320px] bg-white border rounded-md p-3">
              <div className="text-center font-semibold mb-2">{monthNameYear(mObj.month)}</div>
              <div className="grid grid-cols-7 text-xs text-gray-500 mb-1">
                {weekdayLabels.map(w => (
                  <div key={w} className="text-center">{w}</div>
                ))}
              </div>
              <div role="grid" aria-label={monthNameYear(mObj.month)} className="grid grid-cols-7 gap-1">
                {mObj.weeks.map((week, wi) => (
                  <React.Fragment key={wi}>
                    {week.map((d, di) => (
                      <div key={di} className="h-10 flex items-center justify-center">
                        {d ? (
                          <button
                            id={`day-${formatIso(d)}`}
                            role="gridcell"
                            aria-selected={inRange(d)}
                            aria-label={d.toLocaleDateString()}
                            tabIndex={0}
                            onKeyDown={(e) => onDayKeyDown(e, d)}
                            onClick={() => onDayClick(d)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${inRange(d) ? 'bg-color-primary text-white' : 'hover:bg-color-primary-tint'} `}
                          >
                            {d.getDate()}
                          </button>
                        ) : <div />}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
