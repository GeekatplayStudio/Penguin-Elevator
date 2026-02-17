import React from 'react';
import { ArrowUp, Eye, AlertTriangle } from 'lucide-react';

export const PenguinIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Simple cute penguin shape */}
    <path d="M12 2C7.58 2 4 5.58 4 10V22H20V10C20 5.58 16.42 2 12 2ZM8 10C8 9.17 8.67 8.5 9.5 8.5C10.33 8.5 11 9.17 11 10C11 10.83 10.33 11.5 9.5 11.5C8.67 11.5 8 10.83 8 10ZM12 20C10.67 20 9.5 19 9.5 18H14.5C14.5 19 13.33 20 12 20ZM16 10C16 10.83 15.33 11.5 14.5 11.5C13.67 11.5 13 10.83 13 10C13 9.17 13.67 8.5 14.5 8.5C15.33 8.5 16 9.17 16 10Z" />
    <path d="M6 14C5.45 14 5 14.45 5 15V19H7V15C7 14.45 6.55 14 6 14Z" fillOpacity="0.5"/>
    <path d="M18 14C17.45 14 17 14.45 17 15V19H19V15C19 14.45 18.55 14 18 14Z" fillOpacity="0.5"/>
  </svg>
);

export { ArrowUp, Eye, AlertTriangle };
