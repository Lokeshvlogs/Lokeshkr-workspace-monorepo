"use client";

import React, { useEffect, useState } from 'react';
import DaySelector from './DaySelector';
import MonthSelector from './MonthSelector';
import YearSelector from './YearSelector';

interface Props {
  /** optional initial value in YYYY-MM-DD */
  value?: string;
  /** callback when any part changes */
  onDateChange?: (year: string, month: string, day: string) => void;
  inputClassName?: string;
}

export default function DatePicker({ value, onDateChange, inputClassName = '' }: Props) {
  const [day, setDay] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    const parts = value.split('-');
    if (parts.length === 3) {
      setYear(parts[0]);
      setMonth(parts[1]);
      setDay(parts[2]);
    }
  }, [value]);

  function getMaxDays(m: string, y: string) {
    if (!m) return 31;
    const yy = y ? Number(y) : new Date().getFullYear();
    const mm = Number(m); // 1..12
    if (!mm || Number.isNaN(mm)) return 31;
    return new Date(yy, mm, 0).getDate();
  }

  const maxDays = getMaxDays(month, year);

  // keep day within bounds when month/year change
  useEffect(() => {
    if (!day) return;
    const n = Number(day);
    if (n > maxDays) {
      setDay('');
      onDateChange && onDateChange(year, month, '');
    }
  }, [month, year]);

  // notify parent on any change
  useEffect(() => {
    onDateChange && onDateChange(year, month, day);
  }, [year, month, day]);

  return (
    <div className="flex items-center gap-2">
      <DaySelector value={day} onDayChange={setDay} inputClassName={inputClassName} maxDays={maxDays} />
      <MonthSelector value={month} onMonthChange={setMonth} inputClassName={inputClassName} />
      <YearSelector value={year} onYearChange={setYear} inputClassName={inputClassName} />
    </div>
  );
}
