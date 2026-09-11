"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Baby,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  Cake,
  CalendarClock,
  Camera,
  Cigarette,
  Compass,
  Film,
  Globe2,
  GraduationCap,
  Heart,
  Home,
  ImagePlus,
  Landmark,
  Languages,
  MapPin,
  Music,
  Palette,
  Palmtree,
  PenLine,
  PersonStanding,
  Plane,
  Ruler,
  Salad,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  User,
  UserCog,
  Users,
  Users2,
  Utensils,
  Wallet,
  Wine,
} from "lucide-react";
import {
  AvatarCropper,
  BirthDateTimePicker,
  ChipGroup,
  ChipMultiGroup,
  DualRangeSlider,
  HorizontalFormSlider,
  MultiSelect,
  SelectDropdown,
  TextField,
} from "@lokesh-workspace/ui";

import type { MediaPick } from "@/types/profile";
import PhotoGallery from "@/components/profile/PhotoGallery";
import CompletenessRing from "@/components/profile/CompletenessRing";
import { coerceToFormShape } from "@/lib/profileFormShape";
import { fieldIssue } from "@/lib/validation/schemas/profileWizardSchema";
import EducationList, { isEducationComplete, type EducationEntry } from "@/components/profile/EducationList";
import AchievementList, { type AchievementEntry } from "@/components/profile/AchievementList";
import EmployerPicker from "@/components/profile/EmployerPicker";
import FamilyEditor from "@/components/profile/FamilyEditor";
import VisaStatusPicker from "@/components/profile/VisaStatusPicker";
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
// Education level, field of study and the institution list now live inside
// EducationList, which owns one row at a time.
import {
  professionOptions,
  employedInOptions,
} from "@/constants/selectOptions/career";
import { employedAsFits, employedAsFor } from "@/constants/selectOptions/employedAs";
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
import { PICK_CATEGORIES, TAG_CATEGORIES } from "@/constants/selectOptions/interests";
import MediaPickField from "@/components/profile/MediaPickField";
import {
  PARENT_OCCUPATION_OPTIONS,
  RELIGIOSITY_OPTIONS,
  SIBLING_COUNT_OPTIONS,
  religiosityDetailOptions,
} from "@/constants/selectOptions/beliefs";
import {
  PARTNER_AGE_MAX,
  PARTNER_AGE_MIN,
  PARTNER_COUNTRY_CHOICES,
  PARTNER_DIET_CHOICES,
  PARTNER_EDUCATION_CHOICES,
  PARTNER_HEIGHT_MAX_INCHES,
  PARTNER_HEIGHT_MIN_INCHES,
  PARTNER_MARITAL_CHOICES,
  PARTNER_MOTHER_TONGUE_CHOICES,
  PARTNER_PROFESSION_CHOICES,
  PARTNER_RELIGION_CHOICES,
  PARTNER_RELIGIOSITY_CHOICES,
  PARTNER_SMOKING_CHOICES,
  PARTNER_DRINKING_CHOICES,
} from "@/constants/selectOptions/partner";

/** Form values are strings; the sliders want numbers, and "" means unset. */
const toNum = (value: string): number | null =>
  value === "" || value === null || value === undefined ? null : Number(value);

/**
 * One glyph per interest row. Keyed off the category key rather than held on
 * the category itself, so the constants file stays free of JSX and of a React
 * dependency.
 */
const INTEREST_ICONS: Record<string, React.ReactNode> = {
  interestsHobbies: <Palette />,
  interestsCuisines: <Utensils />,
  interestsTravel: <Palmtree />,
  interestsMusic: <Music />,
  interestsMovies: <Film />,
  interestsBooks: <BookOpen />,
};

/**
 * The interest categories in the order they are revealed, tags then picks.
 *
 * One flat list because the reveal walks it in order and does not care which
 * kind a category is; the `options` field is what tells them apart at render
 * time.
 */
const INTEREST_ROWS = [...TAG_CATEGORIES, ...PICK_CATEGORIES] as readonly {
  key: "interestsHobbies" | "interestsCuisines" | "interestsTravel"
    | "interestsMusic" | "interestsMovies" | "interestsBooks";
  label: string;
  options?: readonly { value: string; label: string }[];
  hint?: string;
  placeholder?: string;
}[];

const STEPS = [
  { title: "Basic Details", hint: "How you appear to other families." },
  { title: "Social Background", hint: "Religion, community and where you live." },
  { title: "Education & Career", hint: "Your studies and what you do." },
  { title: "Family Background", hint: "About your family. Only the closing note is optional." },
  { title: "Lifestyle & Habits", hint: "Day-to-day preferences." },
  { title: "Partner Preference", hint: "What you are looking for. Pick at least one of each." },
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

/**
 * Mobility answers a member will accept in a partner.
 *
 * Multi-select, because someone happy with "yes" is usually just as happy with
 * "open to discussion", and forcing one choice quietly excluded matches they
 * wanted. "All" is the exclusive option: choosing it clears the rest, since
 * accepting every answer is the same as having no preference.
 */
/**
 * A single answer about yourself, where "haven't decided" is honest.
 *
 * Text rather than a boolean so leaving it blank stays distinguishable from
 * answering "no" - silence is not a refusal.
 */
const YES_NO_MAYBE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "open", label: "Open to it" },
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
  citizenshipCountry: "",
  placeOfBirthCity: "",

  // Step 2. educationLevel / fieldOfStudy / collegeUniversity are no longer
  // entered directly - the server derives them from the highest `educations`
  // row - so they are absent here on purpose.
  educations: [] as EducationEntry[],
  achievements: [] as AchievementEntry[],
  profession: "",
  employedIn: "",
  employedAs: "",
  salaryAmount: "",
  settleAbroad: "",
  employerSlug: "",
  employerName: "",
  workCountry: "",
  visaStatus: "",

  // Step 3
  familyLivingInCountry: "",
  familyLivingInCity: "",
  familyIncome: "",
  familyType: 0,
  // Matches the model's own default. It was `false` here, so the first save
  // of this step silently flipped it for anyone who never touched the chip.
  livesWithFamily: true,
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
  dailyRoutine: "",
  /* Named picks, not slugs - see MediaPick in types/profile.ts. */
  interestsMusic: [] as MediaPick[],
  interestsMovies: [] as MediaPick[],
  interestsBooks: [] as MediaPick[],
  interestsCuisines: [] as string[],
  interestsTravel: [] as string[],
  interestsHobbies: [] as string[],
  interestsOther: "",

  // Step 5
  partnerAgeMin: "",
  partnerAgeMax: "",
  partnerHeightMin: "",
  partnerHeightMax: "",
  partnerAbout: "",
  // Multi-value preferences. `[]` means no preference.
  partnerMaritalStatuses: [] as string[],
  partnerReligions: [] as string[],
  partnerCommunities: [] as string[],
  partnerMotherTongues: [] as string[],
  partnerCountries: [] as string[],
  partnerEducations: [] as string[],
  partnerProfessions: [] as string[],
  partnerDiets: [] as string[],
  /* What the After-marriage section was replaced by: lifestyle and outlook,
     matched against the candidate's own answers rather than against a question
     nobody else is asked. `partnerRelocateAfterMarriage` and
     `partnerSettleAbroad` are gone from the wizard entirely - the columns stay
     on the server so existing answers keep rendering on profiles. */
  partnerReligiosities: [] as string[],
  partnerSmoking: [] as string[],
  partnerDrinking: [] as string[],

  // Step 6
  photo: "",
  photos: [] as string[],
};

