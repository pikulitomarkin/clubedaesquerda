import React from 'react';

interface EmbroideryLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Marca oficial do cliente: bastidor bordado com "Clube da Esquerda"
// (OneDrive_2026-07-23/IMAGENS PROJETO/Marca.png), fundo removido e servida
// em /brand/marca.png. Substitui a versão anterior, que simulava o bastidor
// em CSS (.embroidery-frame + fonte manuscrita).
const sizeClasses = {
  sm: 'w-24 h-24',
  md: 'w-40 h-40',
  lg: 'w-56 h-56',
  // Marca em destaque na tela de login (~+200px sobre o tamanho anterior).
  xl: 'w-[21rem] h-[21rem]',
};

export const EmbroideryLogo: React.FC<EmbroideryLogoProps> = ({
  size = 'md',
  className = '',
}) => (
  <img
    src="/brand/marca.png"
    alt="Clube da Esquerda"
    className={`${sizeClasses[size]} object-contain drop-shadow-md ${className}`}
  />
);
