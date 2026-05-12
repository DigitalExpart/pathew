import React from 'react';
import { Card } from '../../components/ui/Card';
import { ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <div style={pageWrapperStyle}>
      <div style={containerStyle}>
        <Link to="/signup" style={backLinkStyle}>
          <ArrowLeft size={20} /> Back to Sign Up
        </Link>

        <Card style={{ padding: '64px', marginTop: '40px' }}>
          <div style={headerStyle}>
            <div style={iconBoxStyle}>
              <Lock size={32} color="var(--accent-primary)" />
            </div>
            <h1 style={titleStyle}>Privacy Policy</h1>
            <p style={subtitleStyle}>Version 1.0.0 • Last updated: May 12, 2024</p>
          </div>

          <div style={contentStyle}>
            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>1. Information We Collect</h2>
              <p style={paragraphStyle}>
                We collect your name and email address when you create an account. For your profile, 
                we may collect professional history, skills, and goals to provide better matching services.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>2. How We Use Data</h2>
              <p style={paragraphStyle}>
                Your data is used to calculate match scores with global opportunities and to communicate 
                relevant updates. We do not sell your personal information to third parties.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>3. Data Protection</h2>
              <p style={paragraphStyle}>
                We implement industry-standard security measures, including data encryption and secure 
                server protocols, to protect your personal information from unauthorized access.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>4. Your Rights</h2>
              <p style={paragraphStyle}>
                You have the right to access, correct, or delete your personal data at any time. 
                You can manage these settings directly through your profile dashboard.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>5. Cookies</h2>
              <p style={paragraphStyle}>
                We use essential cookies to maintain your login session and improve platform performance. 
                Non-essential cookies are only used with your explicit consent.
              </p>
            </section>
          </div>
        </Card>
      </div>
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
