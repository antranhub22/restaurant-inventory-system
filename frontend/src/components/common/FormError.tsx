import React from 'react';
import { ValidationError } from '../../hooks/useFormValidation';

interface FormErrorProps {
  error: ValidationError;
  className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ error, className = '' }) => {
  if (error.display === 'banner') {
    return (
      <div className={`bg-red-50 border-l-4 border-red-400 p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error.message}
            </p>
            {error.suggestions && error.suggestions.length > 0 && (
              <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <p className={`mt-1 text-sm text-red-600 ${className}`}>
      {error.message}
      {error.suggestions && error.suggestions.length > 0 && (
        <span className="block mt-1 text-xs">
          {error.suggestions[0]}
        </span>
      )}
    </p>
  );
};

export default FormError; 