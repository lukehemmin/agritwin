import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ 
  message = '로딩 중...', 
  size = 'md',
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className={`${sizeClasses[size]} relative`}>
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        
        {/* Message */}
        <p className="text-gray-600 text-sm font-medium">{message}</p>
        
        {/* Progress dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

// Skeleton loader for cards and lists
export const SkeletonLoader: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div 
          key={i} 
          className={`h-4 bg-gray-200 rounded mb-2 ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
};

// Loading overlay for specific components
export const LoadingOverlay: React.FC<{ isLoading: boolean; children: React.ReactNode }> = ({ 
  isLoading, 
  children 
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <Loading size="sm" message="업데이트 중..." />
        </div>
      )}
    </div>
  );
};