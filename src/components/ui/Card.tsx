import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: React.CSSProperties;
  glass?: boolean;
  icon?: React.ElementType;
}

export const Card: React.FC<CardProps> = ({ children, title, subtitle, style, glass, icon: Icon }) => {
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
      {(title || subtitle || Icon) && (
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {Icon && (
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <Icon size={20} color="var(--accent-primary)" />
            </div>
          )}
          <div>
            {title && <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
