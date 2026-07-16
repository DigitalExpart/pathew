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

  const handleSettings = () => {
    // Open settings modal or redirect, for now just close banner as mock
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        .cookie-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #ffffff;
          color: #333333;
          padding: 16px 24px;
          z-index: 9999;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
          border-top: 1px solid #e5e7eb;
        }
        .cookie-banner-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .cookie-text {
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.5;
          flex: 1 1 500px;
          color: #4b5563;
          text-align: left;
        }
        .cookie-link {
          color: #111827;
          text-decoration: underline;
          font-weight: 600;
        }
        .cookie-btn-container {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          flex-wrap: wrap;
          width: auto;
          justify-content: flex-end;
        }
        .cookie-settings-btn {
          background-color: transparent;
          color: #4b5563;
          border: none;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: underline;
        }
        .cookie-deny-btn {
          background-color: #ffffff;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .cookie-accept-btn {
          background-color: #10b981;
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: background-color 0.2s;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .cookie-text-mobile {
          display: none;
        }
        .cookie-text-desktop {
          display: inline;
        }

        @media (max-width: 992px) {
          .cookie-banner-container {
            flex-direction: column;
          }
          .cookie-text {
            text-align: center;
            flex: none;
            margin-bottom: 12px;
          }
          .cookie-text-desktop {
            display: none;
          }
          .cookie-text-mobile {
            display: inline;
          }
          .cookie-settings-btn {
            display: none;
          }
          .cookie-btn-container {
            width: 100%;
            justify-content: center;
            flex-wrap: nowrap;
          }
          .cookie-deny-btn, .cookie-accept-btn {
            flex: 1;
            padding: 10px 8px;
            font-size: 0.75rem;
            white-space: nowrap;
          }
        }
      `}</style>
      <div className="cookie-banner">
        <div className="cookie-banner-container">
          <p className="cookie-text">
            <span className="cookie-text-mobile">
              We use cookies to enhance your experience.{' '}
              <Link to="/cookies" className="cookie-link">Read more</Link>
            </span>
            <span className="cookie-text-desktop">
              {t('cookieBanner.text')} <Link to="/cookies" className="cookie-link">{t('cookieBanner.privacyPolicy')}</Link>.
            </span>
          </p>
          <div className="cookie-btn-container">
            <button className="cookie-settings-btn" onClick={handleSettings}>
              {t('cookieBanner.settings')}
            </button>
            <button className="cookie-deny-btn" onClick={handleDeny}>
              {t('cookieBanner.deny')}
            </button>
            <button className="cookie-accept-btn" onClick={handleAccept}>
              {t('cookieBanner.accept')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