type FormState = typeof INITIAL_FORM;

// Which keys belong to which wizard step - drives both saving and validation.
const STEP_FIELDS: (keyof FormState)[][] = [
  /* `aboutMe` is deliberately absent: it is no longer asked here. It is offered
     as a suggestion on /profile/me once the wizard is finished, so nothing in
     step 0 saves it. */
  ["firstName", "surname", "dob", "gender", "heightFeet", "heightInches", "bodyPhysique", "maritalStatus", "manglikLevel"],
  ["religion", "community", "mothertongue", "religiosity", "religiosityDetail", "currentCountry", "currentCity", "placeOfBirthCountry", "placeOfBirthCity", "citizenshipCountry"],
  ["educations", "achievements", "profession", "employedIn", "employedAs", "salaryAmount", "settleAbroad", "employerSlug", "employerName", "workCountry", "visaStatus"],
  ["familyLivingInCountry", "familyLivingInCity", "familyIncome", "familyType", "livesWithFamily", "fatherOccupation", "motherOccupation", "brothers", "brothersMarried", "sisters", "sistersMarried", "familyAbout"],
  ["diet", "smoking", "drinking", "hasChildren", "dailyRoutine", "interestsMusic", "interestsMovies", "interestsBooks", "interestsCuisines", "interestsTravel", "interestsHobbies", "interestsOther"],
  ["partnerAgeMin", "partnerAgeMax", "partnerHeightMin", "partnerHeightMax", "partnerAbout", "partnerMaritalStatuses", "partnerReligions", "partnerCommunities", "partnerMotherTongues", "partnerCountries", "partnerEducations", "partnerProfessions", "partnerDiets", "partnerReligiosities", "partnerSmoking", "partnerDrinking"],
  ["photo", "photos"],
];

const SAVE_CONFIRM_MS = 1100;
const PHOTO_STEP = 6;

/**
 * The required answers behind each top-level section of a step, in render order.
 *
 * Only used for the first-run reveal: a section whose keys are all answered
 * lets the next one appear. An empty list means the section asks nothing
 * mandatory, so it never holds the rest of the step back.
 *
 * The order must track the JSX below - each inner array is one child of that
 * step's container.
 */
const SECTION_NEEDS: string[][][] = [
  // 0 - Basic details
  [["firstName", "surname"], ["dob"], ["gender", "heightFeet"], [], ["maritalStatus"], []],
  // 1 - Social background
  [
    ["religion", "community"],
    ["mothertongue"],
    ["religiosity", "religiosityDetail"],
    ["currentCountry", "currentCity"],
    ["placeOfBirthCountry", "placeOfBirthCity"],
    ["citizenshipCountry"],
  ],
  // 2 - Education & career
  [["educations"], [], ["profession", "employedIn", "employedAs", "salaryAmount", "workCountry", "visaStatus", "settleAbroad"]],
  // 3 - Family
  [["familyLivingInCountry", "familyLivingInCity", "familyIncome"], ["fatherOccupation", "motherOccupation"], [], [], []],
  // 4 - Lifestyle & habits
  [["diet", "smoking", "drinking"], []],
  // 5 - Partner preference
  [
    [],
    [],
    ["partnerMaritalStatuses", "partnerReligions", "partnerCommunities", "partnerMotherTongues", "partnerCountries", "partnerDiets"],
    ["partnerEducations", "partnerProfessions"],
    [],
    [],
  ],
  // 6 - Photos
  [["photo"], []],
];

/** SelectDropdown with the wizard's shared look, so every picker matches. */
function PickerField({
  label,
  icon,
  errorValue,
  onBlur,
  options,
  value,
  onChange,
  searchable = false,
  className = "",
  selectedFirst,
}: {
  label: string;
  icon?: React.ReactNode;
  errorValue?: string;
  onBlur?: () => void;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  className?: string;
  /** Pass false where the list is a numeric ladder - see SelectDropdown. */
  selectedFirst?: boolean;
}) {
  return (
    <SelectDropdown
      label={label}
      icon={icon}
      errorValue={errorValue}
      onBlur={onBlur}
      placeholder=""
      options={options}
      value={value}
      onChange={onChange}
      searchable={searchable}
      className={className}
      selectedFirst={selectedFirst}
    />
  );
}

function LongText({
  id,
  label,
  icon,
  hint,
  value,
  onChange,
  onBlur,
  errorValue,
  maxLength = 600,
}: {
  id: string;
  label: string;
  icon?: React.ReactNode;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  errorValue?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className={`field-label ${icon ? "field-label-row" : ""}`}>
        {icon && <span className="field-label-icon" aria-hidden="true">{icon}</span>}
        {label}
      </label>
      {hint && <p className="mb-2 text-xs text-color-placeholder-text">{hint}</p>}
      <textarea
        id={id}
        className={`textarea-field ${errorValue ? "input-error" : ""}`}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={errorValue ? "true" : "false"}
        aria-describedby={errorValue ? `${id}-error` : undefined}
      />
      {errorValue && (
        <p id={`${id}-error`} className="error-text" role="alert">{errorValue}</p>
      )}
      <p className="textarea-count">{value.length} / {maxLength}</p>
    </div>
  );
}

/**
 * A step's sections, revealed one at a time on a first run.
 *
 * Seven steps of dense form shown all at once is what makes a registration
 * wizard feel like paperwork. Somebody who has already registered gets the
 * whole step at once instead - they came back to change one answer and should
 * not have to walk through the step to reach it.
 *
 * Children are taken in render order and matched positionally against `needs`,
 * so this stays a wrapper: no step had to be restructured into a data table to
 * gain the behaviour.
 */
