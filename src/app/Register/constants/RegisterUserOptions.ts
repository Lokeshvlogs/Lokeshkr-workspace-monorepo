
export const PROFILE_FOR_VALUES = [
  "son",
  "daughter",
  "brother",
  "sister",
  "self",
] as const;

export const PROFILE_FOR_OPTIONS = PROFILE_FOR_VALUES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

export const LOOKING_FOR_VALUES = [
  "bride",
  "groom",
] as const;

export const LOOKING_FOR_OPTIONS = LOOKING_FOR_VALUES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));


export const AGE_OPTIONS = Array.from({length: 43}, (_,i) => {
              const v = (18 + i).toString();
              return { value: v, label: v };
            })


