import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: React.CSSProperties;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, title, subtitle, style, glass }) => {
  return (
    <div 
      className={glass ? 'glass' : ''}
      style={{
        backgroundColor: glass ? 'transparent' : 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        ...style
      }}
    >
      {(title || subtitle) && (
        <div style={{ marginBottom: '20px' }}>
          {title && <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{title}</h3>}
          {subtitle && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
