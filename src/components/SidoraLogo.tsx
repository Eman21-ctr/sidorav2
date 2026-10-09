import React from 'react';

interface SidoraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  className?: string;
}

export const SidoraLogo: React.FC<SidoraLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: { height: 'h-8', maxW: 'max-w-[120px]' },
    md: { height: 'h-10 sm:h-11', maxW: 'max-w-[160px] sm:max-w-[180px]' },
    lg: { height: 'h-14 sm:h-16', maxW: 'max-w-[220px]' },
    xl: { height: 'h-20 sm:h-24', maxW: 'max-w-[300px]' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/logo-sidora.png"
        alt="Sidora Logo"
        className={`${currentSize.height} ${currentSize.maxW} w-auto object-contain`}
        style={{ filter: 'drop-shadow(0 1px 3px rgba(29,78,216,0.12))' }}
      />
    </div>
  );
};
