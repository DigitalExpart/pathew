import React from 'react';
import { Card } from '../../components/ui/Card';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div style={pageWrapperStyle}>
      <div style={containerStyle}>
        <Link to="/signup" style={backLinkStyle}>
          <ArrowLeft size={20} /> Back to Sign Up
        </Link>

        <Card style={{ padding: '64px', marginTop: '40px' }}>
          <div style={headerStyle}>
            <div style={iconBoxStyle}>
              <Shield size={32} color="var(--accent-primary)" />
            </div>
            <h1 style={titleStyle}>Terms & Conditions</h1>
            <p style={subtitleStyle}>Last updated: May 12, 2024</p>
          </div>

          <div style={contentStyle}>
            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>1. Acceptance of Terms</h2>
              <p style={paragraphStyle}>
                By accessing and using PATHEW Assistance, you agree to be bound by these Terms and Conditions. 
                If you do not agree with any part of these terms, you must not use our services.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>2. Account Registration</h2>
              <p style={paragraphStyle}>
                To access certain features, you must create an account. You are responsible for maintaining 
                the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>3. Use of Services</h2>
              <p style={paragraphStyle}>
                Our services are intended for professional opportunity matching. You agree not to use the 
                platform for any unlawful purposes or in any way that could damage or disable our infrastructure.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>4. Data & Privacy</h2>
              <p style={paragraphStyle}>
                Your use of PATHEW is also governed by our Privacy Policy. Please review it to understand 
                how we collect and process your information.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>5. Termination</h2>
              <p style={paragraphStyle}>
                We reserve the right to suspend or terminate your account at our discretion if we believe 
                you have violated these terms.
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
