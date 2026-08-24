"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AvatarCropper,
  ChipGroup,
  DatePicker,
  HorizontalFormSlider,
  RangeSlider,
  SelectDropdown,
  TextField,
  TimePicker,
} from "@lokesh-workspace/ui";

import PhotoGallery from "@/components/profile/PhotoGallery";
import { useAuth } from "@/components/authProvider";
import {
  clearProfileDraft,
  draftOwnerKey,
  readProfileDraft,
  saveProfileDraft,
} from "@/lib/profileDraft";
import { communitiesFor, RELIGION_OPTIONS } from "@/lib/profileDisplay";
import { motherTongueOptions } from "@/constants/selectOptions/social";
import { placesByCountry, COUNTRY_OPTIONS } from "@/constants/selectOptions/places";
import {
  professionOptions,
  educationOptions,
  fieldOfStudyOptions,
  collegeOptions,
  employedAsOptions,
  employedInOptions,
} from "@/constants/selectOptions/career";
import { familyIncomeOptions } from "@/constants/selectOptions/people";
import {
  physiqueOptions,
  smokingOptions,
  drinkingOptions,
  dietOptions,
  routineOptions,
  feetOptions,
  inchOptions,
} from "@/constants/selectOptions/person";

const STEPS = [
  { title: "Basic Details", hint: "How you appear to other families." },
  { title: "Social Background", hint: "Religion, community and where you live." },
  { title: "Education & Career", hint: "Your studies and what you do." },
  { title: "Lifestyle & Habits", hint: "Day-to-day preferences and beliefs." },
  { title: "Profile Photo", hint: "A friendly face gets far more interest." },
];

