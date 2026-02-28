  import { SelectOption } from 'src/types/select';


  // Lifestyle options
  export const physiqueOptions: SelectOption[] = [
    { value: 'slim', label: 'Slim' },
    { value: 'normal', label: 'Normal' },
    { value: 'athletic', label: 'Athletic' },
    { value: 'chubby', label: 'Chubby' },
    { value: 'heavy', label: 'Heavy' },
  ];

  export const smokingOptions: SelectOption[] = [
    { value: 'non_smoker', label: 'Non-smoker' },
    { value: 'occasionally', label: 'Occasionally' },
    { value: 'regularly', label: 'Regularly' },
    { value: 'trying_to_quit', label: 'Trying to quit' },
  ];

  export const drinkingOptions: SelectOption[] = [
    { value: 'non_drinker', label: 'Non-drinker' },
    { value: 'socially', label: 'Socially' },
    { value: 'regularly', label: 'Regularly' },
  ];

  export const dietOptions: SelectOption[] = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'non_vegetarian', label: 'Non-Vegetarian' },
    { value: 'eggetarian', label: 'Eggetarian' },
    { value: 'vegan', label: 'Vegan' },
  ];

  export const routineOptions: SelectOption[] = [
    { value: 'early_riser', label: 'Early Riser' },
    { value: 'night_owl', label: 'Night Owl' },
    { value: 'flexible', label: 'Flexible' },
  ];


  // Body options
export const generateAgeOptions = (minAge: number, maxAge: number): number[] => {
  const ages: number[] = [];
  for (let i = minAge; i <= maxAge; i++) {
    ages.push(i);
  }
  return ages;
};


  const feetOptions: SelectOption[] = Array.from({ length: 5 }, (_, i) => {
    const ft = String(4 + i); // 4,5,6,7,8 -> keep reasonable range
    return { value: ft, label: `${ft} ft` };
  });
  const inchOptions: SelectOption[] = Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `${i} in` })); 

  export {feetOptions, inchOptions};

