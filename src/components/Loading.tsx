import React from 'react';

interface LoadingProps {
  type?: 'spinner' | 'skeleton';
  rows?: number;
  height?: string;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  type = 'spinner',
  rows = 1,
  height = '20px',
  className = ''
}) => {
  if (type === 'skeleton') {
    return (
      <div className={`skeleton-container ${className}`}>
        {Array(rows).fill(0).map((_, i) => (
          <div 
            key={i}
            className="skeleton-row"
            style={{ height }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`loading-container ${className}`}>
      <div className="loading-spinner" />
      <p className="loading-text">Loading...</p>
    </div>
  );
};