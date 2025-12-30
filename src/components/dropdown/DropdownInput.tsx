'use client';

import React, { useState, ChangeEvent } from 'react';

// Define the shape of your dropdown options using TypeScript
interface DropdownOption {
  value: string;
  label: string;
}

// Define the props for your component
interface DropdownProps {
  options: DropdownOption[];
  label: string;
  initialValue?: string;
  onChange?: (value: string) => void;
}

const DropdownInput: React.FC<DropdownProps> = ({ options, label, initialValue = '' }) => {
  // Use useState to manage the selected value
  const [selectedValue, setSelectedValue] = useState<string>(initialValue);

  // Handle the change event, specifically typed for a select element
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedValue(event.target.value);
    if (onChange) onChange(event.target.value);
    console.log('Selected value:', event.target.value);
  };

  return (
    <div className="flex flex-col">
      <label htmlFor="dropdown" className="mb-2 font-medium">
        {label}
      </label>
      <select
        id="dropdown"
        value={selectedValue}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {/* Add a default disabled option */}
        <option value="" disabled>
          Select an option
        </option>
        {/* Map over the options to create the <option> elements */}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {selectedValue && selectedValue !== initialValue && (
        <p className="mt-2 text-sm text-green-600">
          You selected: {selectedValue}
        </p>
      )}
    </div>
  );
};

export default DropdownInput;
