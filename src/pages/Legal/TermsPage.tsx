import React from 'react';
import { Card } from '../../components/ui/Card';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const TermsPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={pageWrapperStyle}>
        <div style={containerStyle}>
          <Link to="/signup" style={backLinkStyle}>
            <ArrowLeft size={20} /> {t('legal.backToSignup')}
          </Link>

          <Card style={{ padding: '64px', marginTop: '40px' }}>
            <div style={headerStyle}>
              <div style={iconBoxStyle}>
                <Shield size={32} color="var(--accent-primary)" />
              </div>
              <h1 style={titleStyle}>{t('legal.terms.title')}</h1>
              <p style={subtitleStyle}>{t('legal.terms.subtitle')}</p>
            </div>

            <div style={contentStyle}>
              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>{t('legal.terms.sections.0.title')}</h2>
                <p style={paragraphStyle}>
                  {t('legal.terms.sections.0.p')}
                </p>
              </section>

              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>{t('legal.terms.sections.1.title')}</h2>
                <p style={paragraphStyle}>
                  {t('legal.terms.sections.1.p')}
                </p>
              </section>

              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>{t('legal.terms.sections.2.title')}</h2>
                <p style={paragraphStyle}>
                  {t('legal.terms.sections.2.p')}
                </p>
              </section>

              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>{t('legal.terms.sections.3.title')}</h2>
                <p style={paragraphStyle}>
                  {t('legal.terms.sections.3.p')}
                </p>
              </section>

              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>{t('legal.terms.sections.4.title')}</h2>
                <p style={paragraphStyle}>
                  {t('legal.terms.sections.4.p')}
                </p>
              </section>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const pageWrapperStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  minHeight: '100vh',
  padding: '80px 20px',
  color: 'var(--text-primary)',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
};

const backLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '64px',
};

const iconBoxStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 800,
  marginBottom: '12px',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '0.875rem',
};

const contentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '40px',
};

const sectionStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '32px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  marginBottom: '16px',
};

const paragraphStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  lineHeight: 1.8,
  fontSize: '1rem',
};
