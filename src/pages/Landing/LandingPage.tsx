import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Sparkles, ArrowRight, CheckCircle, Globe, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const features = [
  { icon: Globe, title: "Global Discovery", description: "Aggregated opportunities from thousands of premium sources worldwide." },
  { icon: Zap, title: "Assistance Match Scoring", description: "Know exactly how well you fit before you even click apply." },
  { icon: CheckCircle, title: "Smart Document Generation", description: "Auto-generate CVs and cover letters tailored to each opportunity." },
  { icon: Shield, title: "Privacy First", description: "Your data is encrypted and only shared when you choose to apply." },
];

export const LandingPage: React.FC = () => {
  return (
    <div style={landingStyle}>
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        style={navStyle}
      >
        <div style={logoStyle}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </div>
        <div style={navLinksStyle}>
          <a href="#features" style={navLinkStyle}>Features</a>
          <a href="#how-it-works" style={navLinkStyle}>How it works</a>
          <a href="#pricing" style={navLinkStyle}>Pricing</a>
        </div>
        <div style={navActionsStyle}>
          <Link to="/login"><Button variant="ghost">Login</Button></Link>
          <Link to="/signup"><Button>Get Started</Button></Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <header style={heroSectionStyle}>
        <div style={heroBackgroundGlow}></div>
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={heroContentStyle}
        >
          <Badge text="Powered by Pathew Assistance" />
          <h1 style={heroTitleStyle}>
            Discover Your Next <span style={{ color: 'var(--accent-primary)' }}>Opportunity</span> with Precision.
          </h1>
          <p style={heroSubtitleStyle}>
            The ultimate platform for professionals to find, match, and apply for high-impact opportunities worldwide. 
            Stop searching, start matching with Pathew Assistance.
          </p>
          <div style={heroActionsStyle}>
            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" style={{ gap: '12px', padding: '16px 32px' }}>
                  Create Your Profile <ArrowRight size={20} />
                </Button>
              </motion.div>
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" style={{ padding: '16px 32px' }}>Watch Demo</Button>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={statsRowStyle}
          >
            <StatItem count="50k+" label="Opportunities" />
            <StatItem count="98%" label="Match Accuracy" />
            <StatItem count="120+" label="Countries" />
          </motion.div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, type: 'spring' }}
          style={heroImageContainerStyle}
        >
          <div style={heroImagePlaceholderStyle}>
            <img 
              src="/hero.png" 
              alt="Platform Dashboard" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={heroImageOverlayStyle}>
              <motion.div 
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, 1, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={floatingCardStyle}
              >
                <Zap size={24} color="var(--accent-primary)" />
                <div>
                  <div style={{ fontWeight: 700 }}>98% Match</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Senior Architect</div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Features Section */}
      <section id="features" style={featuresSectionStyle}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          style={sectionHeaderStyle}
        >
          <h2 style={sectionTitleStyle}>Why Professionals Choose PATHEW</h2>
          <p style={sectionSubtitleStyle}>Powerful tools designed to accelerate your career growth.</p>
        </motion.div>
        
        <div style={carouselContainerStyle}>
          <motion.div 
            animate={{ 
              x: [0, -1200], // Adjust based on total width
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            style={carouselTrackStyle}
          >
            {[...features, ...features].map((f, i) => (
              <FeatureCard 
                key={`${f.title}-${i}`}
                icon={f.icon} 
                title={f.title} 
                description={f.description} 
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={howItWorksSectionStyle}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={sectionHeaderStyle}
        >
          <h2 style={sectionTitleStyle}>How it Works</h2>
          <p style={sectionSubtitleStyle}>Your journey to a better career in three simple steps.</p>
        </motion.div>
        
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.2 }
            }
          }}
          style={stepsContainerStyle}
        >
          <StepItem number="01" title="Complete Your Profile" description="Share your story, achievements, and goals through our intuitive onboarding wizard." />
          <StepItem number="02" title="Get Matched" description="Our Assistance engine scans thousands of opportunities to find your perfect fit." />
          <StepItem number="03" title="Apply with Confidence" description="Use smart-generated documents to stand out and land your dream role." />
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={pricingSectionStyle}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={sectionHeaderStyle}
        >
          <h2 style={sectionTitleStyle}>Simple, Transparent Pricing</h2>
          <p style={sectionSubtitleStyle}>Choose the plan that fits your professional needs.</p>
        </motion.div>
        
        <div style={pricingGridStyle}>
          <PricingCard 
            title="Free" 
            price="$0" 
            features={['Basic matching', '3 applications/mo', 'Email support']} 
          />
          <PricingCard 
            title="Professional" 
            price="$19" 
            isPopular 
            features={['Unlimited matching', 'Unlimited applications', 'Assistance Polish', 'Priority support']} 
          />
          <PricingCard 
            title="Enterprise" 
            price="Custom" 
            features={['Team management', 'API access', 'Custom branding', 'Dedicated manager']} 
          />
        </div>
      </section>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={footerMainStyle}>
          <div style={footerBrandColStyle}>
            <div style={logoStyle}>
              <img src={logo} alt="PATHEW Logo" style={{ height: '32px', objectFit: 'contain' }} />
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '20px', lineHeight: 1.6 }}>
              The premium platform for global opportunity matching. Empowering professionals with Pathew Assistance.
            </p>
          </div>
          
          <div style={footerLinksGridStyle}>
            <FooterCol title="Product" links={['Features', 'How it works', 'Pricing', 'API']} />
            <FooterCol title="Company" links={['About', 'Careers', 'Blog', 'Contact']} />
            <FooterCol title="Legal" links={['Privacy', 'Terms', 'Security', 'Cookies']} />
          </div>
        </div>
        
        <div style={footerBottomStyle}>
          <p>© 2024 PATHEW. All rights reserved.</p>
          <div style={socialLinksStyle}>
            <SocialIcon label="Twitter" />
            <SocialIcon label="LinkedIn" />
            <SocialIcon label="GitHub" />
          </div>
        </div>
      </footer>
    </div>
  );
};