function RevealSections({
  needs,
  unresolved,
  enabled,
  className,
  children,
}: {
  needs: string[][];
  unresolved: Record<string, string>;
  enabled: boolean;
  className: string;
  children: React.ReactNode;
}) {
  if (!enabled) return <div className={className}>{children}</div>;

  const sections = React.Children.toArray(children);

  // The first section still missing something is the last one shown.
  let shown = sections.length;
  for (let i = 0; i < sections.length; i += 1) {
    if ((needs[i] ?? []).some((key) => unresolved[key] !== undefined)) {
      shown = i + 1;
      break;
    }
  }

  return (
    <div className={className}>
      {sections.slice(0, shown).map((section, index) => (
        <div key={index} className="wiz-reveal">
          {section}
        </div>
      ))}
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
  /* How many residency statuses the chosen country of work offers. Some
     have none, and the step must not gate on a dropdown that cannot be
     answered - see `gapsOn` for step 2. */
  const [visaOptionCount, setVisaOptionCount] = useState(0);
  /* Joint and extended households open straight into the member editor - the
     sibling counts above cannot describe who actually lives there. */
  const [familyNamesOpen, setFamilyNamesOpen] = useState(false);
  /* Interest categories the member has waved past. Every category is optional,
     so without this a gradual reveal would strand anyone with nothing to say
     about music at the first row, unable to reach the ones they do care
     about. */
  const [skippedInterests, setSkippedInterests] = useState<ReadonlySet<string>>(new Set());
  /* Steps the member has tried to leave. Nothing is marked red before that:
     a form that opens covered in errors reads as broken rather than as
     guidance. Once a step is in here its marks update live, so filling a
     field clears its error immediately. */
  const [triedSteps, setTriedSteps] = useState<ReadonlySet<number>>(new Set());
  /* Fields the member has focused and left. A required one that is still empty
     when focus moves on is marked there and then, rather than waiting for
     Continue - the answer is missing at the moment they walk away from it. */
  const [touchedFields, setTouchedFields] = useState<ReadonlySet<string>>(new Set());

  const markTouched = (key: string) =>
    setTouchedFields((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [completeness, setCompleteness] = useState<number>(0);
  /* Null until the wizard has been finished once, which is the whole of the
     first-run test. `is_complete` cannot stand in for it: that is a property
     recomputed from live field values and flips back the moment a core field
     is cleared, so a member who blanked one answer would be dripped the wizard
     all over again. */
  const [registeredAt, setRegisteredAt] = useState<string | null>(null);
  /* The furthest step reached, which is how far the first-run stepper reveals.
     Tracked rather than read off `step`, so going back to fix step 1 does not
     take away the markers already earned. */
  const [furthestStep, setFurthestStep] = useState(0);

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
  /**
   * Communities across every religion the member is open to.
   *
   * Community values are namespaced per religion, so with several religions
   * selected the lists have to be concatenated - and de-duplicated, because a
   * few community values appear under more than one religion.
   */
  const partnerCommunityOptions = useMemo(() => {
    const seen = new Set<string>();
    return form.partnerReligions.flatMap((religion) =>
      communitiesFor(religion).filter((option) =>
        seen.has(option.value) ? false : (seen.add(option.value), true),
      ),
    );
  }, [form.partnerReligions]);
  const religiosityDetails = useMemo(
    () => religiosityDetailOptions(form.religiosity),
    [form.religiosity],
  );

  /* Seniority is scoped to the profession - "Resident" belongs to a doctor and
     "Tech Lead" to an engineer - so the ladder changes with it. */
  const employedAsChoices = useMemo(() => employedAsFor(form.profession), [form.profession]);

  /**
   * Set the profession, dropping a seniority the new ladder does not contain.
   *
   * The same reset the wizard already does for country -> city: without it a
   * doctor who becomes a software engineer keeps "Resident", which is no longer
   * an option and so renders as nothing selected while still being saved.
   */
  const setProfession = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      profession: value,
      employedAs: employedAsFits(value, prev.employedAs) ? prev.employedAs : "",
    }));
  }, []);

  /* ---------- Hydration ---------- */
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let restored: Partial<FormState> = {};
      let owner = "";
      let registered: string | null = null;

      try {
        const response = await fetch("/api/profile/me");
        if (response.ok) {
          const data = await response.json();
          owner = draftOwnerKey(data);
          registered = data.registeredAt ?? null;
          setCompleteness(Number(data.profile_completeness ?? 0));
          (Object.keys(INITIAL_FORM) as (keyof FormState)[]).forEach((key) => {
            const value = data[key];
            if (value === null || value === undefined || value === "") return;
            const coerced = coerceToFormShape(INITIAL_FORM[key], key, value);
            if (coerced !== undefined) (restored as any)[key] = coerced;
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
          // Ignore keys the form no longer has - a draft can outlive a rename.
          if (!(key in INITIAL_FORM)) return;

          const raw = draft.form[key];
          if (raw === null || raw === undefined || raw === "") return;

          // A draft is arbitrarily old: one saved before a field became
          // multi-select still holds a plain string, which would crash the
          // control expecting an array. Anything unsalvageable is dropped and
          // the server's value stands.
          const value = coerceToFormShape(INITIAL_FORM[key], key, raw);
          if (value === undefined) return;

          // An empty array is truthy, so without this an untouched draft would
          // wipe a gallery (or interests and education rows) that the server
          // had just supplied. "" is treated as "not answered" above for the
          // same reason; [] is its array equivalent.
          if (
            Array.isArray(value) &&
            value.length === 0 &&
            Array.isArray((restored as any)[key]) &&
            (restored as any)[key].length > 0
          ) {
            return;
          }

          (restored as any)[key] = value;
        });
      }

      if (cancelled) return;

      // A "Complete profile" link carries the first step that still has a gap.
      // It has to win over the saved draft step, or a stale draft pointing at
      // step 0 would quietly defeat the deep link. Read from window rather than
      // useSearchParams: this is one large client component, and useSearchParams
      // would force a Suspense boundary around all of it.
      // Tested as a string first: URLSearchParams.get returns null when the
      // param is absent, and Number(null) is 0 - which would silently pin
      // every ordinary visit to step 0 and override the saved draft.
      const raw = new URLSearchParams(window.location.search).get("step");
      const requested = raw !== null && /^\d+$/.test(raw) ? Number(raw) : null;
      const fromUrl = requested !== null && requested <= PHOTO_STEP ? requested : null;

      setForm((prev) => ({ ...prev, ...restored }));
      setRegisteredAt(registered);
      setStep(fromUrl ?? draftStep ?? 0);
      hydrated.current = true;

      // Consume the param once applied. The draft records the step on every
      // change, so leaving ?step in the URL would drag a member who has moved
      // on to step 4 back to the deep-linked step on the next refresh.
      if (fromUrl !== null) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (step === undefined) return;
    setFurthestStep((prev) => (step > prev ? step : prev));
  }, [step]);

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
    // Throwing keeps the slider on this step. The button stays enabled on
    // purpose - a disabled Continue cannot tell anyone what it is waiting for.
    if (!canProceed(currentStep)) {
      setTriedSteps((prev) => new Set(prev).add(currentStep));
      throw new Error("incomplete");
    }
    const saved = await saveStep(currentStep);
    if (!saved) throw new Error("save-failed");
    await new Promise((resolve) => setTimeout(resolve, SAVE_CONFIRM_MS));
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setSavedNotice("");
  };

  const handleSubmit = async () => {
    if (!canProceed(PHOTO_STEP)) {
      setTriedSteps((prev) => new Set(prev).add(PHOTO_STEP));
      return;
    }
    // Read before saving: this same request is what stamps `registered_at`
    // server-side, so afterwards there is no way to tell a first finish from
    // a returning member re-saving the last step.
    const firstFinish = registeredAt === null;
    const saved = await saveStep(PHOTO_STEP);
    if (!saved) return;
    await new Promise((resolve) => setTimeout(resolve, SAVE_CONFIRM_MS));
    clearProfileDraft();
    // The About-me box left step 1; the profile offers to write one instead.
    router.push(firstFinish ? "/profile/me?welcome=1" : "/profile/me");
  };

  /* ---------- Step gating ---------- */

  /**
   * Every required answer a step is still missing, keyed by form field.
   *
   * Keyed rather than a flat list so each control can be marked where it sits.
   * Field keys are unique across steps, so the maps for several steps can be
   * merged without colliding.
   */
  const gapsOn = (s: number): Record<string, string> => {
    const gaps: Record<string, string> = {};
    const need = (ok: boolean, key: string, message = "Required") => {
      if (!ok) gaps[key] = message;
    };
    /* Fields with a rule beyond "not empty" are parsed instead of tested, so
       the schema owns the message and the wizard only decides where it goes. */
    const check = (key: "firstName" | "surname" | "aboutMe" | "familyAbout" | "partnerAbout") => {
      const issue = fieldIssue(key, form[key]);
      if (issue) gaps[key] = issue;
    };

    if (s === 0) {
      check("firstName");
      check("surname");
      need(form.dob !== "", "dob", "Your date of birth is required");
      need(form.gender !== "", "gender", "Pick one");
      // Inches stays optional: a plain "5 ft" is a real answer, and the
      // picker's own 0 is indistinguishable from an untouched one.
      need(form.heightFeet !== "", "heightFeet");
      need(form.maritalStatus !== "", "maritalStatus", "Pick one");
      return gaps;
    }

    if (s === 1) {
      need(form.religion !== "", "religion");
      need(form.community !== "", "community");
      need(form.mothertongue !== "", "mothertongue");
      need(form.religiosity !== "", "religiosity", "Pick one");
      // Only some outlooks offer a follow-up, so this is required exactly when
      // the control is on screen.
      need(religiosityDetails.length === 0 || form.religiosityDetail !== "", "religiosityDetail");
      need(form.currentCountry !== "", "currentCountry");
      need(form.currentCity !== "", "currentCity");
      need(form.placeOfBirthCountry !== "", "placeOfBirthCountry");
      need(form.placeOfBirthCity !== "", "placeOfBirthCity");
      need(form.citizenshipCountry !== "", "citizenshipCountry");
      return gaps;
    }

    if (s === 2) {
      need(
        form.educations.some(isEducationComplete),
        "educations",
        "Add one qualification with every part filled in",
      );
      need(form.profession !== "", "profession");
      need(form.employedIn !== "", "employedIn");
      need(form.employedAs !== "", "employedAs");
      need(form.salaryAmount !== "", "salaryAmount");
      need(form.workCountry !== "", "workCountry");
      // Some countries have no status list at all, so gating on a status there
      // would be a dead end rather than a prompt.
      need(visaOptionCount === 0 || form.visaStatus !== "", "visaStatus");
      need(form.settleAbroad !== "", "settleAbroad", "Pick one");
      return gaps;
    }

    if (s === 3) {
      // Family type, "lives with family" and the four sibling counts all
      // default to a real answer, so they are answered from the moment the
      // step renders and there is nothing to wait on. Only the family note is
      // genuinely optional.
      need(form.familyLivingInCountry !== "", "familyLivingInCountry");
      need(form.familyLivingInCity !== "", "familyLivingInCity");
      need(form.familyIncome !== "", "familyIncome");
      need(form.fatherOccupation !== "", "fatherOccupation");
      need(form.motherOccupation !== "", "motherOccupation");
      check("familyAbout");
      return gaps;
    }

    if (s === 4) {
      need(form.diet !== "", "diet");
      need(form.smoking !== "", "smoking");
      need(form.drinking !== "", "drinking");
      return gaps;
    }

    if (s === 5) {
      // Age, height and the free-text note stay optional - a range left alone
      // reads as "no preference", which is a real answer.
      const pick = "Pick at least one";
      need(form.partnerMaritalStatuses.length > 0, "partnerMaritalStatuses", pick);
      need(form.partnerReligions.length > 0, "partnerReligions", pick);
      need(form.partnerCommunities.length > 0, "partnerCommunities", pick);
      need(form.partnerMotherTongues.length > 0, "partnerMotherTongues", pick);
      need(form.partnerCountries.length > 0, "partnerCountries", pick);
      need(form.partnerDiets.length > 0, "partnerDiets", pick);
      need(form.partnerEducations.length > 0, "partnerEducations", pick);
      need(form.partnerProfessions.length > 0, "partnerProfessions", pick);
      check("partnerAbout");
      return gaps;
    }

    need(form.photo !== "", "photo", "A display photo is required");
    return gaps;
  };

  const canProceed = (s: number): boolean => Object.keys(gapsOn(s)).length === 0;

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

  /* A first-time member is shown one step marker at a time, the next appearing
     as it is unlocked. Seven markers up front reads as a form to be endured;
     one that grows reads as progress. Anyone who has registered once sees the
     full stepper, because they are here to reach a specific step. */
  const firstRun = registeredAt === null;
  const visibleSteps = firstRun ? Math.min(STEPS.length, furthestStep + 1) : STEPS.length;

  /**
   * How many interest categories to show.
   *
   * A category is settled once it has an entry or has been skipped, and the
   * next appears only then - six full-width rows at once is what made this the
   * longest thing in the wizard, and each one is a question worth reading.
   *
   * Deliberately not gated on `firstRun` like the step markers are. It does not
   * need to be: a returning member has entries in the categories they filled,
   * which count as settled, so their own answers reveal the whole section on
   * the first render.
   */
  const interestsShown = (() => {
    for (let i = 0; i < INTEREST_ROWS.length; i += 1) {
      const key = INTEREST_ROWS[i].key;
      const answered = (form[key] as unknown[]).length > 0;
      if (!answered && !skippedInterests.has(key)) return i + 1;
    }
    return INTEREST_ROWS.length;
  })();

  const skipInterest = (key: string) =>
    setSkippedInterests((prev) => new Set(prev).add(key));

  /* Field keys are unique across steps, so these merge without colliding and a
     single lookup serves every step. */
  const triedGaps: Record<string, string> = {};
  triedSteps.forEach((s) => Object.assign(triedGaps, gapsOn(s)));

  const allGaps: Record<string, string> = {};
  for (let i = 0; i < STEPS.length; i += 1) Object.assign(allGaps, gapsOn(i));

  /**
   * A field is marked once its step has been submitted, or once the member has
   * focused and left that field alone. Either way the mark clears itself the
   * moment the gap is filled, because both maps are recomputed from `form`.
   */
  const err = (key: string) =>
    triedGaps[key] ?? (touchedFields.has(key) ? allGaps[key] : undefined);

  /** `onBlur` for a required field, marking it so `err` can start reporting. */
  const touch = (key: string) => () => markTouched(key);

  return (
    <div className="wiz-page px-4 py-10 sm:py-16">
      <div className="wiz-shell">
        <div className="wiz-card">

          <div className="wiz-head">
            <span className="wiz-eyebrow">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.4 6.4L21 10l-5.2 4.2L17 21l-5-3.2L7 21l1.2-6.8L3 10l6.6-1.6z" />
              </svg>
              Your profile
            </span>
            <h1 className="wiz-title">Complete your profile</h1>
            <p className="wiz-subtitle">
              Profiles that are 95% complete get shown to matches.
            </p>
          </div>

          <div className="wiz-progress">
            <CompletenessRing value={completeness} label={`Profile ${completeness}% complete`} />
          </div>

          <div className="wiz-steps">
            {STEPS.slice(0, visibleSteps).map((s, idx) => (
              <React.Fragment key={s.title}>
                <button
                  type="button"
                  onClick={() => handleJumpToStep(idx)}
                  aria-label={s.title}
                  aria-current={step === idx ? "step" : undefined}
                  title={s.title}
                  className={`wiz-step ${
                    step === idx
                      ? "wiz-step-active"
                      : idx < step
                        ? "wiz-step-done"
                        : "wiz-step-todo"
                  }`}
                >
                  {/* A completed step shows a tick rather than its own icon -
                      the icon says which step, which only matters while it is
                      still ahead of you or under way. */}
                  {idx < step ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    STEP_ICONS[idx]
                  )}
                </button>
                {idx < visibleSteps - 1 && (
                  <div className={`wiz-step-line ${idx < step ? "wiz-step-line-done" : ""}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="wiz-step-heading">
            <h2 className="wiz-step-title">{active.title}</h2>
            <p className="wiz-step-hint">{active.hint}</p>
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
            step={step}
            setStep={setStep}
            steps={[
              /* ---------- 0: Basic details ---------- */
              <RevealSections
                key="basic"
                className="flex flex-col gap-5 px-1"
                needs={SECTION_NEEDS[0]}
                unresolved={gapsOn(0)}
                enabled={firstRun}
              >
                <div className="form-grid-2">
                  <TextField id="firstName" label="First Name" icon={<User />} errorValue={err("firstName")} onBlur={touch("firstName")} value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} />
                  <TextField id="surname" label="Surname" icon={<User />} errorValue={err("surname")} onBlur={touch("surname")} value={form.surname} onChange={(e) => setField("surname", e.target.value)} />
                </div>

                <div>
                  <span className="field-label field-label-row">
                    <span className="field-label-icon" aria-hidden="true"><CalendarClock /></span>
                    Date &amp; time of birth
                  </span>
                  <BirthDateTimePicker value={form.dob} onChange={(v) => setField("dob", v)} errorValue={err("dob")} onBlur={touch("dob")} />
                </div>

                <div className="form-grid-2">
                  <ChipGroup label="Gender" icon={<Users />} options={GENDER_OPTIONS} value={form.gender} onChange={(v) => setField("gender", v)} error={err("gender")} onBlur={touch("gender")} />
                  <div>
                    <span className="field-label field-label-row">
                      <span className="field-label-icon" aria-hidden="true"><Ruler /></span>
                      Height
                    </span>
                    <div className="flex gap-3">
                      <PickerField label="Feet" errorValue={err("heightFeet")} onBlur={touch("heightFeet")} options={feetOptions} selectedFirst={false} value={form.heightFeet} onChange={(v) => setField("heightFeet", v)} className="w-28" />
                      <PickerField label="Inches" options={inchOptions} selectedFirst={false} value={form.heightInches} onChange={(v) => setField("heightInches", v)} className="w-28" />
                    </div>
                  </div>
                </div>

                <ChipGroup label="Body Physique" icon={<PersonStanding />} options={physiqueOptions} value={form.bodyPhysique} onChange={(v) => setField("bodyPhysique", v)} />
                <ChipGroup label="Marital Status" icon={<Heart />} options={MARITAL_OPTIONS} value={form.maritalStatus} onChange={(v) => setField("maritalStatus", v)} error={err("maritalStatus")} onBlur={touch("maritalStatus")} />
                <ChipGroup label="Are you Manglik?" icon={<Star />} options={MANGLIK_OPTIONS} value={form.manglikLevel} onChange={(v) => setField("manglikLevel", v)} />
              </RevealSections>,

              /* ---------- 1: Social background ---------- */
              <RevealSections
                key="social"
                className="flex flex-col gap-5 px-1"
                needs={SECTION_NEEDS[1]}
                unresolved={gapsOn(1)}
                enabled={firstRun}
              >
                <div className="form-grid-2">
                  <PickerField label="Religion" icon={<Landmark />} errorValue={err("religion")} onBlur={touch("religion")} options={RELIGION_OPTIONS} value={form.religion} onChange={(v) => setForm((p) => ({ ...p, religion: v, community: "" }))} />
                  <PickerField label="Caste / Community" icon={<Users2 />} errorValue={err("community")} onBlur={touch("community")} options={communityOptions} value={form.community} onChange={(v) => setField("community", v)} searchable />
                </div>

                <PickerField label="Mother Tongue" icon={<Languages />} errorValue={err("mothertongue")} onBlur={touch("mothertongue")} options={motherTongueOptions} value={form.mothertongue} onChange={(v) => setField("mothertongue", v)} searchable />

                <div className="form-section">
                  <p className="form-section-title">
                    <Compass size={17} className="form-section-icon" aria-hidden="true" />
                    Religious outlook
                  </p>
                  <p className="form-section-hint mb-3">Pick the stance that fits you, then how it shows up day to day.</p>
                  <ChipGroup
                    options={RELIGIOSITY_OPTIONS}
                    error={err("religiosity")} onBlur={touch("religiosity")}
                    value={form.religiosity}
                    onChange={(v) => setForm((p) => ({ ...p, religiosity: v, religiosityDetail: "" }))}
                  />
                  {religiosityDetails.length > 0 && (
                    <div className="mt-4">
                      <PickerField
                        label="More specifically"
                        icon={<Compass />}
                        errorValue={err("religiosityDetail")} onBlur={touch("religiosityDetail")}
                        options={religiosityDetails}
                        value={form.religiosityDetail}
                        onChange={(v) => setField("religiosityDetail", v)}
                      />
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <p className="form-section-title">
                    <MapPin size={17} className="form-section-icon" aria-hidden="true" />
                    Currently living in
                  </p>
                  <div className="form-grid-2 mt-3">
                    <PickerField label="Country" icon={<Globe2 />} options={COUNTRY_OPTIONS} errorValue={err("currentCountry")} onBlur={touch("currentCountry")} value={form.currentCountry} onChange={(v) => setForm((p) => ({ ...p, currentCountry: v, currentCity: "" }))} searchable />
                    <PickerField label="City" icon={<Building2 />} options={citiesForCountry(form.currentCountry)} errorValue={err("currentCity")} onBlur={touch("currentCity")} value={form.currentCity} onChange={(v) => setField("currentCity", v)} searchable />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">
                    <Baby size={17} className="form-section-icon" aria-hidden="true" />
                    Place of birth
                  </p>
                  <div className="form-grid-2 mt-3">
                    <PickerField label="Country" icon={<Globe2 />} options={COUNTRY_OPTIONS} errorValue={err("placeOfBirthCountry")} onBlur={touch("placeOfBirthCountry")} value={form.placeOfBirthCountry} onChange={(v) => setForm((p) => ({ ...p, placeOfBirthCountry: v, placeOfBirthCity: "" }))} searchable />
                    <PickerField label="City" icon={<Building2 />} options={citiesForCountry(form.placeOfBirthCountry)} errorValue={err("placeOfBirthCity")} onBlur={touch("placeOfBirthCity")} value={form.placeOfBirthCity} onChange={(v) => setField("placeOfBirthCity", v)} searchable />
                  </div>
                </div>

                {/* Kept out of both panels above on purpose: plenty of members
                    were born in one country, live in a second and hold the
                    passport of a third. */}
                <div className="form-section">
                  <p className="form-section-title">
                    <BadgeCheck size={17} className="form-section-icon" aria-hidden="true" />
                    Citizenship
                  </p>
                  <p className="form-section-hint mb-3">
                    The passport you hold — it is what most families ask about first.
                  </p>
                  <div className="mt-3">
                    <PickerField label="Country of citizenship" icon={<BadgeCheck />} errorValue={err("citizenshipCountry")} onBlur={touch("citizenshipCountry")} options={COUNTRY_OPTIONS} value={form.citizenshipCountry} onChange={(v) => setField("citizenshipCountry", v)} searchable />
                  </div>
                </div>
              </RevealSections>,

              /* ---------- 2: Education & career ---------- */
              <RevealSections
                key="career"
                className="flex flex-col gap-5 px-1"
                needs={SECTION_NEEDS[2]}
                unresolved={gapsOn(2)}
                enabled={firstRun}
              >
                <div className="form-section">
                  <p className="form-section-title">
                    <GraduationCap size={17} className="form-section-icon" aria-hidden="true" />
                    Education
                  </p>
                  <p className="form-section-hint mb-4">
                    Add each qualification you would like to show. Pick the country first —
                    it narrows the list of institutions.
                  </p>
                  <EducationList
                    value={form.educations}
                    onChange={(educations) => setField("educations", educations)}
                    error={err("educations")}
                  />
                </div>

                <div className="form-section">
                  <p className="form-section-title">
                    <Award size={17} className="form-section-icon" aria-hidden="true" />
                    Achievements &amp; recognition
                  </p>
                  <p className="form-section-hint mb-4">
                    Optional. Awards, publications, ranks — anything you are proud of.
                  </p>
                  <AchievementList
                    value={form.achievements}
                    onChange={(achievements) => setField("achievements", achievements)}
                  />
                </div>

                <div className="form-section">
                  <p className="form-section-title">
                    <Building size={17} className="form-section-icon" aria-hidden="true" />
                    Profession
                  </p>
                  <div className="mt-4 flex flex-col gap-5">
                    <PickerField label="Profession" icon={<Briefcase />} errorValue={err("profession")} onBlur={touch("profession")} options={professionOptions} value={form.profession} onChange={setProfession} searchable />
                    <PickerField label="Employed In" icon={<Building2 />} errorValue={err("employedIn")} onBlur={touch("employedIn")} options={employedInOptions} value={form.employedIn} onChange={(v) => setField("employedIn", v)} />
                    <PickerField label="Employed As" icon={<UserCog />} errorValue={err("employedAs")} onBlur={touch("employedAs")} options={employedAsChoices} value={form.employedAs} onChange={(v) => setField("employedAs", v)} searchable />
                    <PickerField label="Annual income" icon={<Wallet />} errorValue={err("salaryAmount")} onBlur={touch("salaryAmount")} options={familyIncomeOptions} value={form.salaryAmount} onChange={(v) => setField("salaryAmount", v)} />

                    <EmployerPicker
                      slug={form.employerSlug}
                      name={form.employerName}
                      onChange={(slug, name) =>
                        setForm((p) => ({ ...p, employerSlug: slug, employerName: name }))
                      }
                      profession={form.profession}
                      country={form.workCountry}
                    />

                    <div className="form-grid-2">
                      <PickerField
                        label="Country of work"
                        icon={<Globe2 />}
                        errorValue={err("workCountry")} onBlur={touch("workCountry")}
                        options={COUNTRY_OPTIONS}
                        value={form.workCountry}
                        onChange={(v) =>
                          // The employer list and the visa options are both
                          // per country, so neither survives a change of it.
                          setForm((p) => ({
                            ...p,
                            workCountry: v,
                            employerSlug: "",
                            employerName: "",
                            visaStatus: "",
                          }))
                        }
                        searchable
                      />
                      <VisaStatusPicker
                        country={form.workCountry}
                        value={form.visaStatus}
                        onChange={(v) => setField("visaStatus", v)}
                        onOptionsChange={setVisaOptionCount}
                        errorValue={err("visaStatus")} onBlur={touch("visaStatus")}
                      />
                    </div>

                    <ChipGroup
                      label="Interested in settling abroad?"
                      icon={<Plane />}
                      error={err("settleAbroad")} onBlur={touch("settleAbroad")}
                      options={YES_NO_MAYBE_OPTIONS}
                      value={form.settleAbroad}
                      onChange={(v) => setField("settleAbroad", v)}
                    />
                  </div>
                </div>
              </RevealSections>,

              /* ---------- 3: Family background ---------- */
              <RevealSections
                key="family"
                className="flex flex-col gap-5 px-1"
                needs={SECTION_NEEDS[3]}
                unresolved={gapsOn(3)}
                enabled={firstRun}
              >
                <div className="form-section">
                  <p className="form-section-title">
                    <MapPin size={17} className="form-section-icon" aria-hidden="true" />
                    Where your family lives
                  </p>
                  <div className="form-grid-2 mt-3">
                    <PickerField label="Country" icon={<Globe2 />} options={COUNTRY_OPTIONS} errorValue={err("familyLivingInCountry")} onBlur={touch("familyLivingInCountry")} value={form.familyLivingInCountry} onChange={(v) => setForm((p) => ({ ...p, familyLivingInCountry: v, familyLivingInCity: "" }))} searchable />
                    <PickerField label="City" icon={<Building2 />} options={citiesForCountry(form.familyLivingInCountry)} errorValue={err("familyLivingInCity")} onBlur={touch("familyLivingInCity")} value={form.familyLivingInCity} onChange={(v) => setField("familyLivingInCity", v)} searchable />
                  </div>
                  <div className="mt-4">
                    <PickerField label="Family income (per annum)" icon={<Wallet />} errorValue={err("familyIncome")} onBlur={touch("familyIncome")} options={familyIncomeOptions} value={form.familyIncome} onChange={(v) => setField("familyIncome", v)} />
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ChipGroup label="Family Type" icon={<Users />} options={FAMILY_TYPE_OPTIONS} value={form.familyType} onChange={(v) => {
                      setField("familyType", v);
                      // Choosing joint or extended is the moment the counts
                      // stop being enough, so the editor opens with it.
                      if (Number(v) > 0) setFamilyNamesOpen(true);
                    }} />
                    <ChipGroup label="Lives with family" icon={<Home />} options={YES_NO_OPTIONS} value={form.livesWithFamily ? "yes" : "no"} onChange={(v) => setField("livesWithFamily", v === "yes")} />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">
                    <Users size={17} className="form-section-icon" aria-hidden="true" />
                    Parents
                  </p>
                  <p className="form-section-hint mb-3">What each of them does.</p>
                  <div className="form-grid-2">
                    <PickerField label="Father" icon={<Briefcase />} errorValue={err("fatherOccupation")} onBlur={touch("fatherOccupation")} options={PARENT_OCCUPATION_OPTIONS} value={form.fatherOccupation} onChange={(v) => setField("fatherOccupation", v)} />
                    <PickerField label="Mother" icon={<Briefcase />} errorValue={err("motherOccupation")} onBlur={touch("motherOccupation")} options={PARENT_OCCUPATION_OPTIONS} value={form.motherOccupation} onChange={(v) => setField("motherOccupation", v)} />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">
                    <Users2 size={17} className="form-section-icon" aria-hidden="true" />
                    Siblings
                  </p>
                  <p className="form-section-hint mb-3">How many, and how many are married. Leave at zero if none.</p>
                  {/* "Married" is capped at the sibling count either way: its
                      options stop there, and lowering the total drags the
                      married figure down with it, so the pair can never end up
                      contradicting itself. The API enforces the same rule. */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <PickerField label="Brothers" options={SIBLING_COUNT_OPTIONS} selectedFirst={false} value={form.brothers} onChange={(v) => setSiblingTotal("brothers", "brothersMarried", v)} />
                    <PickerField label="Married" options={marriedOptionsUpTo(form.brothers)} selectedFirst={false} value={form.brothersMarried} onChange={(v) => setField("brothersMarried", v)} />
                    <PickerField label="Sisters" options={SIBLING_COUNT_OPTIONS} selectedFirst={false} value={form.sisters} onChange={(v) => setSiblingTotal("sisters", "sistersMarried", v)} />
                    <PickerField label="Married" options={marriedOptionsUpTo(form.sisters)} selectedFirst={false} value={form.sistersMarried} onChange={(v) => setField("sistersMarried", v)} />
                  </div>
                </div>

                {/* Nuclear households are fully described by the counts above,
                    and offering the editor there invites naming people who were
                    not claimed to be in the house. */}
                <div className="form-section" hidden={Number(form.familyType) === 0}>
                  <p className="form-section-title">
                    <Users2 size={17} className="form-section-icon" aria-hidden="true" />
                    Names and photos
                  </p>
                  <p className="form-section-hint mb-3">
                    Optional, and the part families actually look at. Anyone you skip still
                    appears on your profile from the counts above.
                  </p>

                  {familyNamesOpen ? (
                    <FamilyEditor embedded extended={Number(form.familyType) > 0} />
                  ) : (
                    <button
                      type="button"
                      className="chip chip-square"
                      onClick={() => setFamilyNamesOpen(true)}
                    >
                      Add names and photos
                    </button>
                  )}
                </div>

                <LongText
                  id="familyAbout"
                  errorValue={err("familyAbout")}
                  onBlur={touch("familyAbout")}
                  label="About your family"
                  icon={<PenLine />}
                  hint="Optional. Values, background, anything a family would want to know."
                  value={form.familyAbout}
                  onChange={(v) => setField("familyAbout", v)}
                />
              </RevealSections>,

              /* ---------- 4: Lifestyle & habits ---------- */
              <RevealSections
                key="lifestyle"
                className="flex flex-col gap-5 px-1"
                needs={SECTION_NEEDS[4]}
                unresolved={gapsOn(4)}
                enabled={firstRun}
              >
                <div className="form-section">
                  <p className="form-section-title">
                    <Sun size={17} className="form-section-icon" aria-hidden="true" />
                    Day to day
                  </p>
                  <div className="form-grid-2 mt-3">
                    <PickerField label="Diet" icon={<Salad />} errorValue={err("diet")} onBlur={touch("diet")} options={dietOptions} value={form.diet} onChange={(v) => setField("diet", v)} />
                    <PickerField label="Smoking" icon={<Cigarette />} errorValue={err("smoking")} onBlur={touch("smoking")} options={smokingOptions} value={form.smoking} onChange={(v) => setField("smoking", v)} />
                    <PickerField label="Drinking" icon={<Wine />} errorValue={err("drinking")} onBlur={touch("drinking")} options={drinkingOptions} value={form.drinking} onChange={(v) => setField("drinking", v)} />
                  </div>

                  <div className="mt-5">
                    <ChipGroup
                      label="Your rhythm"
                      icon={<Sun />}
                      options={routineOptions}
                      value={form.dailyRoutine}
                      onChange={(v) => setField("dailyRoutine", v)}
                    />
                  </div>

                  {WAS_MARRIED.has(form.maritalStatus) && (
                    <div className="mt-5">
                      <ChipGroup
                        label="Do you have children?"
                        icon={<Baby />}
                        options={YES_NO_OPTIONS}
                        value={form.hasChildren ? "yes" : "no"}
                        onChange={(v) => setField("hasChildren", v === "yes")}
                      />
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <p className="form-section-title">
                    <Sparkles size={17} className="form-section-icon" aria-hidden="true" />
                    What you are into
                  </p>
                  <p className="form-section-hint mb-4">
                    All optional — but this is the part people actually read. One at a
                    time; the next appears as you go.
                  </p>

                  {/* Chips rather than dropdowns for the tag rows: this is
                      browsing, not looking up a value you already had in mind.
                      Music, films and reading ask for named picks instead -
                      "Bollywood" says nothing that "Tum Hi Ho" does not say
                      better. */}
                  <div className="flex flex-col gap-6">
                    {INTEREST_ROWS.slice(0, interestsShown).map((category, index) => {
                      const answered = (form[category.key] as unknown[]).length > 0;
                      const canSkip =
                        !answered &&
                        index === interestsShown - 1 &&
                        interestsShown < INTEREST_ROWS.length;

                      return (
                        <div key={category.key} className="wiz-reveal">
                          {category.options ? (
                            <ChipMultiGroup
                              label={category.label}
                              icon={INTEREST_ICONS[category.key]}
                              options={category.options as { value: string; label: string }[]}
                              value={form[category.key] as string[]}
                              onChange={(v) =>
                                setForm((p) => ({ ...p, [category.key]: v }))
                              }
                              maxSelected={8}
                            />
                          ) : (
                            <MediaPickField
                              label={category.label}
                              icon={INTEREST_ICONS[category.key]}
                              hint={category.hint}
                              placeholder={category.placeholder}
                              value={form[category.key] as MediaPick[]}
                              onChange={(v) =>
                                setForm((p) => ({ ...p, [category.key]: v }))
                              }
                            />
                          )}

                          {canSkip && (
                            <button
                              type="button"
                              className="chip chip-square mt-3"
                              onClick={() => skipInterest(category.key)}
                            >
                              Not for me — next
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Held back until the rows above are done, so the step does
                      not end in a large empty box while there are still
                      questions to answer. */}
                  {interestsShown === INTEREST_ROWS.length && (
                    <div className="wiz-reveal mt-5">
                      <LongText
                        id="interestsOther"
                        label="Anything else about you"
                        icon={<PenLine />}
                        hint="Optional. Something the rows above do not cover."
                        value={form.interestsOther}
                        onChange={(v) => setField("interestsOther", v)}
                        maxLength={300}
                      />
                    </div>
                  )}
                </div>
              </RevealSections>,

              /* ---------- 5: Partner preference ---------- */
              <RevealSections
                key="partner"
                className="flex flex-col gap-5 px-1"
                needs={SECTION_NEEDS[5]}
                unresolved={gapsOn(5)}
                enabled={firstRun}
              >
                <p className="text-sm text-color-placeholder-text">
                  Pick at least one answer in each list. Age and height are the exceptions —
                  leave those alone for no preference.
                </p>

                <div className="form-section">
                  <p className="form-section-title">
                    <SlidersHorizontal size={17} className="form-section-icon" aria-hidden="true" />
                    Age &amp; height
                  </p>
                  <p className="form-section-hint mb-4">
                    Drag either end. Leave them alone if you have no preference.
                  </p>
                  <div className="flex flex-col gap-6">
                    <DualRangeSlider
                      label="Age"
                      icon={<Cake />}
                      min={PARTNER_AGE_MIN}
                      max={PARTNER_AGE_MAX}
                      value={[toNum(form.partnerAgeMin), toNum(form.partnerAgeMax)]}
                      onChange={([lo, hi]) =>
                        setForm((p) => ({ ...p, partnerAgeMin: String(lo), partnerAgeMax: String(hi) }))
                      }
                      onClear={() =>
                        setForm((p) => ({ ...p, partnerAgeMin: "", partnerAgeMax: "" }))
                      }
                      format={(n) => `${n} yrs`}
                    />

                    {/* Stored as total inches, which is why the bounds are 48-84
                        rather than a feet/inches pair. */}
                    <DualRangeSlider
                      label="Height"
                      icon={<Ruler />}
                      min={PARTNER_HEIGHT_MIN_INCHES}
                      max={PARTNER_HEIGHT_MAX_INCHES}
                      value={[toNum(form.partnerHeightMin), toNum(form.partnerHeightMax)]}
                      onChange={([lo, hi]) =>
                        setForm((p) => ({
                          ...p,
                          partnerHeightMin: String(lo),
                          partnerHeightMax: String(hi),
                        }))
                      }
                      onClear={() =>
                        setForm((p) => ({ ...p, partnerHeightMin: "", partnerHeightMax: "" }))
                      }
                      format={(n) => `${Math.floor(n / 12)} ft ${n % 12} in`}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">
                    <Users size={17} className="form-section-icon" aria-hidden="true" />
                    Background
                  </p>
                  <p className="form-section-hint mb-3">
                    Pick every answer you are open to — more choices widen your matches rather than narrowing them.
                  </p>
                  <div className="form-grid-2 mt-3">
                    <MultiSelect label="Marital status" icon={<Heart />} errorValue={err("partnerMaritalStatuses")} onBlur={touch("partnerMaritalStatuses")} options={PARTNER_MARITAL_CHOICES} value={form.partnerMaritalStatuses} onChange={(v) => setField("partnerMaritalStatuses", v)} exclusiveValue="any" maxSelected={5} />
                    <MultiSelect
                      label="Religion"
                      icon={<Landmark />}
                      errorValue={err("partnerReligions")} onBlur={touch("partnerReligions")}
                      options={PARTNER_RELIGION_CHOICES}
                      value={form.partnerReligions}
                      onChange={(v) =>
                        // Communities are namespaced per religion, so dropping a
                        // religion has to drop the communities chosen under it.
                        setForm((p) => ({
                          ...p,
                          partnerReligions: v,
                          partnerCommunities: p.partnerCommunities.filter((c) =>
                            v.some((r) => communitiesFor(r).some((o) => o.value === c)),
                          ),
                        }))
                      }
                      exclusiveValue="any"
                      maxSelected={4}
                    />
                    <MultiSelect label="Community" icon={<Users2 />} errorValue={err("partnerCommunities")} onBlur={touch("partnerCommunities")} options={partnerCommunityOptions} value={form.partnerCommunities} onChange={(v) => setField("partnerCommunities", v)} searchable maxSelected={8} />
                    <MultiSelect label="Mother tongue" icon={<Languages />} errorValue={err("partnerMotherTongues")} onBlur={touch("partnerMotherTongues")} options={PARTNER_MOTHER_TONGUE_CHOICES} value={form.partnerMotherTongues} onChange={(v) => setField("partnerMotherTongues", v)} searchable exclusiveValue="any" maxSelected={5} />
                    <MultiSelect label="Country" icon={<Globe2 />} errorValue={err("partnerCountries")} onBlur={touch("partnerCountries")} options={PARTNER_COUNTRY_CHOICES} value={form.partnerCountries} onChange={(v) => setField("partnerCountries", v)} searchable exclusiveValue="any" maxSelected={5} />
                    <MultiSelect label="Diet" icon={<Salad />} errorValue={err("partnerDiets")} onBlur={touch("partnerDiets")} options={PARTNER_DIET_CHOICES} value={form.partnerDiets} onChange={(v) => setField("partnerDiets", v)} exclusiveValue="any" maxSelected={4} />
                  </div>
                </div>

                <div className="form-section">
                  <p className="form-section-title">
                    <GraduationCap size={17} className="form-section-icon" aria-hidden="true" />
                    Education &amp; work
                  </p>
                  <div className="form-grid-2 mt-3">
                    <MultiSelect label="Education" icon={<BookOpen />} errorValue={err("partnerEducations")} onBlur={touch("partnerEducations")} options={PARTNER_EDUCATION_CHOICES} value={form.partnerEducations} onChange={(v) => setField("partnerEducations", v)} searchable exclusiveValue="any" maxSelected={5} />
                    <MultiSelect label="Profession" icon={<Briefcase />} errorValue={err("partnerProfessions")} onBlur={touch("partnerProfessions")} options={PARTNER_PROFESSION_CHOICES} value={form.partnerProfessions} onChange={(v) => setField("partnerProfessions", v)} searchable exclusiveValue="any" maxSelected={6} />
                  </div>
                </div>

                {/* Each of these is matched against the other person's own
                    answer, which is what the two After-marriage questions never
                    had - nothing on a profile said whether they would relocate,
                    so that preference could never be scored. */}
                <div className="form-section">
                  <p className="form-section-title">
                    <Compass size={17} className="form-section-icon" aria-hidden="true" />
                    Outlook &amp; lifestyle
                  </p>
                  <p className="form-section-hint mb-3">
                    Optional, and often the things that decide it. Pick every answer you
                    would accept — each one you choose widens who reaches you.
                  </p>
                  <div className="mt-3 flex flex-col gap-5">
                    <ChipMultiGroup
                      label="How religious would you like them to be?"
                      icon={<Compass />}
                      options={PARTNER_RELIGIOSITY_CHOICES}
                      value={form.partnerReligiosities}
                      onChange={(v) => setField("partnerReligiosities", v)}
                    />
                    <ChipMultiGroup
                      label="Smoking"
                      icon={<Cigarette />}
                      options={PARTNER_SMOKING_CHOICES}
                      value={form.partnerSmoking}
                      onChange={(v) => setField("partnerSmoking", v)}
                    />
                    <ChipMultiGroup
                      label="Drinking"
                      icon={<Wine />}
                      options={PARTNER_DRINKING_CHOICES}
                      value={form.partnerDrinking}
                      onChange={(v) => setField("partnerDrinking", v)}
                    />
                  </div>
                </div>

                <LongText
                  id="partnerAbout"
                  errorValue={err("partnerAbout")}
                  onBlur={touch("partnerAbout")}
                  label="What are you looking for?"
                  icon={<PenLine />}
                  hint="Optional. Qualities that matter to you in a partner."
                  value={form.partnerAbout}
                  onChange={(v) => setField("partnerAbout", v)}
                />
              </RevealSections>,

              /* ---------- 6: Photos ---------- */
              <RevealSections
                key="photo"
                className="flex flex-col gap-6 px-1"
                needs={SECTION_NEEDS[6]}
                unresolved={gapsOn(6)}
                enabled={firstRun}
              >
                <div className="form-section flex flex-col items-center">
                  <p className="form-section-title">
                    <Camera size={17} className="form-section-icon" aria-hidden="true" />
                    Display photo
                  </p>
                  <p className="form-section-hint mb-4 text-center">
                    Drag the photo to reposition it, and zoom until your face fills the circle.
                  </p>
                  <AvatarCropper value={form.photo} onChange={(dataUrl) => setField("photo", dataUrl)} size={224} />
                  {err("photo") && (
                    <p className="error-text mt-3 text-center" role="alert">{err("photo")}</p>
                  )}
                  {form.photo && (
                    <p className="avatar-hint mt-3">This is how you appear in search results and to your matches.</p>
                  )}
                </div>

                <div className="form-section">
                  <p className="form-section-title">
                    <ImagePlus size={17} className="form-section-icon" aria-hidden="true" />
                    More photos
                  </p>
                  <p className="form-section-hint mb-4">
                    Optional. Add a few more so families can get a fuller picture of you.
                  </p>
                  <PhotoGallery value={form.photos} onChange={(photos) => setField("photos", photos)} />
                </div>
              </RevealSections>,
            ]}
          />
        </div>
      </div>
    </div>
  );
}
