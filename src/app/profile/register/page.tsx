"use client";

import React, { useState, useRef, useEffect, CSSProperties } from "react";
import { createPortal } from "react-dom";
import HorizontalFormSlider from "@/components/slider/HorizontalFormSlider";
import ScrollableDropdown from "@/components/dropdown/ScrollableDropdown";
import TimePicker from "@/components/timepicker/TimePicker";
import ProfilePhotoUpload from "@/components/profile/ProfilePhotoUpload";
import { communitiesByReligion, motherTongueOptions } from "@/utils/socialBackground";
import placesByCountry, { countryOptions } from '@/utils/placesByCountry';
import { professionOptions } from "@/utils/professionOptions";


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
  const feetOptions = Array.from({ length: 5 }, (_, i) => {
    const ft = String(4 + i); // 4,5,6,7,8 -> keep reasonable range
    return { value: ft, label: `${ft} ft` };
  });
  const inchOptions = Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `${i} in` }));
  const physiqueOptions = [
    { value: 'slim', label: 'Slim' },
    { value: 'normal', label: 'Normal' },
    { value: 'athletic', label: 'Athletic' },
    { value: 'chubby', label: 'Chubby' },
    { value: 'heavy', label: 'Heavy' },
  ];
  const familyIncomeOptions = [
    { value: '0-5', label: '0-5' },
    { value: '5-10', label: '5-10' },
    { value: '10-15', label: '10-15' },
    { value: '15-25', label: '15-25' },
    { value: '25-50', label: '25-50' },
    { value: '50+', label: '50+' },
  ];
  // countryOptions are provided by src/utils/placesByCountry
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
  const [step, setStep] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('profileRegisterStep');
      setStep(saved ? Number(saved) : 0);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && step !== undefined) {
      window.localStorage.setItem('profileRegisterStep', String(step));
    }
  }, [step]);

  const stepIcons = [
    // Basic Details - user
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21a6.5 6.5 0 00-15 0" />
      </svg>
    ),
    // Social Background - users/group
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20a4 4 0 00-8 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8a4 4 0 110-8 4 4 0 010 8zM21 12a4 4 0 10-8 0 4 4 0 008 0z" />
      </svg>
    ),
    // Professional Career - briefcase
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a4 4 0 018 0v2" />
      </svg>
    ),
    // Profile Photo - camera
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h3l2-3h6l2 3h3v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    ),
  ];





  // --- Move form state definition above all useEffects ---
  // Only one form state definition, now includes salaryCurrency
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
    salaryFrequency: "per_annum",
    salaryCurrency: "INR",
    photo: "",
    heightFeet: "",
    heightInches: "",
    bodyPhysique: "",
    placeOfBirth: "",
    currentResidence: "",
    hometown: "",
    maritalStatus: "",
    isManglik: false,
    familyIncome: "",
    country: "",
  });

  // compute city options: if a country is selected, use its cities; otherwise aggregate cities from all countries
  const cityOptions = (() => {
    if (form.country) return (placesByCountry[form.country] || []).flatMap((s) => s.cities);
    const map = new Map<string, { value: string; label: string }>();
    Object.values(placesByCountry).forEach((states) => {
      states.forEach((st) => {
        st.cities.forEach((c) => {
          if (!map.has(c.value)) map.set(c.value, c);
        });
      });
    });
    return Array.from(map.values());
  })();

  // build extended options with "City, State, Country" labels so search matches across parts
  const cityOptionsExtended = (() => {
    const opts: { value: string; label: string }[] = [];
    const countryEntries = Object.entries(placesByCountry) as [string, any[]][];
    countryEntries.forEach(([countryKey, states]) => {
      const countryLabel = (countryOptions.find(c => c.value === countryKey) || { label: '' }).label;
      states.forEach((st: any) => {
        const stateLabel = st.label;
        st.cities.forEach((c: any) => {
          const label = `${c.label}, ${stateLabel}${countryLabel ? `, ${countryLabel}` : ''}`;
          // use label as value so selection stores readable string
          opts.push({ value: label, label });
        });
      });
    });
    // dedupe by label
    const seen = new Set<string>();
    return opts.filter(o => (seen.has(o.label) ? false : seen.add(o.label)));
  })();

  // Restore form data from localStorage on initial render (merge with default)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedForm = window.localStorage.getItem('profileRegisterForm');
      if (savedForm) {
        setForm((prev) => ({ ...prev, ...JSON.parse(savedForm) }));
      }
    }
  }, []);

  // Save form data to localStorage on every change
  useEffect(() => {
    if (typeof window !== 'undefined' && form) {
      window.localStorage.setItem('profileRegisterForm', JSON.stringify(form));
    }
  }, [form]);

  // Step change logic: just update the step
  const handleStepChange = (newStep: number) => {
    setStep(newStep);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && step !== undefined) {
      window.localStorage.setItem('profileRegisterStep', String(step));
    }
  }, [step]);

  // Restore form data from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedForm = window.localStorage.getItem('profileRegisterForm');
      if (savedForm) {
        setForm(JSON.parse(savedForm));
      }
    }
  }, []);


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
    const updatePosition = () => {
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

    const onScrollClose = (e?: Event) => {
      try {
        const target = e && (e.target as Node | null);
        if (dateContainerRef.current && target && dateContainerRef.current.contains(target)) return;
        if (dayPopupRef.current && target && dayPopupRef.current.contains(target)) return;
        if (monthPopupRef.current && target && monthPopupRef.current.contains(target)) return;
        if (yearPopupRef.current && target && yearPopupRef.current.contains(target)) return;
      } catch (err) {
        // ignore errors and continue to close
      }
      setOpenPicker(null);
    };

    // initial position
    updatePosition();
    // Close on various page-level scrolling events; ignore scrolls from inside popup
    window.addEventListener('scroll', onScrollClose, true);
    document.addEventListener('scroll', onScrollClose, true);
    document.addEventListener('wheel', onScrollClose as EventListener, { passive: true, capture: true } as any);
    document.addEventListener('touchmove', onScrollClose as EventListener, { passive: true, capture: true } as any);
    // Reposition on resize
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', onScrollClose, true);
      document.removeEventListener('scroll', onScrollClose, true);
      document.removeEventListener('wheel', onScrollClose as EventListener, true as any);
      document.removeEventListener('touchmove', onScrollClose as EventListener, true as any);
      window.removeEventListener('resize', updatePosition);
    };
  }, [openPicker]);

  const handleReligionChange = (religion: string) => {  
    setSelectedReligion(religion);
    const selectedData = communitiesByReligion[religion];
    setSelectedCommunity(selectedData || [{ value: 'other', label: 'Other' }]);
    setForm({ ...form, religion: religion});
  };
  
  // ...existing code...

  async function submit(): Promise<void> {
    console.log(form);
  }

  // Called when user clicks Continue; saves current step data to server
  const handleSaveStep = async (currentStep: number) => {
    try {
      console.log('Saving step', currentStep, form);

      const doPost = async (payload: any) => {
        const datatopost = JSON.stringify(payload);
        console.log('dataToPost', payload);
        const resp = await fetch('/api/profile/save-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: datatopost,
        });
        const body = await resp.text().catch(() => '');
        let json: any = {};
        try { json = body ? JSON.parse(body) : {}; } catch (e) { json = { raw: body }; }
        return { resp, json };
      };

      const payload = {step: currentStep, firstName: form.firstName, surname: form.surname, dob: form.dob, gender: form.gender, religion: form.religion, community: form.community, profession: form.profession, salaryAmount: form.salaryAmount, salaryFrequency: form.salaryFrequency, salaryCurrency: form.salaryCurrency, photo: form.photo};
      const first = await doPost(payload);
      if (first.resp.ok) return;

      console.error('Save-step failed', first.resp.status, first.json);
      // For other errors, throw detailed message
      throw new Error(JSON.stringify(first.json));
    } catch (err) {
      console.error('Error saving step:', err);
      // Bubble up error so slider won't advance; caller can show UI if needed
      throw err;
    }
  };

  // Jump to a specific step when top icon is clicked.
  // If jumping forward, attempt to save current step first.
  const handleJumpToStep = async (targetStep: number) => {
    if (typeof step !== 'number') return;
    if (targetStep === step) return;
    try {
      //if (targetStep > step) {
      //  await handleSaveStep(step);
      //}
      handleStepChange(targetStep);
    } catch (err) {
      console.error('Failed to jump to step', targetStep, err);
    }
  };

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

    if (step === 3) {
      return form.photo !== "";
    }

    return true;
  };

  const canSubmit = (step: number): boolean => {
    // allow submit only when last step fields are valid
    return step === 3 ? canProceed(step) : false;
  };

  // Add this effect to sync picker states when step changes to 0
  useEffect(() => {
    if (step === 0 && form.dob) {
      // Parse date and time from form.dob
      const [date, time] = form.dob.split('T');
      if (date) {
        const [year, month, day] = date.split('-');
        setSelectedYear(year || "");
        setSelectedMonth(month || "");
        setSelectedDay(day || "");
      }
      setSelectedTime(time || "");
    }
    if (step === 0 && form.gender) {
      // Gender radio is already controlled by form.gender
      // No extra sync needed
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-white flex items-start justify-center py-40">
      <div
        className="bg-white rounded-xl p-6 border border-pink-100"
        style={{ width: 760, boxShadow: '0 20px 40px rgba(219,39,119,0.12)' }}
      >
        {step !== undefined && (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center w-full max-w-xl">
                {[0, 1, 2, 3].map((s, idx) => (
                  <React.Fragment key={s}>
                    <button
                      type="button"
                      onClick={() => handleJumpToStep(s)}
                      aria-label={["Basic Details","Socio Personal Background","Educational and Professional Background","Profile Photo"][s]}
                      aria-current={step === s ? 'step' : undefined}
                      className={`flex items-center justify-center rounded-full border-2 w-8 h-8 text-sm font-bold transition-colors duration-200 
                      ${step === s ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-pink-300 text-pink-500'} focus:outline-none`}
                    >
                      <span className="flex items-center justify-center">
                        {stepIcons[s]}
                      </span>
                    </button>
                    {idx < 3 && (
                      <div className="flex-1 h-1 bg-pink-200 mx-1" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <HorizontalFormSlider
              onSubmit={submit}
              onNext={handleSaveStep}
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
                                  className="p-2 text-sm rounded-md hover:bg-pink-400 hover:text-white"
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
                                  className="p-2 text-sm rounded-md hover:bg-pink-400 hover:text-white"
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
                                  className="p-2 text-sm rounded-md hover:bg-pink-400 hover:text-white text-left"
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
                            inputClassName="p-3 w-10 h-13"
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
                  <div className="flex flex-col mt-4">
                    <label className="mb-2 font-medium text-pink-700">Height</label>
                    <div className="flex gap-2 items-center">
                      <div className="w-28">
                        <ScrollableDropdown
                          label="Feet"
                          options={feetOptions}
                          initialValue={form.heightFeet}
                          onChange={(v) => setForm({ ...form, heightFeet: v })}
                        />
                      </div>
                      <div className="w-28">
                        <ScrollableDropdown
                          label="Inches"
                          options={inchOptions}
                          initialValue={form.heightInches}
                          onChange={(v) => setForm({ ...form, heightInches: v })}
                        />
                      </div>
                      <div className="ml-4 text-sm text-gray-500">{form.heightFeet || '-'} {form.heightInches ? `${form.heightInches}"` : ''}</div>
                    </div>
                  </div>

                  <div className="flex flex-col mt-4">
                    <label className="mb-2 font-medium text-pink-700">Body Physique</label>
                    <div className="flex gap-2 items-center">
                      {physiqueOptions.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setForm({ ...form, bodyPhysique: p.value })}
                          className={`px-3 py-1 rounded-md border ${form.bodyPhysique === p.value ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-700 border-pink-100'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>,

                // Step 2 - Religion and Community
                <div className="flex flex-col gap-4 p-4">
                  <h2 className="text-xl font-semibold text-pink-700">Social Background</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <ScrollableDropdown
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
                    <ScrollableDropdown
                      label="Caste / Community"
                      options={selectedCommunity}
                      initialValue={form.community}
                      onChange={(v) => setForm({ ...form, community: v })}
                    />
                    <ScrollableDropdown
                      label="Mother Tongue"
                      options={motherTongueOptions}
                      initialValue={form.mothertongue}
                      onChange={(v) => setForm({ ...form, mothertongue: v })}
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 font-medium text-pink-700">Current Place</label>
                        <ScrollableDropdown
                          label="Current Residence"
                          options={cityOptionsExtended}
                          initialValue={form.currentResidence}
                          onChange={(v) => setForm({ ...form, currentResidence: v })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 font-medium text-pink-700">Place of Birth</label>
                        <input
                          className="p-2 border border-pink-200 rounded-md w-full"
                          placeholder="Place of Birth"
                          value={form.placeOfBirth}
                          onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 font-medium text-pink-700">Home Town</label>
                        <input
                          className="p-2 border border-pink-200 rounded-md w-full"
                          placeholder="Home Town"
                          value={form.hometown}
                          onChange={(e) => setForm({ ...form, hometown: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 items-end mt-3">
                      <div>
                        <label className="mb-1 font-medium text-pink-700">Country</label>
                        <ScrollableDropdown
                          label="Country"
                          options={countryOptions}
                          initialValue={form.country}
                          onChange={(v) => setForm({ ...form, country: v })}
                        />
                      </div>

                      <div>
                        <label className="mb-1 font-medium text-pink-700">Family Income</label>
                        <div className="flex items-center gap-2">
                          <div className="w-full">
                            <ScrollableDropdown
                              label="Family Income"
                              options={familyIncomeOptions}
                              initialValue={form.familyIncome}
                              onChange={(v) => setForm({ ...form, familyIncome: v })}
                            />
                          </div>
                          <div className="text-sm text-gray-500">per annum</div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 font-medium text-pink-700">Manglik</label>
                        <div className="flex items-center">
                          <input type="checkbox" checked={!!form.isManglik} onChange={(e) => setForm({ ...form, isManglik: e.target.checked })} />
                          <span className="ml-2 text-sm">I'm Manglik</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="mb-1 font-medium text-pink-700">Marital Status</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          { value: 'never_married', label: 'Never Married' },
                          { value: 'married', label: 'Married' },
                          { value: 'divorced', label: 'Divorced' },
                          { value: 'annulled', label: 'Annulled' },
                          { value: 'awaiting_divorce', label: 'Awaiting Divorce' },
                        ].map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setForm({ ...form, maritalStatus: m.value })}
                            className={`px-3 py-1 rounded-md border ${form.maritalStatus === m.value ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-700 border-pink-100'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>,

                // Step 3 - Profession & Salary
                <div className="flex flex-col gap-4 p-4">
                  <h2 className="text-xl font-semibold text-pink-700">Professional Career</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <ScrollableDropdown
                      label="Profession"
                      options={professionOptions}
                      initialValue={form.profession}
                      onChange={(v) => setForm({ ...form, profession: v })}
                    />

                    <div className="grid grid-cols-5 gap-3 items-center">
                      <div className="col-span-5">
                        <label className="mt-2 font-medium text-pink-700 block">Salary/Package</label>
                      </div>
                        <ScrollableDropdown
                          label="Currency"
                          options={[
                            { value: 'INR', label: 'INR (₹)' },
                            { value: 'USD', label: 'USD ($)' },
                            { value: 'EUR', label: 'EUR (€)' },
                            { value: 'GBP', label: 'GBP (£)' },
                            { value: 'AUD', label: 'AUD (A$)' },
                            { value: 'CAD', label: 'CAD (C$)' },
                          ]}
                          initialValue={form.salaryCurrency || 'INR'}
                          onChange={(v) => setForm({ ...form, salaryCurrency: v })}
                          className="w-24"
                          optionButtonClassName="py-1 text-xs"
                        />
                      <ScrollableDropdown
                        label="Salary Amount"
                        className="col-span-2 height-60"
                        options={[
                          { value: '0-1', label: '0-1 lacs' },
                          { value: '1-5', label: '1-5 lacs' },
                          { value: '5-10', label: '5-10 lacs' },
                          { value: '10-15', label: '10-15 lacs' },
                          { value: '15-20', label: '15-20 lacs' },
                          { value: '20-30', label: '20-30 lacs' },
                          { value: '30-50', label: '30-50 lacs' },
                          { value: '50+', label: '50 > lacs' },
                        ]}
                        initialValue={form.salaryAmount}
                        onChange={(v) => setForm({ ...form, salaryAmount: v })}
                      />
                        <ScrollableDropdown
                          label="Frequency"
                          options={[
                            { value: 'per_annum', label: 'Per Annum' },
                            { value: 'per_month', label: 'Per Month' },
                          ]}
                          initialValue={form.salaryFrequency}
                          onChange={(v) => setForm({ ...form, salaryFrequency: v })}
                          className="w-25 ml-2"
                          optionButtonClassName="py-1 text-xs"
                        />
                </div>
              </div>
            </div>,
                // Step 4 - Profile Photo
                <div className="flex flex-col gap-4 p-4 items-center">
                  <h2 className="text-xl font-semibold text-pink-700">Profile Photo</h2>
                  <p className="text-sm text-gray-500">Add a friendly face — helps matches notice you.</p>
                  <div className="mt-4">
                    <ProfilePhotoUpload
                      value={form.photo}
                      onChange={(dataUrl) => setForm({ ...form, photo: dataUrl })}
                    />
                  </div>
                </div>,
          ]}
          step={step}
          setStep={handleStepChange}
        />
      </>
    )}
      </div>
    </div>
  );
}