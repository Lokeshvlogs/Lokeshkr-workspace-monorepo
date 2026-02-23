// components/AgeDropdown.tsx
'use client'; // This component uses client-side state hooks

import React, { useState } from 'react';
import { generateAgeOptions } from '@/utils/bodyOptions';

// Define the props interface for type safety
interface AgeDropdownProps {
  min: number;
  max: number;
  initialAge?: number;
}

const AgeDropdown: React.FC<AgeDropdownProps> = ({ min, max, initialAge }) => {
  const ageOptions = generateAgeOptions(min, max);
  const [selectedAge, setSelectedAge] = useState<number | string>(initialAge || '');

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Convert the string value from the select input to a number
    setSelectedAge(Number(event.target.value));
  };

  return (
    <div>
      <label htmlFor="age-select">Select Age: </label>
      <select
        id="age-select"
        value={selectedAge}
        onChange={handleChange}
        className="border p-2 rounded" // Add some basic styling
      >
        <option value="" disabled>
          -- Select an age --
        </option>
        {ageOptions.map((age) => (
          <option key={age} value={age}>
            {age}
          </option>
        ))}
      </select>
      {selectedAge && typeof selectedAge === 'number' && (
        <p>Selected age: {selectedAge}</p>
      )}
    </div>
  );
};

export default AgeDropdown;
