import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const CookieBanner: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleSettings = () => {
    // Open settings modal or redirect, for now just close banner as mock
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={bannerStyle}>
      <div style={{ ...containerStyle, flexDirection: isMobile ? 'column' : 'row' }}>
        <p style={{ ...textStyle, textAlign: isMobile ? 'center' : 'left', flex: isMobile ? 'none' : '1 1 500px', marginBottom: isMobile ? '12px' : '0' }}>
          {t('cookieBanner.text')} <Link to="/cookies" style={linkStyle}>{t('cookieBanner.privacyPolicy')}</Link>.
        </p>
        <div style={{ ...buttonContainerStyle, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-end' }}>
          <button style={settingsButtonStyle} onClick={handleSettings}>
            {t('cookieBanner.settings')}
          </button>
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
  backgroundColor: '#ffffff',
  color: '#333333',
  padding: '16px 24px',
  zIndex: 9999,
  boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)',
  borderTop: '1px solid #e5e7eb',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '24px',
  flexWrap: 'wrap',
};

const textStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.875rem',
  lineHeight: 1.5,
  flex: '1 1 500px',
  color: '#4b5563',
};

const linkStyle: React.CSSProperties = {
  color: '#111827',
  textDecoration: 'underline',
  fontWeight: 600,
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexShrink: 0,
  flexWrap: 'wrap',
};

const settingsButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#4b5563',
  border: 'none',
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 600,
  textDecoration: 'underline',
};

const denyButtonStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  padding: '10px 20px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 600,
  transition: 'all 0.2s',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};

const acceptButtonStyle: React.CSSProperties = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 600,
  transition: 'background-color 0.2s',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};