const STEP_ICONS = [
  (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21a6.5 6.5 0 00-15 0" /></svg>),
  (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20a4 4 0 00-8 0" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 8a4 4 0 110-8 4 4 0 010 8zM21 12a4 4 0 10-8 0 4 4 0 008 0z" /></svg>),
  (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a4 4 0 018 0v2" /></svg>),
  (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" /></svg>),
  (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h3l2-3h6l2 3h3v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><circle cx="12" cy="13" r="3" /></svg>),
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const MARITAL_OPTIONS = [
  { value: "never_married", label: "Never Married" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "annulled", label: "Annulled" },
  { value: "awaiting_divorce", label: "Awaiting Divorce" },
];

const MANGLIK_OPTIONS = [
  { value: 0, label: "I don't know" },
  { value: 1, label: "No" },
  { value: 2, label: "Anshik / Partial" },
  { value: 3, label: "Yes" },
];

// Order matches Profile.FAMILY_TYPE_CHOICES on the Django model.
const FAMILY_TYPE_OPTIONS = [
  { value: 0, label: "Nuclear" },
  { value: 1, label: "Joint" },
  { value: 2, label: "Extended" },
];

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

// Marital statuses where questions about existing children are relevant.
const WAS_MARRIED = new Set(["married", "divorced", "widowed", "annulled", "awaiting_divorce"]);

const INITIAL_FORM = {
  firstName: "",
  surname: "",
  dob: "",
  gender: "",
  heightFeet: "",
  heightInches: "",
  bodyPhysique: "",
  maritalStatus: "",
  manglikLevel: 0,

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

  educationLevel: "",
  fieldOfStudy: "",
  collegeUniversity: "",
  profession: "",
  employedIn: "",
  employedAs: "",
  salaryAmount: "",

  smoking: "",
  drinking: "",
  diet: "",
  routine: "",
  exercise: 0,
  religiousness: 5,
  astrologyBelief: 5,

  hasChildren: false,
  wantsChildren: true,

  photo: "",
  photos: [] as string[],
};

type FormState = typeof INITIAL_FORM;

// How long the green confirmation stays on the step that was just saved,
// before the wizard slides on.
const SAVE_CONFIRM_MS = 1100;

// Which keys belong to which wizard step - drives both saving and validation.
const STEP_FIELDS: (keyof FormState)[][] = [
  ["firstName", "surname", "dob", "gender", "heightFeet", "heightInches", "bodyPhysique", "maritalStatus", "manglikLevel"],
  ["religion", "community", "mothertongue", "currentCountry", "currentCity", "placeOfBirthCountry", "placeOfBirthCity", "familyLivingInCountry", "familyLivingInCity", "familyIncome", "familyType", "livesWithFamily"],
  ["educationLevel", "fieldOfStudy", "collegeUniversity", "profession", "employedIn", "employedAs", "salaryAmount"],
  ["diet", "smoking", "drinking", "routine", "exercise", "religiousness", "astrologyBelief", "hasChildren", "wantsChildren"],
  ["photo", "photos"],
];

/** SelectDropdown with the wizard's shared look, so every picker matches. */
function PickerField({
  label,
  options,
  value,
  onChange,
  searchable = false,
  className = "",
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  className?: string;
}) {
  return (
    <SelectDropdown
      label={label}
      placeholder=""
      options={options}
      value={value}
      onChange={onChange}
      searchable={searchable}
      className={className}
      LabelX={-2}
      LabelY={-20}
      PlaceHolderX={2}
      PlaceHolderY={2}
    />
  );
}

export default function ProfileRegisterPage() {
  const router = useRouter();
  const auth = useAuth();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [step, setStep] = useState<number | undefined>(undefined);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string>("");
  // Names the step that was saved, so the confirmation stays truthful after
  // the wizard advances. Cleared on a timer.
  const [savedNotice, setSavedNotice] = useState<string>("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [completeness, setCompleteness] = useState<number>(0);

  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Guards the draft-persisting effect. Without it the empty INITIAL_FORM is
  // written to localStorage on first render and then read back over the values
  // fetched from the server, wiping the name captured at sign-up.
  const hydrated = useRef(false);
  // Identifies whose draft this is; empty until /me answers, which keeps a
  // signed-out visitor from ever reading or writing one.
  const draftOwner = useRef<string>("");

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Aggregated "City, State, Country" list used when no country is chosen yet.
  const cityOptionsExtended = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    Object.entries(placesByCountry).forEach(([countryKey, states]) => {
      const countryLabel = COUNTRY_OPTIONS.find((c) => c.value === countryKey)?.label ?? "";
      states.forEach((st) => {
        st.cities.forEach((c) => {
          const label = `${c.label}, ${st.label}${countryLabel ? `, ${countryLabel}` : ""}`;
          opts.push({ value: label, label });
        });
      });
    });
    const seen = new Set<string>();
    return opts.filter((o) => (seen.has(o.label) ? false : seen.add(o.label)));
  }, []);

  const citiesFor = useCallback(
    (country: string) => {
      if (!country) return cityOptionsExtended;
      const countryLabel = COUNTRY_OPTIONS.find((c) => c.value === country)?.label ?? "";
      return (placesByCountry[country] ?? []).flatMap((st) =>
        st.cities.map((c) => {
          const label = `${c.label}, ${st.label}${countryLabel ? `, ${countryLabel}` : ""}`;
          return { value: label, label };
        }),
      );
    },
    [cityOptionsExtended],
  );

  const communityOptions = useMemo(() => communitiesFor(form.religion), [form.religion]);

  /* ---------- Hydration: sign-up details first, local draft on top ---------- */
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let restored: Partial<FormState> = {};
      let owner = "";

      try {
        const response = await fetch("/api/profile/me");
        if (response.ok) {
          const data = await response.json();
          owner = draftOwnerKey(data);
          setCompleteness(Number(data.profile_completeness ?? 0));
          // Name and gender were captured during registration - prefill them,
          // along with anything already saved by a previous visit.
          (Object.keys(INITIAL_FORM) as (keyof FormState)[]).forEach((key) => {
            const value = data[key];
            if (value !== null && value !== undefined && value !== "") {
              (restored as any)[key] = value;
            }
          });
        }
      } catch {
        // Offline - show whatever the server last gave us, never a draft we
        // cannot attribute to this account.
      }

      draftOwner.current = owner;

      // A local draft wins over the server, but only for keys the user actually
      // filled in, and only when it is stamped with this profile. An unowned or
      // foreign draft is dropped by readProfileDraft.
      const draft = readProfileDraft<FormState>(owner);
      let draftStep: number | null = null;

      if (draft) {
        draftStep = draft.step;
        (Object.keys(draft.form) as (keyof FormState)[]).forEach((key) => {
          const value = draft.form[key];
          if (value !== null && value !== undefined && value !== "") {
            (restored as any)[key] = value;
          }
        });
      }

      if (cancelled) return;

      setForm((prev) => ({ ...prev, ...restored }));

      if (restored.dob) {
        const [datePart, timePart] = String(restored.dob).split("T");
        const [y, m, d] = datePart.split("-");
        if (y && m && d) {
          setSelectedYear(y);
          setSelectedMonth(m);
          setSelectedDay(d);
        }
        if (timePart) setSelectedTime(timePart.slice(0, 5));
      }

      setStep(draftStep ?? 0);
      hydrated.current = true;
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // The save status describes the step it happened on. Landing on a new step -
  // forwards after a save, or backwards - must not inherit it, otherwise a
  // freshly opened step claims "Saved" before anything was sent.
  useEffect(() => {
    setSaveState("idle");
    setSaveError("");
  }, [step]);

  // Editing after a save makes that confirmation stale too.
  useEffect(() => {
    setSaveState((prev) => (prev === "saved" ? "idle" : prev));
  }, [form]);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  // Keep dob in sync with the date/time pickers.
  useEffect(() => {
    if (!selectedYear || !selectedMonth || !selectedDay) return;
    const date = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    setField("dob", selectedTime ? `${date}T${selectedTime}` : date);
  }, [selectedDay, selectedMonth, selectedYear, selectedTime, setField]);

  useEffect(() => {
    if (!hydrated.current || step === undefined) return;
    saveProfileDraft(draftOwner.current, form, step);
  }, [form, step]);

  /* ---------- Saving ---------- */

  const buildStepPayload = (currentStep: number) => {
    const payload: Record<string, unknown> = { step: currentStep };
    STEP_FIELDS[currentStep]?.forEach((key) => {
      payload[key] = form[key];
    });
    return payload;
  };

  const saveStep = useCallback(
    async (currentStep: number): Promise<boolean> => {
      setSaveState("saving");
      setSaveError("");
      try {
        const response = await fetch("/api/profile/save-step", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildStepPayload(currentStep)),
        });

        if (response.status === 401) {
          // Refresh token expired too - the session is genuinely over.
          auth.loginRequiredRedirect();
          return false;
        }

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
          setSaveState("error");
          setSaveError(result.detail ?? "Could not save. Please try again.");
          return false;
        }

        setCompleteness(Number(result.profile_completeness ?? 0));
        if (typeof result.is_complete === "boolean") auth.setProfileComplete(result.is_complete);
        setSaveState("saved");

        setSavedNotice(`${STEPS[currentStep]?.title ?? "Step"} saved`);
        if (noticeTimer.current) clearTimeout(noticeTimer.current);
        noticeTimer.current = setTimeout(() => setSavedNotice(""), 2500);
        return true;
      } catch {
        setSaveState("error");
        setSaveError("Network error. Please try again.");
        return false;
      }
    },
    [form, auth],
  );

  // HorizontalFormSlider advances only when onNext resolves without throwing,
  // so holding here keeps the green confirmation on the step it belongs to
  // before the slide begins.
  const handleNext = async (currentStep: number) => {
    const saved = await saveStep(currentStep);
    if (!saved) throw new Error("save-failed");

    await new Promise((resolve) => setTimeout(resolve, SAVE_CONFIRM_MS));

    // Clear it as we move, so the incoming step never inherits the message.
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setSavedNotice("");
  };

  const handleSubmit = async () => {
    const saved = await saveStep(4);
    if (!saved) return;

    // Let the confirmation register before navigating away.
    await new Promise((resolve) => setTimeout(resolve, SAVE_CONFIRM_MS));

    clearProfileDraft();
    router.push("/profile/me");
  };

  /* ---------- Step gating ---------- */

  const canProceed = (s: number): boolean => {
    if (s === 0) {
      return (
        form.firstName.trim() !== "" &&
        form.surname.trim() !== "" &&
        form.dob !== "" &&
        form.gender !== "" &&
        form.heightFeet !== "" &&
        form.maritalStatus !== ""
      );
    }
    if (s === 1) {
      return form.religion !== "" && form.community !== "" && form.currentCountry !== "";
    }
    if (s === 2) {
      return form.educationLevel !== "" && form.profession !== "" && form.salaryAmount !== "";
    }
    if (s === 3) {
      return form.diet !== "" && form.routine !== "";
    }
    return true;
  };

  const canSubmit = (s: number): boolean => s === 4 && form.photo !== "";

  const handleJumpToStep = (target: number) => {
    if (step === undefined || target === step) return;
    // Only allow jumping back, or forward through steps already satisfied.
    if (target < step) {
      setStep(target);
      return;
    }
    for (let s = step; s < target; s += 1) {
      if (!canProceed(s)) return;
    }
    setStep(target);
  };

  if (step === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-color-placeholder-text">Loading your profile…</p>
      </div>
    );
  }

  const active = STEPS[step];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50/40 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-color-border bg-white p-5 shadow-[0_20px_40px_rgba(219,39,119,0.10)] sm:p-8">

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Complete your profile</h1>
            <p className="mt-1 text-sm text-color-placeholder-text">
              Profiles that are 95% complete get shown to matches.
            </p>
            <div className="mx-auto mt-4 max-w-sm">
              <div className="h-2 w-full overflow-hidden rounded-full bg-pink-100">
                <div
                  className="h-full rounded-full bg-color-primary transition-all duration-500"
                  style={{ width: `${Math.min(completeness, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-color-placeholder-text">{completeness}% complete</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="mb-6">
            <div className="flex items-center">
              {STEPS.map((s, idx) => (
                <React.Fragment key={s.title}>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep(idx)}
                    aria-label={s.title}
                    aria-current={step === idx ? "step" : undefined}
                    title={s.title}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors
                      ${step === idx
                        ? "border-color-primary bg-color-primary text-white"
                        : idx < step
                          ? "border-color-primary bg-pink-100 text-color-primary"
                          : "border-pink-200 bg-white text-pink-400"}
                      focus:outline-none focus:ring-2 focus:ring-color-primary-light`}
                  >
                    {STEP_ICONS[idx]}
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`mx-1 h-1 flex-1 rounded-full ${idx < step ? "bg-color-primary" : "bg-pink-200"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-color-primary">{active.title}</h2>
              <p className="text-sm text-color-placeholder-text">{active.hint}</p>
            </div>
          </div>

          {/* Save status */}
          <div className="mb-4 min-h-[1.25rem] text-sm" aria-live="polite">
            {saveState === "saving" && <span className="text-color-placeholder-text">Saving…</span>}
            {saveState === "error" && <span className="text-red-600">{saveError}</span>}
            {saveState !== "saving" && saveState !== "error" && savedNotice && (
              <span className="inline-flex items-center gap-1.5 text-green-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {savedNotice}
              </span>
            )}
          </div>

          <HorizontalFormSlider
            busyLabel={saveState === "saving" ? "Saving…" : "Saved"}
            onSubmit={handleSubmit}
            onNext={handleNext}
            canProceed={canProceed}
            canSubmit={canSubmit}
            step={step}
            setStep={setStep}
            steps={[
              /* ---------- Step 0: Basic details ---------- */
              <div key="basic" className="flex flex-col gap-5 px-1">
                <div className="form-grid-2">
                  <TextField
                    id="firstName"
                    label="First Name"
                    value={form.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                  />
                  <TextField
                    id="surname"
                    label="Surname"
                    value={form.surname}
                    onChange={(e) => setField("surname", e.target.value)}
                  />
                </div>

                {/* Date and time of birth share one row. */}
                <div className="form-section">
                  <p className="form-section-title">Date &amp; time of birth</p>
                  <p className="form-section-hint">Time of birth is optional — it is only used for horoscope matching.</p>
                  <div className="mt-3 flex flex-nowrap items-center gap-4 overflow-x-auto pb-1">
                    <div className="shrink-0">
                      <span className="mb-1 block text-xs font-medium text-color-placeholder-text">Date of birth</span>
                      <DatePicker
                        value={form.dob ? form.dob.split("T")[0] : ""}
                        onDateChange={(y, m, d) => {
                          setSelectedYear(y);
                          setSelectedMonth(m);
                          setSelectedDay(d);
                        }}
                      />
                    </div>
                    <div className="mt-5 hidden h-8 w-px shrink-0 bg-color-border sm:block" />
                    <div className="shrink-0">
                      <span className="mb-1 block text-xs font-medium text-color-placeholder-text">Time of birth</span>
                      <TimePicker
                        value={selectedTime}
                        onChange={setSelectedTime}
                        inputClassName="p-3 w-12"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-grid-2">
                  <ChipGroup
                    label="Gender"
                    options={GENDER_OPTIONS}
                    value={form.gender}
                    onChange={(v) => setField("gender", v)}
                  />
                  <div>
                    <span className="field-label">Height</span>
                    <div className="flex gap-3">
                      <PickerField
                        label="Feet"
                        options={feetOptions}
                        value={form.heightFeet}
                        onChange={(v) => setField("heightFeet", v)}
                        className="w-28"
                      />
                      <PickerField
                        label="Inches"
                        options={inchOptions}
                        value={form.heightInches}
                        onChange={(v) => setField("heightInches", v)}
                        className="w-28"
                      />
                    </div>
                  </div>
                </div>

                <ChipGroup
                  label="Body Physique"
                  options={physiqueOptions}
                  value={form.bodyPhysique}
                  onChange={(v) => setField("bodyPhysique", v)}
                />

                <ChipGroup
                  label="Marital Status"
                  options={MARITAL_OPTIONS}
                  value={form.maritalStatus}
                  onChange={(v) => setField("maritalStatus", v)}
                />

                <ChipGroup
                  label="Are you Manglik?"
                  options={MANGLIK_OPTIONS}
                  value={form.manglikLevel}
                  onChange={(v) => setField("manglikLevel", v)}
                />
              </div>,

              /* ---------- Step 1: Social background ---------- */
              <div key="social" className="flex flex-col gap-5 px-1">
                <div className="form-grid-2">
                  <PickerField
                    label="Religion"
                    options={RELIGION_OPTIONS}
                    value={form.religion}
                    onChange={(v) => setForm((prev) => ({ ...prev, religion: v, community: "" }))}
                  />
                  <PickerField
                    label="Caste / Community"
                    options={communityOptions}
                    value={form.community}
                    onChange={(v) => setField("community", v)}
                    searchable
                  />
                </div>

                <PickerField
                  label="Mother Tongue"
                  options={motherTongueOptions}
                  value={form.mothertongue}
                  onChange={(v) => setField("mothertongue", v)}
                  searchable
                />

                <div className="form-section">
                  <p className="form-section-title">Currently living in</p>
                  <div className="form-grid-2 mt-3">
                    <PickerField
                      label="Country"
                      options={COUNTRY_OPTIONS}
                      value={form.currentCountry}
                      onChange={(v) => setForm((prev) => ({ ...prev, currentCountry: v, currentCity: "" }))}
                      searchable
                    />
                    <PickerField
                      label="City"
                      options={citiesFor(form.currentCountry)}
                      value={form.currentCity}
                      onChange={(v) => setField("currentCity", v)}
                      searchable
                    />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">Place of birth</p>
                  <div className="form-grid-2 mt-3">
                    <PickerField
                      label="Country"
                      options={COUNTRY_OPTIONS}
                      value={form.placeOfBirthCountry}
                      onChange={(v) => setForm((prev) => ({ ...prev, placeOfBirthCountry: v, placeOfBirthCity: "" }))}
                      searchable
                    />
                    <PickerField
                      label="City"
                      options={citiesFor(form.placeOfBirthCountry)}
                      value={form.placeOfBirthCity}
                      onChange={(v) => setField("placeOfBirthCity", v)}
                      searchable
                    />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">Family details</p>
                  <div className="form-grid-2 mt-3">
                    <PickerField
                      label="Family lives in (country)"
                      options={COUNTRY_OPTIONS}
                      value={form.familyLivingInCountry}
                      onChange={(v) => setForm((prev) => ({ ...prev, familyLivingInCountry: v, familyLivingInCity: "" }))}
                      searchable
                    />
                    <PickerField
                      label="Family lives in (city)"
                      options={citiesFor(form.familyLivingInCountry)}
                      value={form.familyLivingInCity}
                      onChange={(v) => setField("familyLivingInCity", v)}
                      searchable
                    />
                  </div>

                  <div className="mt-4">
                    <PickerField
                      label="Family income (per annum)"
                      options={familyIncomeOptions}
                      value={form.familyIncome}
                      onChange={(v) => setField("familyIncome", v)}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ChipGroup
                      label="Family Type"
                      options={FAMILY_TYPE_OPTIONS}
                      value={form.familyType}
                      onChange={(v) => setField("familyType", v)}
                    />
                    <ChipGroup
                      label="Lives with family"
                      options={YES_NO_OPTIONS}
                      value={form.livesWithFamily ? "yes" : "no"}
                      onChange={(v) => setField("livesWithFamily", v === "yes")}
                    />
                  </div>
                </div>
              </div>,

              /* ---------- Step 2: Education & career ---------- */
              <div key="career" className="flex flex-col gap-5 px-1">
                <div className="form-section">
                  <p className="form-section-title">Education</p>
                  <div className="mt-4 flex flex-col gap-5">
                    <PickerField
                      label="Highest Education Level"
                      options={educationOptions}
                      value={form.educationLevel}
                      onChange={(v) => setField("educationLevel", v)}
                      searchable
                    />
                    <PickerField
                      label="Field of Study"
                      options={fieldOfStudyOptions}
                      value={form.fieldOfStudy}
                      onChange={(v) => setField("fieldOfStudy", v)}
                      searchable
                    />
                    <PickerField
                      label="College / University"
                      options={collegeOptions}
                      value={form.collegeUniversity}
                      onChange={(v) => setField("collegeUniversity", v)}
                      searchable
                    />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">Profession</p>
                  <div className="mt-4 flex flex-col gap-5">
                    <PickerField
                      label="Profession"
                      options={professionOptions}
                      value={form.profession}
                      onChange={(v) => setField("profession", v)}
                      searchable
                    />
                    <PickerField
                      label="Employed In"
                      options={employedInOptions}
                      value={form.employedIn}
                      onChange={(v) => setField("employedIn", v)}
                    />
                    <PickerField
                      label="Employed As"
                      options={employedAsOptions}
                      value={form.employedAs}
                      onChange={(v) => setField("employedAs", v)}
                      searchable
                    />
                    <PickerField
                      label="Annual income"
                      options={familyIncomeOptions}
                      value={form.salaryAmount}
                      onChange={(v) => setField("salaryAmount", v)}
                    />
                  </div>
                </div>
              </div>,

              /* ---------- Step 3: Lifestyle ---------- */
              <div key="lifestyle" className="flex flex-col gap-5 px-1">
                <div className="form-grid-2">
                  <PickerField
                    label="Diet"
                    options={dietOptions}
                    value={form.diet}
                    onChange={(v) => setField("diet", v)}
                  />
                  <PickerField
                    label="Daily Routine"
                    options={routineOptions}
                    value={form.routine}
                    onChange={(v) => setField("routine", v)}
                  />
                  <PickerField
                    label="Smoking"
                    options={smokingOptions}
                    value={form.smoking}
                    onChange={(v) => setField("smoking", v)}
                  />
                  <PickerField
                    label="Drinking"
                    options={drinkingOptions}
                    value={form.drinking}
                    onChange={(v) => setField("drinking", v)}
                  />
                </div>

                <div className="form-section flex flex-col gap-6">
                  <RangeSlider
                    label="How often do you exercise?"
                    value={form.exercise}
                    onChange={(v) => setField("exercise", v)}
                    endLabels={["Never", "Daily"]}
                    captions={["Never", "Rarely", "Sometimes", "Often", "Daily"]}
                  />
                  <RangeSlider
                    label="How religious are you?"
                    value={form.religiousness}
                    onChange={(v) => setField("religiousness", v)}
                    endLabels={["Not at all", "Very"]}
                    captions={["Not religious", "Slightly", "Moderately", "Quite religious", "Very religious"]}
                  />
                  <RangeSlider
                    label="Do you believe in astrology?"
                    value={form.astrologyBelief}
                    onChange={(v) => setField("astrologyBelief", v)}
                    endLabels={["Not at all", "Strongly"]}
                    captions={["Not at all", "Slightly", "Somewhat", "Strongly", "Completely"]}
                  />
                </div>

                <div className="form-section grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {WAS_MARRIED.has(form.maritalStatus) && (
                    <ChipGroup
                      label="Do you have children?"
                      options={YES_NO_OPTIONS}
                      value={form.hasChildren ? "yes" : "no"}
                      onChange={(v) => setField("hasChildren", v === "yes")}
                    />
                  )}
                  <ChipGroup
                    label="Do you want children?"
                    options={YES_NO_OPTIONS}
                    value={form.wantsChildren ? "yes" : "no"}
                    onChange={(v) => setField("wantsChildren", v === "yes")}
                  />
                </div>
              </div>,

              /* ---------- Step 4: Photos ---------- */
              <div key="photo" className="flex flex-col gap-6 px-1">
                <div className="form-section flex flex-col items-center">
                  <p className="form-section-title">Display photo</p>
                  <p className="form-section-hint mb-4 text-center">
                    Drag the photo to reposition it, and zoom until your face fills the circle.
                  </p>

                  <AvatarCropper
                    value={form.photo}
                    onChange={(dataUrl) => setField("photo", dataUrl)}
                    size={224}
                  />

                  {form.photo && (
                    <p className="avatar-hint mt-3">
                      This is how you appear in search results and to your matches.
                    </p>
                  )}
                </div>

                <div className="form-section">
                  <p className="form-section-title">More photos</p>
                  <p className="form-section-hint mb-4">
                    Optional. Add a few more so families can get a fuller picture of you.
                  </p>
                  <PhotoGallery
                    value={form.photos}
                    onChange={(photos) => setField("photos", photos)}
                  />
                </div>
              </div>,
            ]}
          />
        </div>
      </div>
    </div>
  );
}
