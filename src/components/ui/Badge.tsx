import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'info' }) => {
  const getStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-primary)' };
      case 'success':
        return { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' };
      case 'warning':
        return { backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' };
      case 'info':
        return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
      default:
        return {};
    }
  };

  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      ...getStyles()
    }}>
      {children}
    </span>
  );
};
