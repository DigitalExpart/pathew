import React from 'react';
import { Card } from '../../components/ui/Card';
import { ArrowLeft, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const CookiesPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={pageWrapperStyle}>
        <div style={containerStyle}>
          <Link to="/" style={backLinkStyle}>
            <ArrowLeft size={20} /> Back to Home
          </Link>

          <Card style={{ padding: '64px', marginTop: '40px' }}>
          <div style={headerStyle}>
            <div style={iconBoxStyle}>
              <Cookie size={32} color="var(--accent-primary)" />
            </div>
            <h1 style={titleStyle}>Cookie Policy</h1>
            <p style={subtitleStyle}>How we use cookies to improve your experience on Pathew.</p>
          </div>

          <div style={contentStyle}>
            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>1. What are cookies?</h2>
              <p style={paragraphStyle}>
                Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>2. How we use cookies</h2>
              <p style={paragraphStyle}>
                We use cookies to understand how you interact with our platform, to personalize your experience, and to analyze our traffic. This includes keeping you signed in, understanding which parts of the platform you visit most often, and providing personalized content.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>3. Types of cookies we use</h2>
              <p style={paragraphStyle}>
                <strong>Essential cookies:</strong> These are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website.
                <br /><br />
                <strong>Analytical/performance cookies:</strong> These allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it.
                <br /><br />
                <strong>Functionality cookies:</strong> These are used to recognize you when you return to our website. This enables us to personalize our content for you and remember your preferences.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>4. Managing cookies</h2>
              <p style={paragraphStyle}>
                You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>5. Changes to our cookie policy</h2>
              <p style={paragraphStyle}>
                We may update this policy from time to time to reflect changes in technology, legislation, or our operations. Any changes we may make to our cookie policy in the future will be posted on this page.
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
