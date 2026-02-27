"use client";

import React, { useState, useRef, useEffect, CSSProperties } from "react";
import { createPortal } from "react-dom";
import HorizontalFormSlider from "@/components/slider/HorizontalFormSlider";
import ScrollableDropdown from "@/components/dropdown/ScrollableDropdown";
import TimePicker from "@/components/timepicker/TimePicker";
import ProfilePhotoUpload from "@/components/profile/ProfilePhotoUpload";
import { communitiesByReligion, motherTongueOptions } from "src/constants/selectOptions/socialBackground";
import {placesByCountry, countryOptions } from 'src/constants/selectOptions/places';
import {professionOptions}  from "src/constants/selectOptions/professionOptions";
import { educationOptions, fieldOfStudyOptions, collegeOptions } from 'src/constants/selectOptions/educationOptions';
import familyIncomeOptions from "src/constants/selectOptions/incomeOptions";
import { employedAsOptions, employedInOptions } from "src/constants/selectOptions/professionOptions";
import {physiqueOptions, smokingOptions, drinkingOptions, dietOptions, routineOptions} from "src/constants/selectOptions/lifeStyleOptions";
import {currentYear, years, days, months} from "src/constants/selectOptions/timeDateOptions";
import { feetOptions, inchOptions } from "src/constants/selectOptions/bodyOptions";

