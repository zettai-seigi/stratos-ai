import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const variantClasses = {
  primary:
    'bg-accent-blue hover:bg-accent-blue/90 text-white border-transparent',
  secondary:
    'bg-bg-card hover:bg-bg-hover text-text-primary border-border',
  danger:
    'bg-rag-red hover:bg-rag-red/90 text-white border-transparent',
  ghost:
    'bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary border-transparent',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg border
        transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
