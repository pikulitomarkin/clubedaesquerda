import React from 'react';

interface EmbroideryLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EmbroideryLogo: React.FC<EmbroideryLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="embroidery-frame w-full h-full flex items-center justify-center">
        <div className={`embroidery-text ${textSizeClasses[size]} font-handwritten`}>
          Clube da
          <br />
          Esquerda
        </div>
      </div>
    </div>
  );
};
