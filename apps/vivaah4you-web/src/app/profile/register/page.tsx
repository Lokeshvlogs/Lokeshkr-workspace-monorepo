"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AvatarCropper,
  BirthDateTimePicker,
  ChipGroup,
  HorizontalFormSlider,
  SelectDropdown,
  TextField,
} from "@lokesh-workspace/ui";

import PhotoGallery from "@/components/profile/PhotoGallery";
import { useAuth } from "@/components/authProvider";
import {
  clearProfileDraft,
  draftOwnerKey,
  readProfileDraft,
  saveProfileDraft,
} from "@/lib/profileDraft";
import { citiesForCountry, communitiesFor, RELIGION_OPTIONS } from "@/lib/profileDisplay";
import { motherTongueOptions } from "@/constants/selectOptions/social";
import { COUNTRY_OPTIONS } from "@/constants/selectOptions/places";
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
  feetOptions,
  inchOptions,
} from "@/constants/selectOptions/person";
import {
  PARENT_OCCUPATION_OPTIONS,
  RELIGIOSITY_OPTIONS,
  SIBLING_COUNT_OPTIONS,
  religiosityDetailOptions,
} from "@/constants/selectOptions/beliefs";
import {
  ANY_OPTION,
  PARTNER_AGE_OPTIONS,
  PARTNER_COUNTRY_OPTIONS,
  PARTNER_DIET_OPTIONS,
  PARTNER_EDUCATION_OPTIONS,
  PARTNER_HEIGHT_OPTIONS,
  PARTNER_MARITAL_OPTIONS,
  PARTNER_MOTHER_TONGUE_OPTIONS,
  PARTNER_PROFESSION_OPTIONS,
  PARTNER_RELIGION_OPTIONS,
} from "@/constants/selectOptions/partner";

const STEPS = [
  { title: "Basic Details", hint: "How you appear to other families." },
  { title: "Social Background", hint: "Religion, community and where you live." },
  { title: "Education & Career", hint: "Your studies and what you do." },
  { title: "Family Background", hint: "About your family. Most of this is optional." },
  { title: "Lifestyle & Habits", hint: "Day-to-day preferences." },
  { title: "Partner Preference", hint: "What you are looking for. All optional." },
  { title: "Photos", hint: "A friendly face gets far more interest." },
];

const icon = (path: React.ReactNode) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>{path}</svg>
);

