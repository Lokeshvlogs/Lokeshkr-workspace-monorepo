// utils/ageOptions.ts
export const generateAgeOptions = (minAge: number, maxAge: number): number[] => {
  const ages: number[] = [];
  for (let i = minAge; i <= maxAge; i++) {
    ages.push(i);
  }
  return ages;
};
