// src/components/MultiSelectDropdown.jsx
import React, { useState, useRef, useEffect } from "react";

const MultiSelectDropdown = ({ options = [], selectedOptions = [], setSelectedOptions, label, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle option safely
  const toggleOption = (option) => {
    if (disabled) return;

    // Ensure selectedOptions is always an array
    const current = Array.isArray(selectedOptions) ? selectedOptions : [];

    if (current.includes(option)) {
      setSelectedOptions(current.filter((o) => o !== option));
    } else {
      setSelectedOptions([...current, option]);
    }
  };

  // Ensure selectedOptions is an array for rendering
  const selected = Array.isArray(selectedOptions) ? selectedOptions : [];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}

      <div
        className={`border border-gray-300 rounded px-3 py-2 min-h-[42px] cursor-pointer flex justify-between items-center ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="text-sm truncate">
          {selected.length ? selected.join(", ") : "Select"}
        </span>
        <svg
          className={`w-4 h-4 transition ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full bg-white border rounded mt-1 max-h-56 overflow-auto shadow">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
            >
              <input
                type="checkbox"
                className="mr-2"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
