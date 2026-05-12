import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  CheckCircle, 
  Target, 
  Users, 
  Zap, 
  Search, 
  FileText, 
  Award,
  Mail
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import logo from '../../assets/images/logo.png';
import { Link } from 'react-router-dom';

// Team Images (Using absolute paths to generated artifacts)
const team1 = 'file:///C:/Users/Shilley%20Pc/.gemini/antigravity/brain/0068f4c0-8b20-4cdc-bf1e-10e3acf79c97/team_member_1_1778619959522.png';
const team2 = 'file:///C:/Users/Shilley%20Pc/.gemini/antigravity/brain/0068f4c0-8b20-4cdc-bf1e-10e3acf79c97/team_member_2_1778619980682.png';
const team3 = 'file:///C:/Users/Shilley%20Pc/.gemini/antigravity/brain/0068f4c0-8b20-4cdc-bf1e-10e3acf79c97/team_member_3_1778620007301.png';

export const HowItWorksPage: React.FC = () => {
  return (
    <div style={pageStyle}>
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={navStyle}
      >
        <div style={logoStyle}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </div>
        <div style={navLinksStyle}>
          <Link to="/" style={navLinkStyle}>Features</Link>
          <Link to="/how-it-works" style={{...navLinkStyle, color: 'var(--accent-primary)'}}>How it works</Link>
          <Link to="/" style={navLinkStyle}>Pricing</Link>
          <Link to="/contact" style={navLinkStyle}>Contact</Link>
        </div>
        <div style={navActionsStyle}>
          <Link to="/login"><Button variant="ghost">Login</Button></Link>
          <Link to="/signup"><Button>Get Started</Button></Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section style={heroSectionStyle}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={heroContentStyle}
        >
          <div style={badgeStyle}>The Roadmap to Success</div>
          <h1 style={titleStyle}>How <span style={{ color: 'var(--accent-primary)' }}>PATHEW</span> Works</h1>
          <p style={subtitleStyle}>
            Discover how our advanced Assistant technology bridges the gap between your talent and global opportunities.
          </p>
        </motion.div>

        {/* Video Placeholder */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={videoContainerStyle}
        >
          <div style={videoPlaceholderStyle}>
            <div style={playButtonStyle}>
              <Play size={40} fill="currentColor" />
            </div>
            <div style={videoOverlayStyle}>
              <div style={{ padding: '40px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Platform Demo</h3>
                <p style={{ opacity: 0.8 }}>Watch how to apply for your next opportunity in minutes.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Process Section */}
      <section style={sectionStyle}>
        <div style={containerStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>A 3-Step Journey</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>We've simplified the complex world of international applications into three powerful stages.</p>
          </div>

          <div style={processGridStyle}>
            <ProcessCard 
              number="01" 
              icon={Search} 
              title="Global Discovery" 
              desc="Our engine scans thousands of curated sources to find opportunities specifically matched to your unique profile."
            />
            <ProcessCard 
              number="02" 
              icon={Zap} 
              title="Assistant Analysis" 
              desc="The PATHEW Assistant evaluates your gaps, suggests improvements, and generates tailored application documents."
            />
            <ProcessCard 
              number="03" 
              icon={Award} 
              title="Direct Application" 
              desc="Apply with confidence using optimized materials that stand out to selection committees and employers."
            />
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section style={{...sectionStyle, backgroundColor: 'var(--bg-secondary)'}}>
        <div style={containerStyle}>
          <div style={storyGridStyle}>
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              style={storyContentStyle}
            >
              <div style={badgeStyle}>Our Story</div>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px' }}>Born from <span style={{ color: 'var(--accent-primary)' }}>Frustration</span>, Built for <span style={{ color: 'var(--accent-primary)' }}>Future</span>.</h2>
              <p style={storyTextStyle}>
                PATHEW started as a small internal tool used by international researchers to find funding. We quickly realized that the biggest barrier to global success wasn't talent—it was access to information and the ability to package that talent effectively.
              </p>
              <p style={storyTextStyle}>
                Today, we empower thousands of professionals across 120+ countries to navigate the complex landscape of fellowships, grants, and high-impact roles with ease and precision.
              </p>
              <div style={{ display: 'flex', gap: '32px', marginTop: '40px' }}>
                <div>
                  <div style={statValueStyle}>50k+</div>
                  <div style={statLabelStyle}>Lives Impacted</div>
                </div>
                <div>
                  <div style={statValueStyle}>120+</div>
                  <div style={statLabelStyle}>Countries</div>
                </div>
              </div>
            </motion.div>
            <div style={storyImagePlaceholderStyle}>
              <div style={glowStyle}></div>
              <Users size={120} color="var(--accent-primary)" style={{ opacity: 0.2 }} />
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section style={sectionStyle}>
        <div style={containerStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>The 3-Man Core</h2>
            <p style={{ color: 'var(--text-muted)' }}>Meet the visionaries behind the PATHEW Assistant engine.</p>
          </div>

          <div style={teamGridStyle}>
            <TeamMember 
              image={team1} 
              name="Marcus Chen" 
              role="Chief Executive Officer" 
              desc="Former UNDP strategist with a passion for democratizing global opportunity access."
            />
            <TeamMember 
              image={team2} 
              name="Sarah Jenkins" 
              role="Chief Technology Officer" 
              desc="AI systems architect specializing in NLP and automated document optimization."
            />
            <TeamMember 
              image={team3} 
              name="Dr. Robert Vogel" 
              role="Head of Strategy" 
              desc="20+ years experience in international grant management and fellowship design."
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={ctaSectionStyle}>
        <Card style={ctaCardStyle}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '24px' }}>Ready to bridge the gap?</h2>
          <p style={{ fontSize: '1.125rem', marginBottom: '40px', opacity: 0.9 }}>Join thousands of professionals already using PATHEW to accelerate their careers.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/signup"><Button size="lg">Get Started Now</Button></Link>
            <Link to="/contact"><Button size="lg" variant="outline">Talk to us</Button></Link>
          </div>
        </Card>
      </section>
      </section>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={footerMainStyle}>
          <div style={footerBrandColStyle}>
            <div style={logoStyle}>
              <img src={logo} alt="PATHEW Logo" style={{ height: '32px', objectFit: 'contain' }} />
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '20px', lineHeight: 1.6 }}>
              The premium platform for global opportunity matching. Empowering professionals with Pathew Assistant.
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
            <FooterSocialIcon icon={FacebookIcon} label="Facebook" />
            <FooterSocialIcon icon={InstagramIcon} label="Instagram" />
            <FooterSocialIcon icon={TikTokIcon} label="TikTok" />
          </div>
        </div>
      </footer>
    </div>
  );
};

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

