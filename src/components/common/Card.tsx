import React from 'react';

interface CardProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  shadow?: boolean;
}

export const Card: React.FC<CardProps> = ({ header, children, className = '', shadow = true }) => (
  <div className={`bg-white rounded-lg ${shadow ? 'shadow-md' : ''} p-4 ${className}`}>
    {header && <div className="mb-2 font-semibold text-lg">{header}</div>}
    {children}
  </div>
); 