// utils/ageOptions.ts
export const generateAgeOptions = (minAge: number, maxAge: number): number[] => {
  const ages: number[] = [];
  for (let i = minAge; i <= maxAge; i++) {
    ages.push(i);
  }
  return ages;
};


  const feetOptions = Array.from({ length: 5 }, (_, i) => {
    const ft = String(4 + i); // 4,5,6,7,8 -> keep reasonable range
    return { value: ft, label: `${ft} ft` };
  });
  const inchOptions = Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `${i} in` })); 

  export {feetOptions, inchOptions};