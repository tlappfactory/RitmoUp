import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = '', ...props }: any) => {
  const baseStyle = "flex items-center justify-center rounded-xl h-12 px-6 text-base font-bold transition-transform active:scale-95";
  const variants = {
    primary: "btn-primary", // Uses global CSS class
    secondary: "bg-surface-dark/50 text-text-light border border-glass-border hover:bg-white/10",
    outline: "border-2 border-primary text-primary hover:bg-primary/10",
    ghost: "text-gray-400 hover:text-primary",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20"
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant as keyof typeof variants] || variants.primary} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({ icon, rightIcon, onRightIconClick, ...props }: any) => (
  <div className="relative w-full">
    {icon && (
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    )}
    <input
      className={`glass-input ${icon ? '!pl-14' : ''} ${rightIcon ? '!pr-12' : ''}`} // Uses global CSS class
      {...props}
    />
    {rightIcon && (
      <button
        type="button"
        onClick={onRightIconClick}
        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined">{rightIcon}</span>
      </button>
    )}
  </div>
);

export const Card = ({ children, className = '' }: any) => (
  <div className={`glass-card ${className}`}>
    {children}
  </div>
);

export const IconButton = ({ icon, onClick, className = '' }: any) => (
  <button
    onClick={onClick}
    className={`flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-300 hover:text-white cursor-pointer relative z-10 ${className}`}
  >
    <span className="material-symbols-outlined">{icon}</span>
  </button>
);