const FooterSocialIcon = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <motion.a 
    href="#"
    whileHover={{ color: 'var(--accent-primary)', y: -2 }}
    style={{ color: 'var(--text-muted)', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center' }}
    aria-label={label}
  >
    <Icon size={20} />
  </motion.a>
);

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const ProcessCard = ({ number, icon: Icon, title, desc }: any) => (
  <motion.div 
    whileHover={{ y: -10 }}
    style={processCardStyle}
  >
    <div style={processNumberStyle}>{number}</div>
    <div style={processIconWrapperStyle}>
      <Icon size={32} color="var(--accent-primary)" />
    </div>
    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
  </motion.div>
);

const TeamMember = ({ image, name, role, desc }: any) => (
  <motion.div 
    whileHover={{ y: -10 }}
    style={teamCardStyle}
  >
    <div style={teamImageWrapperStyle}>
      <img src={image} alt={name} style={teamImageStyle} />
      <div style={teamSocialOverlayStyle}>
        <SocialIcon icon={LinkedinIcon} />
        <SocialIcon icon={TwitterIcon} />
        <SocialIcon icon={Mail} />
      </div>
    </div>
    <div style={{ padding: '32px' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>{name}</h3>
      <div style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase' }}>{role}</div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{desc}</p>
    </div>
  </motion.div>
);

const SocialIcon = ({ icon: Icon }: any) => (
  <div style={socialIconStyle}>
    <Icon size={16} />
  </div>
);

const LinkedinIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

// Styles
const pageStyle: React.CSSProperties = {
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
  padding: '180px 20px 100px',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
};

const heroContentStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  marginBottom: '64px',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 16px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  color: 'var(--accent-primary)',
  borderRadius: '20px',
  fontSize: '0.875rem',
  fontWeight: 600,
  marginBottom: '24px',
  border: '1px solid rgba(245, 158, 11, 0.2)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '4.5rem',
  fontWeight: 800,
  marginBottom: '24px',
  letterSpacing: '-0.02em',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
};

const videoContainerStyle: React.CSSProperties = {
  maxWidth: '1000px',
  margin: '0 auto',
  position: 'relative',
};

const videoPlaceholderStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '16/9',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '32px',
  border: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.6)',
};

const playButtonStyle: React.CSSProperties = {
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  backgroundColor: 'var(--accent-primary)',
  color: '#000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingLeft: '6px',
  zIndex: 2,
  transition: 'transform 0.3s ease',
};

const videoOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
  textAlign: 'left',
  zIndex: 1,
};

const sectionStyle: React.CSSProperties = {
  padding: '140px 20px',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
};

const sectionHeaderStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '80px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '3rem',
  fontWeight: 800,
  marginBottom: '20px',
};

const processGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '40px',
};

const processCardStyle: React.CSSProperties = {
  padding: '48px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '32px',
  border: '1px solid var(--border-color)',
  position: 'relative',
};

const processNumberStyle: React.CSSProperties = {
  position: 'absolute',
  top: '30px',
  right: '40px',
  fontSize: '4rem',
  fontWeight: 900,
  color: 'rgba(245, 158, 11, 0.05)',
};

const processIconWrapperStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '32px',
};

const storyGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '80px',
  alignItems: 'center',
};

const storyContentStyle: React.CSSProperties = {
  textAlign: 'left',
};

const storyTextStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.8,
  marginBottom: '24px',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 800,
  color: 'var(--accent-primary)',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

const storyImagePlaceholderStyle: React.CSSProperties = {
  aspectRatio: '1/1',
  backgroundColor: 'var(--bg-primary)',
  borderRadius: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  border: '1px solid var(--border-color)',
  overflow: 'hidden',
};

const glowStyle: React.CSSProperties = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
};

const teamGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '32px',
};

const teamCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '32px',
  border: '1px solid var(--border-color)',
  overflow: 'hidden',
};

const teamImageWrapperStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '4/5',
  position: 'relative',
  overflow: 'hidden',
};

const teamImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const teamSocialOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '20px',
  left: '20px',
  display: 'flex',
  gap: '10px',
};

const socialIconStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  cursor: 'pointer',
};

const ctaSectionStyle: React.CSSProperties = {
  padding: '100px 20px 140px',
  textAlign: 'center',
};

const ctaCardStyle: React.CSSProperties = {
  padding: '80px 40px',
  background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 1) 100%)',
  borderRadius: '48px',
  border: '1px solid rgba(245, 158, 11, 0.2)',
  maxWidth: '1000px',
  margin: '0 auto',
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
  maxWidth: '1200px',
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
  maxWidth: '1200px',
  margin: '0 auto',
};

const socialLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
};