// Sub-components
const Badge = ({ text }: { text: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    style={badgeStyle}
  >
    <div style={badgeDotStyle}></div>
    <span>{text}</span>
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 }
    }}
    whileHover={{ y: -10, borderColor: 'var(--accent-primary)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
    style={{...featureCardStyle, flexShrink: 0, width: '350px'}}
  >
    <div style={featureIconWrapperStyle}>
      <Icon size={24} color="var(--accent-primary)" />
    </div>
    <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', fontWeight: 700 }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
  </motion.div>
);

const StatItem = ({ count, label }: { count: string, label: string }) => (
  <div style={statItemStyle}>
    <motion.div 
      initial={{ scale: 0.8 }}
      whileInView={{ scale: 1 }}
      style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}
    >
      {count}
    </motion.div>
    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{label}</div>
  </div>
);

const StepItem = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, scale: 0.9 },
      show: { opacity: 1, scale: 1 }
    }}
    whileHover={{ scale: 1.02 }}
    style={stepItemCardStyle}
  >
    <div style={stepNumberStyle}>{number}</div>
    <h3 style={{ marginBottom: '12px', fontSize: '1.5rem', fontWeight: 700 }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
  </motion.div>
);

const PricingCard = ({ title, price, features, isPopular }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -15 }}
    style={{
      ...pricingCardStyle,
      borderColor: isPopular ? 'var(--accent-primary)' : 'var(--border-color)',
      boxShadow: isPopular ? '0 30px 60px -15px rgba(245, 158, 11, 0.2)' : 'none',
      zIndex: isPopular ? 1 : 0
    }}
  >
    {isPopular && <div style={popularBadgeStyle}>Most Popular</div>}
    <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{title}</h3>
    <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px' }}>
      {price}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>{price !== 'Custom' ? '/mo' : ''}</span>
    </div>
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', flex: 1 }}>
      {features.map((f: string) => (
        <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
          <CheckCircle size={16} color="var(--accent-primary)" /> {f}
        </li>
      ))}
    </ul>
    <Button variant={isPopular ? 'primary' : 'outline'} style={{ width: '100%' }}>Get Started</Button>
  </motion.div>
);

const SocialIcon = ({ label }: { label: string }) => (
  <motion.span 
    whileHover={{ color: 'var(--accent-primary)', y: -2 }}
    style={{ cursor: 'pointer', transition: 'color 0.2s ease' }}
  >
    {label}
  </motion.span>
);

const FooterCol = ({ title, links }: { title: string, links: string[] }) => (
  <div style={footerColStyle}>
    <h4 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1rem', fontWeight: 700 }}>{title}</h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {links.map(l => (
        <a key={l} href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>{l}</a>
      ))}
    </div>
  </div>
);

// Styles
const landingStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  minHeight: '100vh',
  color: 'var(--text-primary)',
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
  backdropFilter: 'blur(20px)',
  zIndex: 1000,
  borderBottom: '1px solid var(--border-color)',
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '1.5rem',
  fontWeight: 800,
};

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '40px',
};

const navLinkStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  transition: 'color 0.2s ease',
};

const navActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
};

const heroSectionStyle: React.CSSProperties = {
  padding: '220px 80px 140px',
  display: 'flex',
  alignItems: 'center',
  gap: '80px',
  maxWidth: '1400px',
  margin: '0 auto',
  position: 'relative',
};

const heroBackgroundGlow: React.CSSProperties = {
  position: 'absolute',
  top: '20%',
  left: '10%',
  width: '400px',
  height: '400px',
  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
  filter: 'blur(60px)',
  zIndex: -1,
};

