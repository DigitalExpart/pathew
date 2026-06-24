import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const CookieBanner: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDeny = () => {
    localStorage.setItem('cookieConsent', 'denied');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={bannerStyle}>
      <div style={containerStyle}>
        <p style={textStyle}>
          {t('cookieBanner.text')} <Link to="/privacy-policy" style={linkStyle}>{t('cookieBanner.privacyPolicy')}</Link>
        </p>
        <div style={buttonContainerStyle}>
          <button style={denyButtonStyle} onClick={handleDeny}>
            {t('cookieBanner.deny')}
          </button>
          <button style={acceptButtonStyle} onClick={handleAccept}>
            {t('cookieBanner.accept')}
          </button>
        </div>
      </div>
    </div>
  );
};

const bannerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'var(--bg-secondary, #1f2937)',
  color: 'var(--text-primary, #f9fafb)',
  padding: '16px',
  zIndex: 9999,
  boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  flexWrap: 'wrap',
};

const textStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.875rem',
  lineHeight: 1.5,
  flex: '1 1 300px',
};

const linkStyle: React.CSSProperties = {
  color: 'var(--accent-primary, #3b82f6)',
  textDecoration: 'underline',
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexShrink: 0,
};

const acceptButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--accent-primary, #3b82f6)',
  color: '#ffffff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 600,
  transition: 'background-color 0.2s',
};

const denyButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: 'var(--text-secondary, #9ca3af)',
  border: '1px solid var(--border-color, #4b5563)',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 600,
  transition: 'all 0.2s',
};
