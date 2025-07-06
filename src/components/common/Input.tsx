import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  fullWidth = false,
  className = '',
  ...props
}) => (
  <div className={`mb-4 ${fullWidth ? 'w-full' : ''}`}>
    {label && <label className="block mb-1 font-medium text-gray-700">{label}</label>}
    <div className="relative flex items-center">
      {icon && <span className="absolute left-3 text-gray-400">{icon}</span>}
      <input
        className={`block w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all ${
          icon ? 'pl-10' : ''
        } ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
); 