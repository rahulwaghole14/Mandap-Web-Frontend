import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingProgress = ({ 
  progress = 0, 
  message = "Loading...", 
  showPercentage = true,
  size = "default" 
}) => {
  const sizeClasses = {
    small: "h-2",
    default: "h-3",
    large: "h-4"
  };

  const textSizeClasses = {
    small: "text-xs",
    default: "text-sm",
    large: "text-base"
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-gray-600 ${textSizeClasses[size]}`}>
          {message}
        </span>
        {showPercentage && (
          <span className={`text-gray-500 ${textSizeClasses[size]}`}>
            {Math.round(progress)}%
          </span>
        )}
      </div>
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className="bg-primary-600 h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      
      {progress < 100 && (
        <div className="flex items-center justify-center mt-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary-600 mr-2" />
          <span className="text-xs text-gray-500">Loading data...</span>
        </div>
      )}
    </div>
  );
};

export default LoadingProgress;
