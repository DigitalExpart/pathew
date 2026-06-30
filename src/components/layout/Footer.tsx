import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/images/logo.png';

// Icons
const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);
const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const TikTokIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
);

const footerStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  borderTop: '1px solid var(--border-color)',
  position: 'relative',
  overflow: 'hidden',
};

const footerMainStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '80px',
  marginBottom: '80px',
  maxWidth: '1400px',
  margin: '0 auto 80px',
  position: 'relative',
  zIndex: 1,
};

const footerBrandColStyle: React.CSSProperties = {
  flex: 1.5,
  maxWidth: '400px',
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
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  color: 'var(--text-muted)',
  fontSize: '0.875rem',
  maxWidth: '1400px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
};

const socialLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
};

const FooterCol = ({ title, links, hrefs }: { title: string, links: string[], hrefs?: string[] }) => (
  <div style={footerColStyle}>
    <h4 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1rem', fontWeight: 700 }}>{title}</h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {links.map((l, i) => {
        const href = hrefs && hrefs[i] ? hrefs[i] : '#';
        if (href.startsWith('http') || href.startsWith('/#') || href.startsWith('#')) {
          return <a key={l} href={href} target={href.startsWith('http') ? "_blank" : undefined} rel={href.startsWith('http') ? "noopener noreferrer" : undefined} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>{l}</a>;
        }
        return <Link key={l} to={href} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>{l}</Link>;
      })}
    </div>
  </div>
);

const SocialIcon = ({ icon: Icon, label, href = "#" }: { icon: any, label: string, href?: string }) => (
  <a href={href} target={href !== "#" ? "_blank" : undefined} rel={href !== "#" ? "noopener noreferrer" : undefined} aria-label={label} style={{
    color: 'var(--text-secondary)',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
  }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
    <Icon />
  </a>
);

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = React.useState(window.innerWidth <= 1024 && window.innerWidth > 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024 && window.innerWidth > 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSmallDevice = isMobile || isTablet;

  return (
    <footer className="section-padding" style={{
      ...footerStyle,
      paddingTop: isMobile ? '60px' : '100px',
      paddingBottom: '40px',
    }}>
      <div className="flex-responsive" style={{ 
        ...footerMainStyle, 
        gap: isSmallDevice ? '40px' : '80px',
        textAlign: isSmallDevice ? 'center' : 'left',
        flexDirection: isSmallDevice ? 'column' : 'row'
      }}>
        <div style={{ 
          ...footerBrandColStyle, 
          flex: isSmallDevice ? '1' : '1.5', 
          textAlign: isSmallDevice ? 'center' : 'left' 
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', fontWeight: 800, justifyContent: isSmallDevice ? 'center' : 'flex-start', color: 'var(--text-primary)', textDecoration: 'none' }}>
            <img src={logo} alt="PATHEW Logo" style={{ height: '32px', objectFit: 'contain' }} />
          </Link>
          <div style={{
            color: 'var(--text-secondary)', 
            lineHeight: 1.6, 
            maxWidth: isSmallDevice ? '100%' : '300px',
            margin: isSmallDevice ? '20px auto 0' : '20px 0 0'
          }}>
            <p style={{ marginBottom: '12px' }}>Your AI-powered career and opportunity platform.</p>
            <p>Build winning CVs, write tailored cover letters, discover grants and global opportunities, and let Pathew Assistant help you succeed.</p>
          </div>
        </div>
        
        <div className="grid-responsive" style={{ flex: 3, gap: '40px', display: 'flex', flexDirection: isSmallDevice ? 'column' : 'row', justifyContent: 'space-between' }}>
          <FooterCol 
            title={t('landing.footerCols.product', 'Product')} 
            links={[t('nav.features', 'Features'), t('nav.howItWorks', 'How it works'), t('nav.pricing', 'Pricing')]} 
            hrefs={['/#features', '/#how-it-works', '/#pricing']} 
          />
          <FooterCol 
            title={t('landing.footerCols.company', 'Company')} 
            links={[t('nav.contact', 'Contact')]} 
            hrefs={['/contact']} 
          />
          <FooterCol 
            title={t('landing.footerCols.legal', 'Legal')} 
            links={[t('nav.privacy', 'Privacy Policy'), t('nav.terms', 'Terms of Service'), t('nav.cookies', 'Cookies Policy')]} 
            hrefs={['/privacy-policy', '/terms', '/cookies']} 
          />
        </div>
      </div>
      
      <div style={{
        ...footerBottomStyle,
        flexDirection: isSmallDevice ? 'column' : 'row',
        gap: '24px',
        textAlign: 'center',
        marginTop: '64px',
        paddingTop: '32px',
        borderTop: '1px solid var(--border-color)',
      }}>
        <p>© {new Date().getFullYear()} PATHEW. {t('landing.footer.rights', 'All rights reserved.')}</p>
        <div style={{ ...socialLinksStyle, justifyContent: 'center' }}>
          <SocialIcon icon={FacebookIcon} label={t('common.facebook', 'Facebook')} href="https://www.facebook.com/share/1LukwTioKk/?mibextid=wwXIfr" />
          <SocialIcon icon={InstagramIcon} label={t('common.instagram', 'Instagram')} href="https://www.instagram.com/extraordinary_woman_blog?igsh=MXZkdDB1Y21iZHJ5Zw%3D%3D&utm_source=qr" />
          <SocialIcon icon={TikTokIcon} label={t('common.tiktok', 'TikTok')} />
        </div>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0,
      }}></div>
    </footer>
  );
};
