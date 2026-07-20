import React from 'react';

export type ThreadColor = 'black' | 'white' | 'red' | 'gold' | 'green' | 'blue';

interface EmbroideryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  threadColor?: ThreadColor;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

const threadColorClasses: Record<ThreadColor, string> = {
  black: 'embroidery-thread-black',
  white: 'embroidery-thread-white',
  red: 'embroidery-thread-red',
  gold: 'embroidery-thread-gold',
  green: 'embroidery-thread-green',
  blue: 'embroidery-thread-blue',
};

const sizeClasses = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const variantClasses = {
  primary: 'bg-gradient-to-b from-terracotta-500 to-terracotta-700',
  secondary: 'bg-gradient-to-b from-linen-300 to-linen-700 text-embroidery-dark',
};

export const EmbroideryButton = React.forwardRef<
  HTMLButtonElement,
  EmbroideryButtonProps
>(
  (
    {
      children,
      threadColor = 'black',
      size = 'md',
      variant = 'primary',
      isLoading = false,
      className = '',
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseClasses = [
      'embroidery-button',
      threadColorClasses[threadColor],
      sizeClasses[size],
      variantClasses[variant],
      'rounded-md font-embroidery uppercase tracking-widest',
      'transition-all duration-150 ease-out',
      'focus:outline-none focus:ring-4 focus:ring-terracotta-300 focus:ring-opacity-50',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      'hover:shadow-lg hover:-translate-y-1',
      'active:shadow-embroidery-pressed active:translate-y-0.5',
      'inline-flex items-center justify-center',
      'select-none',
      className,
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Carregando...
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

EmbroideryButton.displayName = 'EmbroideryButton';