export default function ProfileRegisterPage() {

  //const [selectedReligion, setSelectedReligion] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<Array<{ value: string; label: string }>>([{ value: 'other', label: 'Other' }]);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [dayInputText, setDayInputText] = useState<string>('');
  const [monthInputText, setMonthInputText] = useState<string>('');
  const [yearInputText, setYearInputText] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [openPicker, setOpenPicker] = useState<null | 'day' | 'month' | 'year'>(null);

  const stepIcons = [
    (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21a6.5 6.5 0 00-15 0" /></svg>),
    (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20a4 4 0 00-8 0" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 8a4 4 0 110-8 4 4 0 010 8zM21 12a4 4 0 10-8 0 4 4 0 008 0z" /></svg>),
    (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a4 4 0 018 0v2" /></svg>),
    (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" /></svg>),
    (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h3l2-3h6l2 3h3v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><circle cx="12" cy="13" r="3" /></svg>)
  ];

  // When no country is selected, provide an aggregated city list with "City, State, Country" labels
  const cityOptionsExtended: { value: string; label: string }[] = (() => {
    const opts: { value: string; label: string }[] = [];
    Object.entries(placesByCountry).forEach(([countryKey, states]: [string, any[]]) => {
      const countryLabel = (countryOptions.find(c => c.value === countryKey) || { label: '' }).label;
      states.forEach((st: any) => {
        const stateLabel = st.label || '';
        st.cities.forEach((c: any) => {
          const label = `${c.label}, ${stateLabel}${countryLabel ? `, ${countryLabel}` : ''}`;
          opts.push({ value: label, label });
        });
      });
    });
    // dedupe by label
    const seen = new Set<string>();
    return opts.filter(o => (seen.has(o.label) ? false : seen.add(o.label)));
  })();
  // form state
  const [form, setForm] = useState({
    //basic details
    firstName: "",
    surname: "",
    dob: "",
    gender: "",
    heightFeet: "",
    heightInches: "",
    bodyPhysique: "",
    maritalStatus: "",
    manglikLevel: 0,

    //social background
    religion: "",
    community: "",
    mothertongue: "",
    currentCountry: "",
    currentCity: "",
    placeOfBirthCountry: "",
    placeOfBirthCity: "",
    familyLivingInCountry: "",
    familyLivingInCity: "",
    familyIncome: "",
    familyType: 0,
    livesWithFamily: false,
    
    //Education details
    educationLevel: "",
    fieldOfStudy: "",
    collegeUniversity: "",
    profession: "",
    employedIn: "",
    employedAs: "",
    salaryAmount: "",

    //lifestyle details
    smoking: "",
    drinking: "",
    diet: "",
    routine: "",
    exercise: 0,
    religiousness: 1,
    astrologyBelief: 1,

    //If divorced or married before family details
    hasChildren: false,
    wantsChildren: true,
    //profile photo
    photo: "",
  });
  const dateContainerRef = useRef<HTMLDivElement | null>(null);
  const dayBtnRef = useRef<HTMLInputElement | null>(null);
  const monthBtnRef = useRef<HTMLInputElement | null>(null);
  const yearBtnRef = useRef<HTMLInputElement | null>(null);
  const dayPopupRef = useRef<HTMLDivElement | null>(null);
  const monthPopupRef = useRef<HTMLDivElement | null>(null);
  const yearPopupRef = useRef<HTMLDivElement | null>(null);
  const [dayStyle, setDayStyle] = useState<CSSProperties | null>(null);
  const [monthStyle, setMonthStyle] = useState<CSSProperties | null>(null);
  const [yearStyle, setYearStyle] = useState<CSSProperties | null>(null);
  const [step, setStep] = useState<number | undefined>(undefined);

  // Keep form.dob in sync when selected date/time parts change
  useEffect(() => {
    const date = selectedYear && selectedMonth && selectedDay ? `${selectedYear}-${selectedMonth}-${selectedDay}` : '';
    const combined = date ? (selectedTime ? `${date}T${selectedTime}` : date) : (selectedTime ? `${new Date().toISOString().slice(0,10)}T${selectedTime}` : '');
    setForm(prev => ({ ...prev, dob: combined }));
  }, [selectedDay, selectedMonth, selectedYear, selectedTime]);

  // Sync display text inputs when selected values change (so typing or button selects reflect)
  useEffect(() => {
    setDayInputText(selectedDay ? String(Number(selectedDay)) : '');
  }, [selectedDay]);
  useEffect(() => {
    const mo = months.find(m => m.value === selectedMonth);
    setMonthInputText(mo ? mo.label : '');
  }, [selectedMonth]);
  useEffect(() => {
    setYearInputText(selectedYear || '');
  }, [selectedYear]);

  function handleDayInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setDayInputText(raw);
    if (raw === '') { setSelectedDay(''); return; }
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 1 && n <= 31) {
      const pad = String(n).padStart(2, '0');
      setSelectedDay(pad);
    } else {
      setSelectedDay('');
    }
  }

  function handleMonthInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.trim();
    setMonthInputText(raw);
    if (raw === '') { setSelectedMonth(''); return; }
    const numeric = Number(raw);
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 12) {
      setSelectedMonth(String(numeric).padStart(2, '0'));
      return;
    }
    // try matching month label
    const match = months.find(m => m.label.toLowerCase().startsWith(raw.toLowerCase()));
    if (match) setSelectedMonth(match.value); else setSelectedMonth('');
  }

  function handleYearInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setYearInputText(raw);
    // open the year popup while typing and position it
    const r = yearBtnRef.current?.getBoundingClientRect();
    if (r) setYearStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, width: 144 });
    setOpenPicker('year');
    if (raw === '') { setSelectedYear(''); return; }
    if (years.includes(raw)) setSelectedYear(raw); else setSelectedYear('');
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('profileRegisterStep');
      setStep(saved ? Number(saved) : 0);
    }
  }, []);

  async function submit(): Promise<void> {
    console.log(form);
  }

  function handleReligionChange(v: string) {
    setForm({ ...form, religion: v });
    //setSelectedReligion(v);
    const comms = (communitiesByReligion as any)[v] || [{ value: 'other', label: 'Other' }];
    setSelectedCommunity(comms);
  }

  // Called when user clicks Continue; saves current step data to server
  const handleSaveStep = async (currentStep: number) => {
    try {
      let stepDataPayload;
      switch (currentStep) {
        case 0:
               stepDataPayload = { "step": currentStep,
                                "firstName": form.firstName,
                                "surname": form.surname,
                                "dob": form.dob,
                                "gender": form.gender, 
                                "heightFeet": form.heightFeet,
                                "heightInches": form.heightInches,
                                "bodyPhysique": form.bodyPhysique,
                                "maritalStatus": form.maritalStatus,
                                "manglikLevel": form.manglikLevel,
               };
                break;
        case 1:
                stepDataPayload = { "step": currentStep,
                                "religion": form.religion,
                                "community": form.community,
                                "mothertongue": form.mothertongue,
                                "currentCountry": form.currentCountry,
                                "currentCity": form.currentCity,
                                "placeOfBirthCountry": form.placeOfBirthCountry,
                                "placeOfBirthCity": form.placeOfBirthCity,
                                "familyLivingInCountry": form.familyLivingInCountry,
                                "familyLivingInCity": form.familyLivingInCity,
                                "livesWithFamily": form.livesWithFamily,
                                "familyIncome": form.familyIncome,
                };
                break;
        case 2:
                  stepDataPayload = { "step": currentStep,

                                "educationLevel": form.educationLevel,
                                "fieldOfStudy": form.fieldOfStudy,
                                "collegeUniversity": form.collegeUniversity,
                                "profession": form.profession,
                                "employedIn": form.employedIn,
                                "employedAs": form.employedAs,
                                "salaryAmount": form.salaryAmount,
                  };
                  break;
        case 3:
                  stepDataPayload = { "step": currentStep,
                                "diet": form.diet,
                                "smoking": form.smoking,
                                "drinking": form.drinking,
                                "routine": form.routine,
                                "exercise": form.exercise,
                                "religiousness": form.religiousness,
                                "astrologyBelief": form.astrologyBelief,
                                "hasChildren": form.hasChildren,
                                "wantsChildren": form.wantsChildren,
                                "photo": form.photo
                              };
                  break;
        default:
                  console.warn('No data to save for step', currentStep);
      }

       console.log('Saving step', stepDataPayload); 

      // TODO: integrate with API proxy; for now just noop
      const response = await fetch('/api/profile/save-step', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepDataPayload),
      });
      return;
    } catch (err) {
      console.error('Error saving step:', err);
      throw err;
    }
  };

  // Jump to a specific step when top icon is clicked.
  const handleJumpToStep = async (targetStep: number) => {
    if (typeof step !== 'number') return;
    if (targetStep === step) return;
    try {
      handleStepChange(targetStep);
    } catch (err) {
      console.error('Failed to jump to step', targetStep, err);
    }
  };

  const canProceed = (s: number): boolean => {
    if (s === 0) {
      return (
        form.firstName.trim() !== "" &&
        form.surname.trim() !== "" &&
        form.dob !== "" &&
        form.gender !== ""
      );
    }
    if (s === 1) {
      return form.religion !== "" && form.community !== "";
    }
    if (s === 2) {
      return form.profession.trim() !== "" && form.salaryAmount.trim() !== "";
    }
    if (s === 3) {
      return true;
    }
    if (s === 4) {
      return form.photo !== "";
    }
    return true;
  };

  const canSubmit = (s: number): boolean => {
    return s === 4 ? canProceed(s) : false;
  };

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

  // Close pickers when clicking outside or pressing Escape
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

  // Close day/month/year popups on page scroll, except when scrolling inside their own popup or input
  useEffect(() => {
    function onScroll(e: Event) {
      if (!openPicker) return;
      const target = (e.target as Node) || null;
      const isInsideDay = dayPopupRef.current && target && (dayPopupRef.current === target || dayPopupRef.current.contains(target));
      const isInsideDayInput = dayBtnRef.current && target && (dayBtnRef.current === target || dayBtnRef.current.contains(target));
      const isInsideMonth = monthPopupRef.current && target && (monthPopupRef.current === target || monthPopupRef.current.contains(target));
      const isInsideMonthInput = monthBtnRef.current && target && (monthBtnRef.current === target || monthBtnRef.current.contains(target));

      if (openPicker === 'day' && (isInsideDay || isInsideDayInput)) return;
      if (openPicker === 'month' && (isInsideMonth || isInsideMonthInput)) return;
      // allow scrolling inside year popup without closing if needed
      const isInsideYear = yearPopupRef.current && target && (yearPopupRef.current === target || yearPopupRef.current.contains(target));
      const isInsideYearInput = yearBtnRef.current && target && (yearBtnRef.current === target || yearBtnRef.current.contains(target));
      if (openPicker === 'year' && (isInsideYear || isInsideYearInput)) return;

      setOpenPicker(null);
    }
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, [openPicker]);
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
                {[0, 1, 2, 3, 4].map((s, idx) => (
                  <React.Fragment key={s}>
                    <button
                      type="button"
                      onClick={() => handleJumpToStep(s)}
                      aria-label={["Basic Details","Socio Personal Background","Educational and Professional Background","Lifestyle & Habits","Profile Photo"][s]}
                      aria-current={step === s ? 'step' : undefined}
                      className={`flex items-center justify-center rounded-full border-2 w-8 h-8 text-sm font-bold transition-colors duration-200 
                      ${step === s ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-pink-300 text-pink-500'} focus:outline-none`}
                    >
                      <span className="flex items-center justify-center">
                        {stepIcons[s]}
                      </span>
                    </button>
                    {idx < 4 && (
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
                // Step 1 - Name, DOB, Gender (progressive rows)
                <div>
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
                  </div>
                  <div className="flex flex-col gap-4 p-4">
                    <div className="grid grid-cols-3 gap-4 items-end">
                      <div className="flex flex-col col-span-2">
                        <div className="flex justify-between items-start">
                          <label className="mb-2 font-medium text-pink-700">Date of Birth</label>
                          <label className="mb-2 font-medium text-pink-700">Time of Birth</label>
                        </div>
                        <div ref={dateContainerRef} className="flex gap-2 items-center relative">
                          {/* Day picker button */}
                          <div className="relative">
                            <input
                              ref={dayBtnRef}
                              type="text"
                              inputMode="numeric"
                              placeholder="Day"
                              value={dayInputText}
                              onFocus={() => {
                                if (openPicker === 'day') return setOpenPicker(null);
                                const r = dayBtnRef.current?.getBoundingClientRect();
                                if (r) setDayStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, width: 200 });
                                setOpenPicker('day');
                              }}
                              onChange={handleDayInputChange}
                              className="p-3 border border-pink-300 rounded-md bg-white text-left w-20 focus:outline-none focus:ring-0 focus:border-pink-300"
                            />
                            {openPicker === 'day' && dayStyle && createPortal(
                              <div ref={dayPopupRef} style={dayStyle} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-72 overflow-y-auto pb-6 grid grid-cols-5 gap-2 hide-scrollbar">
                                {days.map((day) => (
                                  <button
                                    key={day}
                                    className={`p-1 text-sm text-center text-lg rounded-md ${selectedDay === day ? 'bg-pink-500 text-white' : 'hover:bg-pink-400 hover:text-white'}`}
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
                            <input
                              ref={monthBtnRef}
                              type="text"
                              placeholder="Month"
                              value={monthInputText}
                              onFocus={() => {
                                if (openPicker === 'month') return setOpenPicker(null);
                                const r = monthBtnRef.current?.getBoundingClientRect();
                                if (r) setMonthStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, width: 160 });
                                setOpenPicker('month');
                              }}
                              onChange={handleMonthInputChange}
                              className="p-3 border border-pink-300 rounded-md bg-white text-left w-20 focus:outline-none focus:ring-0 focus:border-pink-300"
                            />
                            {openPicker === 'month' && monthStyle && createPortal(
                              <div ref={monthPopupRef} style={monthStyle} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-72 overflow-y-auto grid grid-cols-3 gap-2">
                                {months.map((mo) => (
                                  <button
                                    key={mo.value}
                                    className={`p-2 text-sm rounded-md ${selectedMonth === mo.value ? 'bg-pink-500 text-white' : 'hover:bg-pink-400 hover:text-white'}`}
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
                            <input
                              ref={yearBtnRef}
                              type="text"
                              inputMode="numeric"
                              placeholder="Year"
                              value={yearInputText}
                              onFocus={() => {
                                if (openPicker === 'year') return setOpenPicker(null);
                                const r = yearBtnRef.current?.getBoundingClientRect();
                                if (r) setYearStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, width: 80 });
                                setOpenPicker('year');
                              }}
                              onChange={handleYearInputChange}
                              className="p-3 border border-pink-300 rounded-md bg-white text-left w-20 focus:outline-none focus:ring-0 focus:border-pink-300"
                            />
                            {openPicker === 'year' && yearStyle && createPortal(
                              <div ref={yearPopupRef} style={yearStyle} className="z-50 bg-white border border-pink-100 rounded-md p-2 shadow max-h-72 overflow-y-auto pb-6 w-36 grid grid-cols-1 gap-2 hide-scrollbar">
                                {(yearInputText ? years.filter(y => y.startsWith(yearInputText)) : years).map((y) => (
                                  <button
                                    key={y}
                                    className={`p-2 text-sm rounded-md ${selectedYear === y ? 'bg-pink-500 text-white' : 'hover:bg-pink-400 hover:text-white'} text-left`}
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
                          <div className="ml-10 flex items-center gap-4" style={{ height: '3.25rem' }}>
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
                  </div>

                  <div className="flex gap-4 pl-4">
                    <div>
                      <label className="mb-2 font-medium text-pink-700">Gender</label>
                      <div className="flex gap-4 items-center mt-4">
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
                    
                    <div className="flex flex-col ml-10">
                      <label className="mb-2 font-medium text-pink-700">Height</label>
                      <div className="flex gap-2 items-center ml-2">
                        <ScrollableDropdown
                          label="Feet"
                          options={feetOptions}
                          initialValue={form.heightFeet}
                          onChange={(v) => setForm({ ...form, heightFeet: v })}
                          className="w-20"
                        />
                        <ScrollableDropdown
                          label="Inches"
                          options={inchOptions}
                          initialValue={form.heightInches}
                          onChange={(v) => setForm({ ...form, heightInches: v })}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-pink-100 my-4 mx-5" />
                  <div className="flex flex-col pl-4">
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

                  <div className="flex flex-col gap-4 p-4">
                    <div className="mt-3">
                      <label className="mb-1 font-medium text-pink-700">Marital Status</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          { value: 'never_married', label: 'Never Married' },
                          { value: 'married', label: 'Married' },
                          { value: 'divorced', label: 'Divorced' },
                          { value: 'widowed', label: 'Widowed' },
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
                    <div className="mt-3">
                      <label className="mb-1 font-medium text-pink-700">Are you Manglik?</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          { value: 0, label: "I don't know" },
                          { value: 1, label: 'No' },
                          { value: 2, label: 'Anshik/Partial' },
                          { value: 3, label: 'Yes' },
                        ].map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setForm({ ...form, manglikLevel: m.value })}
                            className={`px-3 py-1 rounded-md border ${form.manglikLevel === m.value ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-700 border-pink-100'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
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
                    <div className="border-t border-pink-100 my-4 mx-5" />
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="mb-3 font-medium text-lg text-pink-700">Currently living in</label>
                        <div className="grid grid-cols-2 gap-3">
                          <ScrollableDropdown
                            label="Country"
                            options={countryOptions}
                            initialValue={form.currentCountry}
                            onChange={(v) => setForm({ ...form, currentCountry: v })}
                          />
                          <ScrollableDropdown
                            label="City"
                            options={
                              form.currentCountry
                                ? (placesByCountry[form.currentCountry] || []).flatMap((st: any) => {
                                    const countryLabel = (countryOptions.find(c => c.value === form.currentCountry) || { label: '' }).label;
                                    return st.cities.map((c: any) => ({ value: `${c.label}, ${st.label}${countryLabel ? `, ${countryLabel}` : ''}`, label: `${c.label}, ${st.label}${countryLabel ? `, ${countryLabel}` : ''}` }));
                                  })
                                : cityOptionsExtended
                            }
                            initialValue={form.currentCity}
                            onChange={(v) => setForm({ ...form, currentCity: v })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="mb-3 font-medium text-lg text-pink-700">Place of Birth</label>
                          <div className="grid grid-cols-2 gap-3">
                          <ScrollableDropdown
                            label="Country"
                            options={countryOptions}
                            initialValue={form.placeOfBirthCountry}
                            onChange={(v) => setForm({ ...form, placeOfBirthCountry: v })}
                          />
                          <ScrollableDropdown
                            label="City"
                            options={
                              form.placeOfBirthCountry
                                ? (placesByCountry[form.placeOfBirthCountry] || []).flatMap((st: any) => {
                                    const countryLabel = (countryOptions.find(c => c.value === form.placeOfBirthCountry) || { label: '' }).label;
                                    return st.cities.map((c: any) => ({ value: `${c.label}, ${st.label}${countryLabel ? `, ${countryLabel}` : ''}`, label: `${c.label}, ${st.label}${countryLabel ? `, ${countryLabel}` : ''}` }));
                                  })
                                : cityOptionsExtended
                            }
                            initialValue={form.placeOfBirthCity}
                            onChange={(v) => setForm({ ...form, placeOfBirthCity: v })}
                          />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="mb-3 font-medium text-lg text-pink-700">Family living in</label>
                          <div className="grid grid-cols-2 gap-3">
                            <ScrollableDropdown
                              label="Country"
                              options={countryOptions}
                              initialValue={form.familyLivingInCountry}
                              onChange={(v) => setForm({ ...form, familyLivingInCountry: v })}
                            />
                            <ScrollableDropdown
                              label="City"
                              options={
                                form.familyLivingInCountry
                                  ? (placesByCountry[form.familyLivingInCountry] || []).flatMap((st: any) => {
                                      const countryLabel = (countryOptions.find(c => c.value === form.familyLivingInCountry) || { label: '' }).label;
                                      return st.cities.map((c: any) => ({ value: `${c.label}, ${st.label}${countryLabel ? `, ${countryLabel}` : ''}`, label: `${c.label}, ${st.label}${countryLabel ? `, ${countryLabel}` : ''}` }));
                                    })
                                  : cityOptionsExtended
                              }
                              initialValue={form.familyLivingInCity}
                              onChange={(v) => setForm({ ...form, familyLivingInCity: v })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end mt-3">
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

                      <div className="flex items-center">
                        <label className="mb-1 font-medium text-pink-700 mr-3">Lives With Family</label>
                        <input type="checkbox" checked={!!form.livesWithFamily} onChange={(e) => setForm({ ...form, livesWithFamily: e.target.checked })} /> 
                      </div>

                      <div className="mt-3">
                      <label className="mb-1 font-medium text-pink-700">Family Type</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          { value: 0, label: "Joint" },
                          { value: 1, label: 'Nuclear' },
                          { value: 2, label: 'Extended' },
                        ].map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setForm({ ...form, familyType: m.value })}
                            className={`px-3 py-1 rounded-md border ${form.familyType === m.value ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-700 border-pink-100'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    </div>
                  </div>
                </div>,

                // Step 3 - Profession & Salary
                <div className="flex flex-col gap-4 p-4">
                  <h2 className="text-xl font-semibold text-pink-700">Educational Career</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <ScrollableDropdown
                      label="Highest Education Level"
                      options={educationOptions}
                      initialValue={form.educationLevel}
                      onChange={(v) => setForm({ ...form, educationLevel: v })}
                    />
                    <ScrollableDropdown
                      label="Field of Study"
                      options={fieldOfStudyOptions}
                      initialValue={form.fieldOfStudy}
                      onChange={(v) => setForm({ ...form, fieldOfStudy: v })}
                    />
                    <ScrollableDropdown
                      label="College / School"
                      options={collegeOptions}
                      initialValue={form.collegeUniversity}
                      onChange={(v) => setForm({ ...form, collegeUniversity: v })}
                    />
                  </div>

                  <div className="border-t border-pink-100 my-4 mx-5" />
                  <h2 className="text-xl font-semibold text-pink-700">Professional Career</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <ScrollableDropdown
                      label="Profession"
                      options={professionOptions}
                      initialValue={form.profession}
                      onChange={(v) => setForm({ ...form, profession: v })}
                    />

                    <ScrollableDropdown
                      label="Employed In"
                      options={employedInOptions}
                      initialValue={form.employedIn}
                      onChange={(v) => setForm({ ...form, employedIn: v })}
                    />

                    <ScrollableDropdown
                      label="Employed As"
                      options={employedAsOptions}
                      initialValue={form.employedAs}
                      onChange={(v) => setForm({ ...form, employedAs: v })}
                    />

                    <div className="grid grid-cols-5 gap-3 items-center">
                      <div className="col-span-5">
                        <label className="mt-2 font-medium text-pink-700 block">Salary/Package</label>
                      </div>
                      <ScrollableDropdown
                        label="Salary Amount"
                        className="col-span-2 height-60"
                        options={familyIncomeOptions}
                        initialValue={form.salaryAmount}
                        onChange={(v) => setForm({ ...form, salaryAmount: v })}
                      />
                      <div className="text-sm text-gray-500">per <br />annum</div>
                </div>
              </div>
            </div>,
                // Step 4 - Lifestyle & Habits
                <div className="flex flex-col gap-4 p-4">
                  <h2 className="text-xl font-semibold text-pink-700">Lifestyle & Habits</h2>
                  <div className="grid grid-cols-1 gap-3">
                    <ScrollableDropdown
                      label="Smoking"
                      options={smokingOptions}
                      initialValue={form.smoking}
                      onChange={(v) => setForm({ ...form, smoking: v })}
                    />
                    <ScrollableDropdown
                      label="Drinking"
                      options={drinkingOptions}
                      initialValue={form.drinking}
                      onChange={(v) => setForm({ ...form, drinking: v })}
                    />
                    <ScrollableDropdown
                      label="Diet"
                      options={dietOptions}
                      initialValue={form.diet}
                      onChange={(v) => setForm({ ...form, diet: v })}
                    />
                    <ScrollableDropdown
                      label="Daily Routine"
                      options={routineOptions}
                      initialValue={form.routine}
                      onChange={(v) => setForm({ ...form, routine: v })}
                    />
                    <div className="grid grid-cols-1 gap-3 mt-2">
                      <div>
                        <label className="mb-1 font-medium text-pink-700">Exercise (0-10)</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={0}
                            max={10}
                            value={form.exercise}
                            onChange={(e) => setForm({ ...form, exercise: Number(e.target.value) })}
                            className="pink-range w-full"
                          />
                          <div className="w-12 text-right text-sm text-gray-700">{form.exercise}</div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 font-medium text-pink-700">Do you believe in God? (1-10)</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={form.astrologyBelief}
                            onChange={(e) => setForm({ ...form, astrologyBelief: Number(e.target.value) })}
                            className="pink-range w-full"
                          />
                          <div className="w-12 text-right text-sm text-gray-700">{form.astrologyBelief}</div>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 font-medium text-pink-700">Religiosity (1-10)</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={form.religiousness}
                            onChange={(e) => setForm({ ...form, religiousness: Number(e.target.value) })}
                            className="pink-range w-full"
                          />
                          <div className="w-12 text-right text-sm text-gray-700">{form.religiousness}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>,

                // Step 5 - Profile Photo
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