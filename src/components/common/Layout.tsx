import React from 'react';

interface LayoutProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ header, footer, children, className = '' }) => (
  <div className={`min-h-screen flex flex-col bg-gray-50 ${className}`}>
    {header && <header className="shadow bg-white py-4 px-6">{header}</header>}
    <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    {footer && <footer className="bg-white py-4 px-6 shadow-inner">{footer}</footer>}
  </div>
); 