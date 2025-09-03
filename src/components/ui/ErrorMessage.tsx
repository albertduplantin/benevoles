import React from 'react';
import { ErrorMessage as ErrorMessageType } from '@/lib/errorMessages';

interface ErrorMessageProps {
  error: ErrorMessageType;
  className?: string;
}

export default function ErrorMessage({ error, className = '' }: ErrorMessageProps) {
  const getBackgroundColor = () => {
    switch (error.type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconColor = () => {
    switch (error.type) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getBackgroundColor()} ${className}`}>
      <div className="flex items-start">
        {error.icon && (
          <span className={`text-lg mr-3 mt-0.5 ${getIconColor()}`}>
            {error.icon}
          </span>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {error.message}
          </p>
        </div>
      </div>
    </div>
  );
}
