"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";
import { createPortal } from "react-dom";
import HorizontalFormSlider from "@/components/slider/HorizontalFormSlider";
import DropdownInput from "@/components/dropdown/DropdownInput";
import TimePicker from "@/components/timepicker/TimePicker";
import { communitiesByReligion, motherTongueOptions } from "@/utils/socialBackground";


export default function ProfileRegisterPage() {

  const [selectedReligion, setSelectedReligion] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<Array<{ value: string; label: string }>>([{ value: 'other', label: 'Other' }]);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [openPicker, setOpenPicker] = useState<null | 'day' | 'month' | 'year'>(null);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 121 }, (_, i) => String(currentYear - i));
  const months = [
    { value: '01', label: 'Jan' },
    { value: '02', label: 'Feb' },
    { value: '03', label: 'Mar' },
    { value: '04', label: 'Apr' },
    { value: '05', label: 'May' },
    { value: '06', label: 'Jun' },
    { value: '07', label: 'Jul' },
    { value: '08', label: 'Aug' },
    { value: '09', label: 'Sep' },
    { value: '10', label: 'Oct' },
    { value: '11', label: 'Nov' },
    { value: '12', label: 'Dec' },
  ];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const dateContainerRef = useRef<HTMLDivElement | null>(null);
  const dayBtnRef = useRef<HTMLButtonElement | null>(null);
  const monthBtnRef = useRef<HTMLButtonElement | null>(null);
  const yearBtnRef = useRef<HTMLButtonElement | null>(null);
  const dayPopupRef = useRef<HTMLDivElement | null>(null);
  const monthPopupRef = useRef<HTMLDivElement | null>(null);
  const yearPopupRef = useRef<HTMLDivElement | null>(null);
  const [dayStyle, setDayStyle] = useState<CSSProperties | null>(null);
  const [monthStyle, setMonthStyle] = useState<CSSProperties | null>(null);
  const [yearStyle, setYearStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (dateContainerRef.current && dateContainerRef.current.contains(target)) return;
      if (dayPopupRef.current && dayPopupRef.current.contains(target)) return;
      if (monthPopupRef.current && monthPopupRef.current.contains(target)) return;
      if (yearPopupRef.current && yearPopupRef.current.contains(target)) return;
      setOpenPicker(null);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenPicker(null);
    }

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Recalculate popup positions while a picker is open (on scroll/resize)
  useEffect(() => {
    if (!openPicker) return;
    const update = () => {
      if (openPicker === 'day' && dayBtnRef.current) {
        const r = dayBtnRef.current.getBoundingClientRect();
        setDayStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, width: 192 });
      }
      if (openPicker === 'month' && monthBtnRef.current) {
        const r = monthBtnRef.current.getBoundingClientRect();
        setMonthStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, width: 160 });
      }
      if (openPicker === 'year' && yearBtnRef.current) {
        const r = yearBtnRef.current.getBoundingClientRect();
        setYearStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, width: 144 });
      }
    };

    // initial
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [openPicker]);

  const handleReligionChange = (religion: string) => {  
    setSelectedReligion(religion);
    const selectedData = communitiesByReligion[religion];
    setSelectedCommunity(selectedData || [{ value: 'other', label: 'Other' }]);
    setForm({ ...form, religion: religion});
  };
  
  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    dob: "",
    gender: "",
    religion: "",
    community: "",
    mothertongue: "",
    profession: "",
    salaryAmount: "",
    salaryAmountType: "",
    salaryFrequency: "per_annum",
  });

  async function submit(): Promise<void> {
    console.log(form);
  }

  const canProceed = (step: number): boolean => {
    if (step === 0) {
      return (
        form.firstName.trim() !== "" &&
        form.surname.trim() !== "" &&
        form.dob !== "" &&
        form.gender !== ""
      );
    }

    if (step === 1) {
      return form.religion !== "" && form.community !== "";
    }

    if (step === 2) {
      return form.profession.trim() !== "" && form.salaryAmount.trim() !== "";
    }

    return true;
  };

  const canSubmit = (step: number): boolean => {
    // allow submit only when last step fields are valid
    return step === 2 ? canProceed(step) : false;
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center py-40">
      <div
        className="bg-white rounded-xl p-6 border border-pink-100"
        style={{ width: 760, boxShadow: '0 20px 40px rgba(219,39,119,0.12)' }}
      >
        <HorizontalFormSlider
          onSubmit={submit}
          canProceed={canProceed}
          canSubmit={canSubmit}
          steps={[
            // Step 1 - Name, DOB, Gender
            <div className="flex flex-col gap-4 p-4">
              <h2 className="text-xl font-semibold text-pink-700">Basic Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
                <input
                  className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400"
                  placeholder="Surname"
                  value={form.surname}
                  onChange={(e) => setForm({ ...form, surname: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="flex flex-col col-span-2">
                  <div className="flex justify-between items-start">
                    <label className="mb-2 font-medium text-pink-700">Date of Birth</label>
                    <label className="mb-2 font-medium text-pink-700">Time of Birth</label>
                  </div>
                  <div ref={dateContainerRef} className="flex gap-2 items-center relative">
                    {/* Day picker button */}
                    <div className="relative">
                      <button
                        ref={dayBtnRef}
                        type="button"
                        className="p-3 border border-pink-200 rounded-md bg-white text-left w-20"
                        onClick={() => {
                          if (openPicker === 'day') return setOpenPicker(null);
                          const r = dayBtnRef.current?.getBoundingClientRect();
                          if (r) setDayStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, width: 192 });
                          setOpenPicker('day');
                        }}
                      >
                        {selectedDay ? String(Number(selectedDay)) : 'Day'}
                      </button>

                      {openPicker === 'day' && dayStyle && createPortal(
                        <div ref={dayPopupRef} style={dayStyle} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-72 overflow-y-auto pb-6 grid grid-cols-4 gap-2">
                          {days.map((day) => (
                            <button
                              key={day}
                              className="p-2 text-sm border rounded-md hover:bg-pink-400 hover:text-white"
                              onClick={() => {
                                setSelectedDay(day);
                                setOpenPicker(null);
                                const date = selectedYear && selectedMonth && day ? `${selectedYear}-${selectedMonth}-${day}` : '';
                                const combined = date ? (selectedTime ? `${date}T${selectedTime}` : date) : (selectedTime ? `${new Date().toISOString().slice(0,10)}T${selectedTime}` : '');
                                setForm({ ...form, dob: combined });
                              }}
                            >
                              {Number(day)}
                            </button>
                          ))}
                        </div>,
                        document.body
                      )}
                    </div>

                    {/* Month picker button */}
                    <div className="relative">
                      <button
                        ref={monthBtnRef}
                        type="button"
                        className="p-3 border border-pink-200 rounded-md bg-white text-left w-20"
                        onClick={() => {
                          if (openPicker === 'month') return setOpenPicker(null);
                          const r = monthBtnRef.current?.getBoundingClientRect();
                          if (r) setMonthStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, width: 160 });
                          setOpenPicker('month');
                        }}
                      >
                        {selectedMonth ? months.find(m => m.value === selectedMonth)?.label : 'Month'}
                      </button>

                      {openPicker === 'month' && monthStyle && createPortal(
                        <div ref={monthPopupRef} style={monthStyle} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-72 overflow-y-auto grid grid-cols-3 gap-2">
                          {months.map((mo) => (
                            <button
                              key={mo.value}
                              className="p-2 text-sm border rounded-md hover:bg-pink-400 hover:text-white"
                              onClick={() => {
                                setSelectedMonth(mo.value);
                                setOpenPicker(null);
                                const date = selectedYear && mo.value && selectedDay ? `${selectedYear}-${mo.value}-${selectedDay}` : '';
                                const combined = date ? (selectedTime ? `${date}T${selectedTime}` : date) : (selectedTime ? `${new Date().toISOString().slice(0,10)}T${selectedTime}` : '');
                                setForm({ ...form, dob: combined });
                              }}
                            >
                              {mo.label}
                            </button>
                          ))}
                        </div>,
                        document.body
                      )}
                    </div>

                    {/* Year picker button */}
                    <div className="relative">
                      <button
                        ref={yearBtnRef}
                        type="button"
                        className="p-3 border border-pink-200 rounded-md bg-white text-left w-28"
                        onClick={() => {
                          if (openPicker === 'year') return setOpenPicker(null);
                          const r = yearBtnRef.current?.getBoundingClientRect();
                          if (r) setYearStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, width: 144 });
                          setOpenPicker('year');
                        }}
                      >
                        {selectedYear || 'Year'}
                      </button>

                      {openPicker === 'year' && yearStyle && createPortal(
                        <div ref={yearPopupRef} style={yearStyle} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-72 overflow-y-auto pb-6 w-36 grid grid-cols-1 gap-2">
                          {years.map((y) => (
                            <button
                              key={y}
                              className="p-2 text-sm border rounded-md hover:bg-pink-400 hover:text-white text-left"
                              onClick={() => {
                                setSelectedYear(y);
                                setOpenPicker(null);
                                const date = y && selectedMonth && selectedDay ? `${y}-${selectedMonth}-${selectedDay}` : '';
                                const combined = date ? (selectedTime ? `${date}T${selectedTime}` : date) : (selectedTime ? `${new Date().toISOString().slice(0,10)}T${selectedTime}` : '');
                                setForm({ ...form, dob: combined });
                              }}
                            >
                              {y}
                            </button>
                          ))}
                        </div>,
                        document.body
                      )}
                    </div>

                    {/* Time inline with date pickers */}
                    <div className="ml-10 flex items-center" style={{ height: '3.25rem' }}>
                      <TimePicker
                        value={selectedTime}
                        onChange={(t) => {
                          setSelectedTime(t);
                          const date = selectedYear && selectedMonth && selectedDay ? `${selectedYear}-${selectedMonth}-${selectedDay}` : '';
                          const combined = date ? `${date}T${t}` : (t ? `${new Date().toISOString().slice(0,10)}T${t}` : '');
                          setForm({ ...form, dob: combined });
                        }}
                        inputClassName="p-3 w-28 h-13"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col mt-2">
                <label className="mb-2 font-medium text-pink-700">Gender</label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      className="accent-pink-500"
                      checked={form.gender === 'male'}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    />
                    Male
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      className="accent-pink-500"
                      checked={form.gender === 'female'}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    />
                    Female
                  </label>
                </div>
              </div>
            </div>,

            // Step 2 - Religion and Community
            <div className="flex flex-col gap-4 p-4">
              <h2 className="text-xl font-semibold text-pink-700">Social Background</h2>
              <div className="grid grid-cols-1 gap-4">
                <DropdownInput
                  label="Religion"
                  options={[
                    { value: 'hindu', label: 'Hindu' },
                    { value: 'muslim', label: 'Muslim' },
                    { value: 'sikh', label: 'Sikh' },
                    { value: 'christian', label: 'Christian' },
                    { value: 'jain', label: 'Jain' },
                    { value: 'other', label: 'Other' },
                  ]}
                  initialValue={form.religion}
                  onChange={(v) => handleReligionChange(v)}
                />
                
                <DropdownInput
                  label="Caste / Community"
                  options={selectedCommunity}
                  initialValue={form.community}
                  onChange={(v) => setForm({ ...form, community: v })}
                />

                <DropdownInput
                  label="Mother Tongue"
                  options= {motherTongueOptions}
                  initialValue={form.mothertongue}
                  onChange={(v) => setForm({ ...form, mothertongue: v })}
                />
              </div>
            </div>,

            // Step 3 - Profession & Salary
            <div className="flex flex-col gap-4 p-4">
              <h2 className="text-xl font-semibold text-pink-700">Career & Package</h2>
              <div className="grid grid-cols-1 gap-4">
                <input
                  className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="Profession"
                  value={form.profession}
                  onChange={(e) => setForm({ ...form, profession: e.target.value })}
                />

                <div className="grid grid-cols-4 gap-3 items-center">
                  <input
                    className="p-3 border border-pink-200 rounded-md col-span-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
                    placeholder="Salary amount"
                    value={form.salaryAmount}
                    onChange={(e) => setForm({ ...form, salaryAmount: e.target.value })}
                  />
                  <select
                    className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
                    value={form.salaryAmountType}
                    onChange={(e) => setForm({ ...form, salaryAmountType: e.target.value })}
                  >
                    <option value="per_annum">Thousands</option>
                    <option value="per_month">Lakhs</option>
                    <option value="per_month">Crores</option>
                  </select>
                  <select
                    className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
                    value={form.salaryFrequency}
                    onChange={(e) => setForm({ ...form, salaryFrequency: e.target.value })}
                  >
                    <option value="per_annum">Per Annum</option>
                    <option value="per_month">Per Month</option>
                  </select>
                </div>
              </div>
            </div>,
          ]}
        />
      </div>
    </div>
  );
}