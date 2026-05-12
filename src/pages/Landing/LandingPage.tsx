import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Sparkles, ArrowRight, CheckCircle, Globe, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  return (
    <div style={landingStyle}>
      {/* Navbar */}
      <nav style={navStyle}>
        <div style={logoStyle}>
          <Sparkles size={24} color="var(--accent-primary)" />
          <span>PATHEW</span>
        </div>
        <div style={navLinksStyle}>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div style={navActionsStyle}>
          <Link to="/login"><Button variant="ghost">Login</Button></Link>
          <Link to="/signup"><Button>Get Started</Button></Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={heroSectionStyle}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={heroContentStyle}
        >
          <Badge text="Powered by Assistance & Rules Engine" />
          <h1 style={heroTitleStyle}>
            Discover Your Next <span className="text-gradient">Opportunity</span> with Precision.
          </h1>
          <p style={heroSubtitleStyle}>
            The ultimate platform for professionals to find, match, and apply for high-impact opportunities worldwide. 
            Stop searching, start matching.
          </p>
          <div style={heroActionsStyle}>
            <Link to="/signup">
              <Button size="lg" style={{ gap: '12px' }}>
                Create Your Profile <ArrowRight size={20} />
              </Button>
            </Link>
            <Button size="lg" variant="outline">Watch Demo</Button>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={heroImageContainerStyle}
        >
          <div style={heroImagePlaceholderStyle}>
            <div style={heroImageOverlayStyle}>
              <div style={floatingCardStyle}>
                <Zap size={24} color="var(--accent-primary)" />
                <div>
                  <div style={{ fontWeight: 700 }}>98% Match</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Senior Architect</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Features Section */}
      <section id="features" style={featuresSectionStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>Why Professionals Choose PATHEW</h2>
          <p style={sectionSubtitleStyle}>Powerful tools designed to accelerate your career growth.</p>
        </div>
        <div style={featuresGridStyle}>
          <FeatureCard 
            icon={Globe} 
            title="Global RSS Discovery" 
            description="Aggregated opportunities from thousands of premium sources worldwide."
          />
          <FeatureCard 
            icon={Zap} 
            title="Assistance Match Scoring" 
            description="Know exactly how well you fit before you even click apply."
          />
          <FeatureCard 
            icon={CheckCircle} 
            title="Smart Document Generation" 
            description="Auto-generate CVs and cover letters tailored to each opportunity."
          />
          <FeatureCard 
            icon={Shield} 
            title="Privacy First" 
            description="Your data is encrypted and only shared when you choose to apply."
          />
        </div>
      </section>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <div style={logoStyle}>
            <Sparkles size={20} color="var(--accent-primary)" />
            <span>Assistance</span>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
            © 2024 PATHEW. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Sub-components
const Badge = ({ text }: { text: string }) => (
  <div style={badgeStyle}>
    <div style={badgeDotStyle}></div>
    <span>{text}</span>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <div style={featureCardStyle}>
    <div style={featureIconWrapperStyle}>
      <Icon size={24} color="var(--accent-primary)" />
    </div>
    <h3 style={{ marginBottom: '12px', fontSize: '1.25rem' }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
  </div>
);

// Styles
const landingStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  minHeight: '100vh',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px 80px',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(10px)',
  zIndex: 1000,
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '1.5rem',
  fontWeight: 800,
  letterSpacing: '-0.025em',
};

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '40px',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
};

const navActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
};

const heroSectionStyle: React.CSSProperties = {
  padding: '180px 80px 100px',
  display: 'flex',
  alignItems: 'center',
  gap: '80px',
  maxWidth: '1400px',
  margin: '0 auto',
};

const heroContentStyle: React.CSSProperties = {
  flex: 1,
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: '4.5rem',
  lineHeight: 1.1,
  marginBottom: '24px',
  fontWeight: 800,
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  color: 'var(--text-secondary)',
  marginBottom: '40px',
  lineHeight: 1.6,
  maxWidth: '600px',
};

const heroActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
};

const heroImageContainerStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
};

const heroImagePlaceholderStyle: React.CSSProperties = {
  width: '100%',
  height: '500px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '24px',
  border: '1px solid var(--border-color)',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
};

const heroImageOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(45deg, rgba(245, 158, 11, 0.1), transparent)',
};

const floatingCardStyle: React.CSSProperties = {
  position: 'absolute',
  top: '40px',
  left: '-20px',
  backgroundColor: 'var(--bg-tertiary)',
  padding: '20px',
  borderRadius: '16px',
  border: '1px solid var(--accent-glow)',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  boxShadow: 'var(--shadow-lg)',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '30px',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--accent-primary)',
  marginBottom: '24px',
};

const badgeDotStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  backgroundColor: 'var(--accent-primary)',
  borderRadius: '50%',
};

const featuresSectionStyle: React.CSSProperties = {
  padding: '100px 80px',
  backgroundColor: 'var(--bg-secondary)',
};

const sectionHeaderStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '64px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  marginBottom: '16px',
};

const sectionSubtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '1.125rem',
};

const featuresGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '32px',
  maxWidth: '1200px',
  margin: '0 auto',
};

const featureCardStyle: React.CSSProperties = {
  padding: '40px',
  backgroundColor: 'var(--bg-primary)',
  borderRadius: '24px',
  border: '1px solid var(--border-color)',
  transition: 'transform 0.3s ease',
};

const featureIconWrapperStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '24px',
};

const footerStyle: React.CSSProperties = {
  padding: '80px',
  borderTop: '1px solid var(--border-color)',
};

const footerContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};
