import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  style,
  ...props 
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--accent-primary)',
          color: '#000',
          fontWeight: 600,
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '6px 12px', fontSize: '0.75rem' };
      case 'md':
        return { padding: '10px 20px', fontSize: '0.875rem' };
      case 'lg':
        return { padding: '14px 28px', fontSize: '1rem' };
      default:
        return {};
    }
  };

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: 'var(--radius-md)',
        transition: 'all 0.2s ease',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
};
