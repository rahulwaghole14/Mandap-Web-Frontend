import React, { useState } from 'react';

const MandapamLogo = ({ size = 'medium', showText = false, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    small: {
      width: 'w-32',
      height: 'h-32',
      text: 'text-xs'
    },
    medium: {
      width: 'w-32',
      height: 'h-32',
      text: 'text-lg'
    },
    large: {
      width: 'w-32',
      height: 'h-32',
      text: 'text-2xl'
    }
  };

  const currentSize = sizeClasses[size];

  // If image fails to load, show text logo
  if (imageError) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className={`${currentSize.text} font-bold text-blue-800 tracking-wide`}>
          MANDAPAM
        </div>
        {showText && (
          <span className={`font-bold ${className.includes('text-white') ? 'text-white' : 'text-blue-800'} ${currentSize.text} ml-2`}>
            MANDAPAM
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {/* MANDAPAM Logo Image */}
      <img 
        src="/mandapam-logo.png" 
        alt="MANDAPAM Logo" 
        className={`${currentSize.width} ${currentSize.height} object-contain`}
        onError={() => setImageError(true)}
      />
      
      {showText && (
        <span className={`font-bold ${className.includes('text-white') ? 'text-white' : 'text-blue-800'} ${currentSize.text} ml-2`}>
          MANDAPAM
        </span>
      )}
    </div>
  );
};

export default MandapamLogo;