const heroContentStyle: React.CSSProperties = {
  flex: 1.2,
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: '5rem',
  lineHeight: 1.05,
  marginBottom: '32px',
  fontWeight: 800,
  letterSpacing: '-0.04em',
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  color: 'var(--text-secondary)',
  marginBottom: '48px',
  lineHeight: 1.6,
  maxWidth: '650px',
};

const heroActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
  marginBottom: '64px',
};

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '48px',
  borderTop: '1px solid var(--border-color)',
  paddingTop: '32px',
};

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const heroImageContainerStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
};

const heroImagePlaceholderStyle: React.CSSProperties = {
  width: '100%',
  height: '600px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '32px',
  border: '1px solid var(--border-color)',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.6)',
};

const heroImageOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8), transparent)',
};

const floatingCardStyle: React.CSSProperties = {
  position: 'absolute',
  top: '60px',
  left: '-30px',
  backgroundColor: 'var(--bg-tertiary)',
  padding: '24px',
  borderRadius: '20px',
  border: '1px solid rgba(245, 158, 11, 0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(10px)',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 16px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: '30px',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--accent-primary)',
  marginBottom: '32px',
  border: '1px solid rgba(245, 158, 11, 0.2)',
};

const badgeDotStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  backgroundColor: 'var(--accent-primary)',
  borderRadius: '50%',
  boxShadow: '0 0 10px var(--accent-primary)',
};

const featuresSectionStyle: React.CSSProperties = {
  padding: '140px 80px',
  backgroundColor: 'var(--bg-secondary)',
};

const howItWorksSectionStyle: React.CSSProperties = {
  padding: '140px 80px',
  backgroundColor: 'var(--bg-primary)',
};

const stepsContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '40px',
  maxWidth: '1200px',
  margin: '0 auto',
};

const stepItemCardStyle: React.CSSProperties = {
  padding: '48px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '32px',
  border: '1px solid var(--border-color)',
  position: 'relative',
};

const stepNumberStyle: React.CSSProperties = {
  fontSize: '4rem',
  fontWeight: 900,
  color: 'rgba(245, 158, 11, 0.1)',
  position: 'absolute',
  top: '20px',
  right: '30px',
};

const pricingSectionStyle: React.CSSProperties = {
  padding: '140px 80px',
  backgroundColor: 'var(--bg-secondary)',
};

const pricingGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '32px',
  maxWidth: '1200px',
  margin: '0 auto',
  alignItems: 'center',
};

const pricingCardStyle: React.CSSProperties = {
  padding: '48px',
  backgroundColor: 'var(--bg-primary)',
  borderRadius: '32px',
  border: '2px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  transition: 'all 0.3s ease',
};

const popularBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-16px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'var(--accent-primary)',
  color: '#000',
  padding: '6px 16px',
  borderRadius: '20px',
  fontSize: '0.875rem',
  fontWeight: 700,
};

const footerStyle: React.CSSProperties = {
  padding: '100px 80px 40px',
  backgroundColor: 'var(--bg-primary)',
  borderTop: '1px solid var(--border-color)',
};

const footerMainStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '80px',
  marginBottom: '80px',
  maxWidth: '1400px',
  margin: '0 auto 80px',
};

const footerBrandColStyle: React.CSSProperties = {
  flex: 1.5,
  maxWidth: '400px',
};

const footerLinksGridStyle: React.CSSProperties = {
  flex: 2,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '40px',
};

const footerColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const footerBottomStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '40px',
  borderTop: '1px solid var(--border-color)',
  color: 'var(--text-muted)',
  fontSize: '0.875rem',
  maxWidth: '1400px',
  margin: '0 auto',
};

const socialLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
};

const sectionHeaderStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '80px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '3.5rem',
  fontWeight: 800,
  marginBottom: '20px',
  letterSpacing: '-0.02em',
};

const sectionSubtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '1.25rem',
  maxWidth: '700px',
  margin: '0 auto',
};

const carouselContainerStyle: React.CSSProperties = {
  overflow: 'hidden',
  width: '100%',
  padding: '20px 0',
  position: 'relative',
};

const carouselTrackStyle: React.CSSProperties = {
  display: 'flex',
  gap: '32px',
  width: 'max-content',
};

const featuresGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '40px',
  maxWidth: '1200px',
  margin: '0 auto',
};

const featureCardStyle: React.CSSProperties = {
  padding: '48px',
  backgroundColor: 'var(--bg-primary)',
  borderRadius: '32px',
  border: '1px solid var(--border-color)',
  transition: 'all 0.3s ease',
  cursor: 'default',
};

const featureIconWrapperStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  backgroundColor: 'rgba(245, 158, 11, 0.05)',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '32px',
  border: '1px solid rgba(245, 158, 11, 0.1)',
};
