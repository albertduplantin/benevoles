import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export default function Skeleton({ 
  className = '', 
  width = '100%', 
  height = '1rem',
  rounded = true,
  animate = true 
}: SkeletonProps) {
  const baseClasses = `bg-gray-200 ${animate ? 'animate-pulse' : ''} ${rounded ? 'rounded' : ''}`;
  
  return (
    <div 
      className={`${baseClasses} ${className}`}
      style={{ width, height }}
    />
  );
}

// Composants skeleton spécialisés
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          height="0.75rem" 
          width={i === lines - 1 ? '75%' : '100%'} 
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 border border-gray-200 rounded-xl bg-white/80 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <Skeleton height="1.5rem" width="60%" />
        <div className="flex gap-2">
          <Skeleton height="1.25rem" width="4rem" className="rounded-full" />
          <Skeleton height="1.25rem" width="4rem" className="rounded-full" />
        </div>
      </div>
      <SkeletonText lines={2} className="mb-4" />
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Skeleton height="1rem" width="1rem" className="rounded-full" />
          <Skeleton height="0.75rem" width="40%" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton height="1rem" width="1rem" className="rounded-full" />
          <Skeleton height="0.75rem" width="35%" />
        </div>
      </div>
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <Skeleton height="0.75rem" width="3rem" />
          <Skeleton height="0.75rem" width="2rem" />
        </div>
        <Skeleton height="0.5rem" width="100%" className="rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-200">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-2">
                <Skeleton height="0.75rem" width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-2">
                  <Skeleton height="0.75rem" width="90%" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonProfile({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center space-x-4">
        <Skeleton height="4rem" width="4rem" className="rounded-full" />
        <div className="space-y-2">
          <Skeleton height="1.25rem" width="8rem" />
          <Skeleton height="0.75rem" width="6rem" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton height="2rem" width="100%" />
        <Skeleton height="2rem" width="100%" />
      </div>
    </div>
  );
}
