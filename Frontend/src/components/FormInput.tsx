import React from 'react';
import { Field, ErrorMessage } from 'formik';

interface InputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  as?: string;
  options?: { value: string; label: string }[];
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  as,
  options,
  className = '',
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs sm:text-sm font-bold text-slate-500 uppercase ml-1">{label}</label>
      {as === 'select' ? (
        <Field
          as="select"
          name={name}
          className="w-full px-3 sm:px-4 py-3 sm:py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm sm:text-base"
        >
          <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Field>
      ) : as === 'textarea' ? (
        <Field
          as="textarea"
          name={name}
          className="w-full px-3 sm:px-4 py-3 sm:py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none min-h-20 sm:min-h-25 text-sm sm:text-base"
          placeholder={placeholder}
        />
      ) : (
        <Field
          name={name}
          className="w-full px-3 sm:px-4 py-3 sm:py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm sm:text-base"
          placeholder={placeholder}
          type={type}
        />
      )}
      <ErrorMessage name={name} component="div" className="text-red-500 text-xs sm:text-sm ml-1" />
    </div>
  );
};