const STEP_ICONS = [
  icon(<><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21a6.5 6.5 0 00-15 0" /></>),
  icon(<><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M5 8h14M7 21h10" /></>),
  icon(<><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a4 4 0 018 0v2" /></>),
  icon(<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path strokeLinecap="round" d="M3 20a6 6 0 0112 0M15 20a5 5 0 016-4.6" /></>),
  icon(<><path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" /></>),
  icon(<><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-3.5-3.5" /></>),
  icon(<><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h3l2-3h6l2 3h3v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><circle cx="12" cy="13" r="3" /></>),
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

const WAS_MARRIED = new Set(["married", "divorced", "widowed", "annulled", "awaiting_divorce"]);

/** Sibling counts up to `total`, so "married" can never offer an impossible number. */
const marriedOptionsUpTo = (total: string) =>
  SIBLING_COUNT_OPTIONS.filter((option) => Number(option.value) <= Number(total || 0));

const INITIAL_FORM = {
  // Step 0
  firstName: "",
  surname: "",
  dob: "",
  gender: "",
  heightFeet: "",
  heightInches: "",
  bodyPhysique: "",
  maritalStatus: "",
  manglikLevel: 0,
  aboutMe: "",

  // Step 1
  religion: "",
  community: "",
  mothertongue: "",
  religiosity: "",
  religiosityDetail: "",
  currentCountry: "",
  currentCity: "",
  placeOfBirthCountry: "",
  placeOfBirthCity: "",

  // Step 2
  educationLevel: "",
  fieldOfStudy: "",
  collegeUniversity: "",
  profession: "",
  employedIn: "",
  employedAs: "",
  salaryAmount: "",

  // Step 3
  familyLivingInCountry: "",
  familyLivingInCity: "",
  familyIncome: "",
  familyType: 0,
  livesWithFamily: false,
  fatherOccupation: "",
  motherOccupation: "",
  brothers: "0",
  brothersMarried: "0",
  sisters: "0",
  sistersMarried: "0",
  familyAbout: "",

  // Step 4
  diet: "",
  smoking: "",
  drinking: "",
  hasChildren: false,

  // Step 5
  partnerAgeMin: "",
  partnerAgeMax: "",
  partnerHeightMin: "",
  partnerHeightMax: "",
  partnerMaritalStatus: "",
  partnerReligion: "",
  partnerCommunity: "",
  partnerMotherTongue: "",
  partnerCountry: "",
  partnerEducation: "",
  partnerProfession: "",
  partnerDiet: "",
  partnerAbout: "",

  // Step 6
  photo: "",
  photos: [] as string[],
};

type FormState = typeof INITIAL_FORM;

// Which keys belong to which wizard step - drives both saving and validation.
const STEP_FIELDS: (keyof FormState)[][] = [
  ["firstName", "surname", "dob", "gender", "heightFeet", "heightInches", "bodyPhysique", "maritalStatus", "manglikLevel", "aboutMe"],
  ["religion", "community", "mothertongue", "religiosity", "religiosityDetail", "currentCountry", "currentCity", "placeOfBirthCountry", "placeOfBirthCity"],
  ["educationLevel", "fieldOfStudy", "collegeUniversity", "profession", "employedIn", "employedAs", "salaryAmount"],
  ["familyLivingInCountry", "familyLivingInCity", "familyIncome", "familyType", "livesWithFamily", "fatherOccupation", "motherOccupation", "brothers", "brothersMarried", "sisters", "sistersMarried", "familyAbout"],
  ["diet", "smoking", "drinking", "hasChildren"],
  ["partnerAgeMin", "partnerAgeMax", "partnerHeightMin", "partnerHeightMax", "partnerMaritalStatus", "partnerReligion", "partnerCommunity", "partnerMotherTongue", "partnerCountry", "partnerEducation", "partnerProfession", "partnerDiet", "partnerAbout"],
  ["photo", "photos"],
];

const SAVE_CONFIRM_MS = 1100;
const PHOTO_STEP = 6;

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
    />
  );
}

function LongText({
  id,
  label,
  hint,
  value,
  onChange,
  maxLength = 600,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      {hint && <p className="mb-2 text-xs text-color-placeholder-text">{hint}</p>}
      <textarea
        id={id}
        className="textarea-field"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="textarea-count">{value.length} / {maxLength}</p>
    </div>
  );
}

export default function ProfileRegisterPage() {
  const router = useRouter();
  const auth = useAuth();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [step, setStep] = useState<number | undefined>(undefined);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string>("");
  const [savedNotice, setSavedNotice] = useState<string>("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [completeness, setCompleteness] = useState<number>(0);

  const hydrated = useRef(false);
  const draftOwner = useRef<string>("");

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Set a sibling total, pulling the "married" figure down if it no longer fits.
   *
   * Without this, answering 3 brothers / 2 married and then correcting the total
   * to 1 leaves an impossible pair that the API rejects on save - with the error
   * appearing on a field the member is no longer looking at.
   */
  const setSiblingTotal = useCallback(
    (totalKey: "brothers" | "sisters", marriedKey: "brothersMarried" | "sistersMarried", value: string) => {
      setForm((prev) => ({
        ...prev,
        [totalKey]: value,
        [marriedKey]: Math.min(Number(prev[marriedKey] || 0), Number(value || 0)).toString(),
      }));
    },
    [],
  );

  const communityOptions = useMemo(() => communitiesFor(form.religion), [form.religion]);
  const partnerCommunityOptions = useMemo(
    () => [ANY_OPTION, ...communitiesFor(form.partnerReligion)],
    [form.partnerReligion],
  );
  const religiosityDetails = useMemo(
    () => religiosityDetailOptions(form.religiosity),
    [form.religiosity],
  );

  /* ---------- Hydration ---------- */
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
          (Object.keys(INITIAL_FORM) as (keyof FormState)[]).forEach((key) => {
            const value = data[key];
            if (value === null || value === undefined || value === "") return;
            // Numeric columns come back as numbers; the dropdowns bind strings.
            (restored as any)[key] =
              typeof INITIAL_FORM[key] === "string" && typeof value === "number"
                ? String(value)
                : value;
          });
        }
      } catch {
        // Offline - never apply a draft we cannot attribute.
      }

      draftOwner.current = owner;

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
      setStep(draftStep ?? 0);
      hydrated.current = true;
    }

    hydrate();
    return () => { cancelled = true; };
  }, []);

  // The save status belongs to the step it happened on.
  useEffect(() => {
    setSaveState("idle");
    setSaveError("");
  }, [step]);

  useEffect(() => {
    setSaveState((prev) => (prev === "saved" ? "idle" : prev));
  }, [form]);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

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

  const handleNext = async (currentStep: number) => {
    const saved = await saveStep(currentStep);
    if (!saved) throw new Error("save-failed");
    await new Promise((resolve) => setTimeout(resolve, SAVE_CONFIRM_MS));
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setSavedNotice("");
  };

  const handleSubmit = async () => {
    const saved = await saveStep(PHOTO_STEP);
    if (!saved) return;
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
      return (
        form.religion !== "" &&
        form.community !== "" &&
        form.religiosity !== "" &&
        form.currentCountry !== ""
      );
    }
    if (s === 2) {
      return form.educationLevel !== "" && form.profession !== "" && form.salaryAmount !== "";
    }
    if (s === 3) {
      // Parents, siblings and the family note are optional; location and income
      // are not, because profile completeness counts them.
      return form.familyLivingInCountry !== "" && form.familyIncome !== "";
    }
    if (s === 4) {
      return form.diet !== "" && form.smoking !== "" && form.drinking !== "";
    }
    return true; // partner preference is entirely optional
  };

  const canSubmit = (s: number): boolean => s === PHOTO_STEP && form.photo !== "";

  const handleJumpToStep = (target: number) => {
    if (step === undefined || target === step) return;
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

          <HorizontalFormSlider
            busyLabel={saveState === "saving" ? "Saving…" : "Saved"}
            statusSlot={
              <div className="mt-4 min-h-[1.25rem] text-right text-sm" aria-live="polite">
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
            }
            onSubmit={handleSubmit}
            onNext={handleNext}
            canProceed={canProceed}
            canSubmit={canSubmit}
            step={step}
            setStep={setStep}
            steps={[
              /* ---------- 0: Basic details ---------- */
              <div key="basic" className="flex flex-col gap-5 px-1">
                <div className="form-grid-2">
                  <TextField id="firstName" label="First Name" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} />
                  <TextField id="surname" label="Surname" value={form.surname} onChange={(e) => setField("surname", e.target.value)} />
                </div>

                <div>
                  <span className="field-label">Date &amp; time of birth</span>
                  <BirthDateTimePicker value={form.dob} onChange={(v) => setField("dob", v)} />
                </div>

                <div className="form-grid-2">
                  <ChipGroup label="Gender" options={GENDER_OPTIONS} value={form.gender} onChange={(v) => setField("gender", v)} />
                  <div>
                    <span className="field-label">Height</span>
                    <div className="flex gap-3">
                      <PickerField label="Feet" options={feetOptions} value={form.heightFeet} onChange={(v) => setField("heightFeet", v)} className="w-28" />
                      <PickerField label="Inches" options={inchOptions} value={form.heightInches} onChange={(v) => setField("heightInches", v)} className="w-28" />
                    </div>
                  </div>
                </div>

                <ChipGroup label="Body Physique" options={physiqueOptions} value={form.bodyPhysique} onChange={(v) => setField("bodyPhysique", v)} />
                <ChipGroup label="Marital Status" options={MARITAL_OPTIONS} value={form.maritalStatus} onChange={(v) => setField("maritalStatus", v)} />
                <ChipGroup label="Are you Manglik?" options={MANGLIK_OPTIONS} value={form.manglikLevel} onChange={(v) => setField("manglikLevel", v)} />

                <LongText
                  id="aboutMe"
                  label="About yourself"
                  hint="Optional. A few lines in your own words — what you enjoy, what matters to you."
                  value={form.aboutMe}
                  onChange={(v) => setField("aboutMe", v)}
                />
              </div>,

              /* ---------- 1: Social background ---------- */
              <div key="social" className="flex flex-col gap-5 px-1">
                <div className="form-grid-2">
                  <PickerField label="Religion" options={RELIGION_OPTIONS} value={form.religion} onChange={(v) => setForm((p) => ({ ...p, religion: v, community: "" }))} />
                  <PickerField label="Caste / Community" options={communityOptions} value={form.community} onChange={(v) => setField("community", v)} searchable />
                </div>

                <PickerField label="Mother Tongue" options={motherTongueOptions} value={form.mothertongue} onChange={(v) => setField("mothertongue", v)} searchable />

                <div className="form-section">
                  <p className="form-section-title">Religious outlook</p>
                  <p className="form-section-hint mb-3">Pick the stance that fits you, then how it shows up day to day.</p>
                  <ChipGroup
                    options={RELIGIOSITY_OPTIONS}
                    value={form.religiosity}
                    onChange={(v) => setForm((p) => ({ ...p, religiosity: v, religiosityDetail: "" }))}
                  />
                  {religiosityDetails.length > 0 && (
                    <div className="mt-4">
                      <PickerField
                        label="More specifically"
                        options={religiosityDetails}
                        value={form.religiosityDetail}
                        onChange={(v) => setField("religiosityDetail", v)}
                      />
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <p className="form-section-title">Currently living in</p>
                  <div className="form-grid-2 mt-3">
                    <PickerField label="Country" options={COUNTRY_OPTIONS} value={form.currentCountry} onChange={(v) => setForm((p) => ({ ...p, currentCountry: v, currentCity: "" }))} searchable />
                    <PickerField label="City" options={citiesForCountry(form.currentCountry)} value={form.currentCity} onChange={(v) => setField("currentCity", v)} searchable />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">Place of birth</p>
                  <div className="form-grid-2 mt-3">
                    <PickerField label="Country" options={COUNTRY_OPTIONS} value={form.placeOfBirthCountry} onChange={(v) => setForm((p) => ({ ...p, placeOfBirthCountry: v, placeOfBirthCity: "" }))} searchable />
                    <PickerField label="City" options={citiesForCountry(form.placeOfBirthCountry)} value={form.placeOfBirthCity} onChange={(v) => setField("placeOfBirthCity", v)} searchable />
                  </div>
                </div>
              </div>,

              /* ---------- 2: Education & career ---------- */
              <div key="career" className="flex flex-col gap-5 px-1">
                <div className="form-section">
                  <p className="form-section-title">Education</p>
                  <div className="mt-4 flex flex-col gap-5">
                    <PickerField label="Highest Education Level" options={educationOptions} value={form.educationLevel} onChange={(v) => setField("educationLevel", v)} searchable />
                    <PickerField label="Field of Study" options={fieldOfStudyOptions} value={form.fieldOfStudy} onChange={(v) => setField("fieldOfStudy", v)} searchable />
                    <PickerField label="College / University" options={collegeOptions} value={form.collegeUniversity} onChange={(v) => setField("collegeUniversity", v)} searchable />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">Profession</p>
                  <div className="mt-4 flex flex-col gap-5">
                    <PickerField label="Profession" options={professionOptions} value={form.profession} onChange={(v) => setField("profession", v)} searchable />
                    <PickerField label="Employed In" options={employedInOptions} value={form.employedIn} onChange={(v) => setField("employedIn", v)} />
                    <PickerField label="Employed As" options={employedAsOptions} value={form.employedAs} onChange={(v) => setField("employedAs", v)} searchable />
                    <PickerField label="Annual income" options={familyIncomeOptions} value={form.salaryAmount} onChange={(v) => setField("salaryAmount", v)} />
                  </div>
                </div>
              </div>,

              /* ---------- 3: Family background ---------- */
              <div key="family" className="flex flex-col gap-5 px-1">
                <div className="form-section">
                  <p className="form-section-title">Where your family lives</p>
                  <div className="form-grid-2 mt-3">
                    <PickerField label="Country" options={COUNTRY_OPTIONS} value={form.familyLivingInCountry} onChange={(v) => setForm((p) => ({ ...p, familyLivingInCountry: v, familyLivingInCity: "" }))} searchable />
                    <PickerField label="City" options={citiesForCountry(form.familyLivingInCountry)} value={form.familyLivingInCity} onChange={(v) => setField("familyLivingInCity", v)} searchable />
                  </div>
                  <div className="mt-4">
                    <PickerField label="Family income (per annum)" options={familyIncomeOptions} value={form.familyIncome} onChange={(v) => setField("familyIncome", v)} />
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ChipGroup label="Family Type" options={FAMILY_TYPE_OPTIONS} value={form.familyType} onChange={(v) => setField("familyType", v)} />
                    <ChipGroup label="Lives with family" options={YES_NO_OPTIONS} value={form.livesWithFamily ? "yes" : "no"} onChange={(v) => setField("livesWithFamily", v === "yes")} />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">Parents</p>
                  <p className="form-section-hint mb-3">Optional.</p>
                  <div className="form-grid-2">
                    <PickerField label="Father" options={PARENT_OCCUPATION_OPTIONS} value={form.fatherOccupation} onChange={(v) => setField("fatherOccupation", v)} />
                    <PickerField label="Mother" options={PARENT_OCCUPATION_OPTIONS} value={form.motherOccupation} onChange={(v) => setField("motherOccupation", v)} />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">Siblings</p>
                  <p className="form-section-hint mb-3">Optional. How many, and how many are married.</p>
                  {/* "Married" is capped at the sibling count either way: its
                      options stop there, and lowering the total drags the
                      married figure down with it, so the pair can never end up
                      contradicting itself. The API enforces the same rule. */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <PickerField label="Brothers" options={SIBLING_COUNT_OPTIONS} value={form.brothers} onChange={(v) => setSiblingTotal("brothers", "brothersMarried", v)} />
                    <PickerField label="Married" options={marriedOptionsUpTo(form.brothers)} value={form.brothersMarried} onChange={(v) => setField("brothersMarried", v)} />
                    <PickerField label="Sisters" options={SIBLING_COUNT_OPTIONS} value={form.sisters} onChange={(v) => setSiblingTotal("sisters", "sistersMarried", v)} />
                    <PickerField label="Married" options={marriedOptionsUpTo(form.sisters)} value={form.sistersMarried} onChange={(v) => setField("sistersMarried", v)} />
                  </div>
                </div>

                <LongText
                  id="familyAbout"
                  label="About your family"
                  hint="Optional. Values, background, anything a family would want to know."
                  value={form.familyAbout}
                  onChange={(v) => setField("familyAbout", v)}
                />
              </div>,

              /* ---------- 4: Lifestyle ---------- */
              <div key="lifestyle" className="flex flex-col gap-5 px-1">
                <div className="form-grid-2">
                  <PickerField label="Diet" options={dietOptions} value={form.diet} onChange={(v) => setField("diet", v)} />
                  <PickerField label="Smoking" options={smokingOptions} value={form.smoking} onChange={(v) => setField("smoking", v)} />
                  <PickerField label="Drinking" options={drinkingOptions} value={form.drinking} onChange={(v) => setField("drinking", v)} />
                </div>

                {WAS_MARRIED.has(form.maritalStatus) && (
                  <div className="form-section">
                    <ChipGroup
                      label="Do you have children?"
                      options={YES_NO_OPTIONS}
                      value={form.hasChildren ? "yes" : "no"}
                      onChange={(v) => setField("hasChildren", v === "yes")}
                    />
                  </div>
                )}
              </div>,

              /* ---------- 5: Partner preference ---------- */
              <div key="partner" className="flex flex-col gap-5 px-1">
                <p className="text-sm text-color-placeholder-text">
                  Everything here is optional — leave anything blank for no preference.
                </p>

                <div className="form-section">
                  <p className="form-section-title">Age &amp; height</p>
                  <div className="form-grid-2 mt-3">
                    <PickerField label="Age from" options={PARTNER_AGE_OPTIONS} value={form.partnerAgeMin} onChange={(v) => setField("partnerAgeMin", v)} />
                    <PickerField label="Age to" options={PARTNER_AGE_OPTIONS} value={form.partnerAgeMax} onChange={(v) => setField("partnerAgeMax", v)} />
                    <PickerField label="Height from" options={PARTNER_HEIGHT_OPTIONS} value={form.partnerHeightMin} onChange={(v) => setField("partnerHeightMin", v)} />
                    <PickerField label="Height to" options={PARTNER_HEIGHT_OPTIONS} value={form.partnerHeightMax} onChange={(v) => setField("partnerHeightMax", v)} />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">Background</p>
                  <div className="form-grid-2 mt-3">
                    <PickerField label="Marital status" options={PARTNER_MARITAL_OPTIONS} value={form.partnerMaritalStatus} onChange={(v) => setField("partnerMaritalStatus", v)} />
                    <PickerField label="Religion" options={PARTNER_RELIGION_OPTIONS} value={form.partnerReligion} onChange={(v) => setForm((p) => ({ ...p, partnerReligion: v, partnerCommunity: "" }))} />
                    <PickerField label="Community" options={partnerCommunityOptions} value={form.partnerCommunity} onChange={(v) => setField("partnerCommunity", v)} searchable />
                    <PickerField label="Mother tongue" options={PARTNER_MOTHER_TONGUE_OPTIONS} value={form.partnerMotherTongue} onChange={(v) => setField("partnerMotherTongue", v)} searchable />
                    <PickerField label="Country" options={PARTNER_COUNTRY_OPTIONS} value={form.partnerCountry} onChange={(v) => setField("partnerCountry", v)} searchable />
                    <PickerField label="Diet" options={PARTNER_DIET_OPTIONS} value={form.partnerDiet} onChange={(v) => setField("partnerDiet", v)} />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">Education &amp; work</p>
                  <div className="form-grid-2 mt-3">
                    <PickerField label="Education" options={PARTNER_EDUCATION_OPTIONS} value={form.partnerEducation} onChange={(v) => setField("partnerEducation", v)} searchable />
                    <PickerField label="Profession" options={PARTNER_PROFESSION_OPTIONS} value={form.partnerProfession} onChange={(v) => setField("partnerProfession", v)} searchable />
                  </div>
                </div>

                <LongText
                  id="partnerAbout"
                  label="What are you looking for?"
                  hint="Optional. Qualities that matter to you in a partner."
                  value={form.partnerAbout}
                  onChange={(v) => setField("partnerAbout", v)}
                />
              </div>,

              /* ---------- 6: Photos ---------- */
              <div key="photo" className="flex flex-col gap-6 px-1">
                <div className="form-section flex flex-col items-center">
                  <p className="form-section-title">Display photo</p>
                  <p className="form-section-hint mb-4 text-center">
                    Drag the photo to reposition it, and zoom until your face fills the circle.
                  </p>
                  <AvatarCropper value={form.photo} onChange={(dataUrl) => setField("photo", dataUrl)} size={224} />
                  {form.photo && (
                    <p className="avatar-hint mt-3">This is how you appear in search results and to your matches.</p>
                  )}
                </div>

                <div className="form-section">
                  <p className="form-section-title">More photos</p>
                  <p className="form-section-hint mb-4">
                    Optional. Add a few more so families can get a fuller picture of you.
                  </p>
                  <PhotoGallery value={form.photos} onChange={(photos) => setField("photos", photos)} />
                </div>
              </div>,
            ]}
          />
        </div>
      </div>
    </div>
  );
}
