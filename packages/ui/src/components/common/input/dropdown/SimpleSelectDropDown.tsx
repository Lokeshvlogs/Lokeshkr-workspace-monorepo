"use client";
import { useState } from 'react';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';

const options = [
  { id: 1, label: 'Profile', icon: <User size={18} /> },
  { id: 2, label: 'Settings', icon: <Settings size={18} /> },
  { id: 3, label: 'Logout', icon: <LogOut size={18} /> },
];

const  handleOptionSelect = (option: typeof options[0]) => {
  console.log('Selected option:', option);
  // Implement your logic based on the selected option  
}

export default function IconSelect() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options[0]);

  return (
    <div className="relative w-32">
      {/* Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 border rounded-md bg-white"
      >
        <span className="flex items-center gap-2">
          {selected.icon} {selected.label}
        </span>
        <ChevronDown size={18} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 border rounded-md bg-white shadow-lg">
          {options.map((option) => (
            <div 
              key={option.id}
              onClick={() => { handleOptionSelect(option); setIsOpen(false); }}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
            >
              {option.icon} {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}