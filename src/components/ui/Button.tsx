import React from 'react';
import { motion } from 'framer-motion';

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
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          border: 'none',
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
          border: 'none',
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

  const hoverStyles = variant === 'outline' 
    ? { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'var(--accent-primary)' }
    : { filter: 'brightness(1.1)', scale: 1.02 };

  const tapStyles = variant === 'outline'
    ? { scale: 0.98, backgroundColor: 'rgba(245, 158, 11, 0.1)' }
    : { scale: 0.98, filter: 'brightness(0.9)' };

  return (
    <motion.button
      whileHover={hoverStyles}
      whileTap={tapStyles}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: 'var(--radius-md)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        cursor: 'pointer',
        outline: 'none',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style
      }}
      {...props as any}
    >
      {children}
    </motion.button>
  );
};
