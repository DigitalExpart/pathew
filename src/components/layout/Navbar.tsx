import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, LayoutDashboard, UserCircle, ChevronDown, Menu, X, Sun, Moon, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/images/logo.png';

interface NavbarProps {
  activePage?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage }) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
  ];

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navLinkStyle = (page: string): React.CSSProperties => ({
    fontSize: isMobile ? '1.25rem' : '0.875rem',
    fontWeight: isMobile ? 600 : 500,
    color: activePage === page ? 'var(--accent-primary)' : 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    padding: isMobile ? '16px 0' : '0',
    borderBottom: isMobile ? '1px solid var(--border-color)' : 'none',
  });

  return (
    <>
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      style={{
        ...navStyle,
        padding: isMobile ? '16px 20px' : '24px 80px',
      }}
    >
      <Link to="/" style={logoStyle}>
        <img src={logo} alt="PATHEW Logo" style={{ height: isMobile ? '32px' : '40px', objectFit: 'contain' }} />
      </Link>

      {/* Desktop Links */}
      {!isMobile && (
        <div style={navLinksStyle}>
          <a href="#features" style={navLinkStyle('features')}>{t('nav.features', 'Features')}</a>
          <Link to="/how-it-works" style={navLinkStyle('how-it-works')}>{t('nav.howItWorks', 'How it works')}</Link>
          <Link to="/pricing" style={navLinkStyle('pricing')}>{t('nav.pricing', 'Pricing')}</Link>
          <Link to="/contact" style={navLinkStyle('contact')}>{t('nav.contact', 'Contact')}</Link>
        </div>
      )}

      <div style={navActionsStyle}>
        {/* Language Switcher */}
        {!isMobile && (
          <div style={{ position: 'relative' }} ref={langDropdownRef}>
            <button 
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              style={{ ...navLinkStyle(''), padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}
            >
              <Globe size={16} color="var(--text-secondary)" />
              {i18n.language.toUpperCase()}
            </button>
            <AnimatePresence>
              {isLangDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', zIndex: 100, minWidth: '120px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}
                >
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { i18n.changeLanguage(lang.code); setIsLangDropdownOpen(false); }}
                      style={{ width: '100%', padding: '10px 16px', background: i18n.language === lang.code ? 'var(--bg-tertiary)' : 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', fontWeight: i18n.language === lang.code ? 600 : 400 }}
                    >
                      {lang.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        {isMobile && (
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ color: 'var(--text-primary)' }}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        )}

        {!isMobile && (
          user ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={profileTriggerStyle}
              >
                <div style={avatarStyle}>
                  <User size={20} color="var(--accent-primary)" />
                </div>
                <ChevronDown size={16} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </motion.div>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={dropdownStyle}
                  >
                    <Link to="/dashboard" style={dropdownItemStyle} onClick={() => setIsDropdownOpen(false)}>
                      <LayoutDashboard size={18} /> Dashboard
                    </Link>
                    <Link to="/career-profile" style={dropdownItemStyle} onClick={() => setIsDropdownOpen(false)}>
                      <UserCircle size={18} /> Profile
                    </Link>
                    <button onClick={toggleTheme} style={dropdownItemStyle}>
                      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </button>
                    <div style={dividerStyle} />
                    <button onClick={handleLogout} style={{...dropdownItemStyle, color: '#ef4444', border: 'none', background: 'none', width: '100%', cursor: 'pointer'}}>
                      <LogOut size={18} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost">Login</Button></Link>
              <Link to="/signup"><Button>Get Started</Button></Link>
            </>
          )
        )}
      </div>

    </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            style={mobileMenuStyle}
          >
            <div style={{ display: 'flex', flexDirection: 'column', padding: '40px 20px' }}>
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} style={navLinkStyle('features')}>{t('nav.features', 'Features')}</a>
              <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)} style={navLinkStyle('how-it-works')}>{t('nav.howItWorks', 'How it works')}</Link>
              <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)} style={navLinkStyle('pricing')}>{t('nav.pricing', 'Pricing')}</Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} style={navLinkStyle('contact')}>{t('nav.contact', 'Contact')}</Link>
              
              <div style={{ marginTop: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { i18n.changeLanguage(lang.code); }}
                    style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border-color)', background: i18n.language === lang.code ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: i18n.language === lang.code ? '#000' : 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button style={{ width: '100%' }}>Dashboard</Button>
                    </Link>
                    <button onClick={handleLogout} style={{ color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" style={{ width: '100%' }}>Login</Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button style={{ width: '100%' }}>Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Styles
const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px 80px',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: 'var(--bg-primary)',
  opacity: 0.98,
  backdropFilter: 'blur(20px)',
  zIndex: 1000,
  borderBottom: '1px solid var(--border-color)',
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  textDecoration: 'none',
};

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '40px',
};

const navActionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const profileTriggerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-color)',
};

const avatarStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(245, 158, 11, 0.2)',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 12px)',
  right: 0,
  width: '200px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
  padding: '8px',
  overflow: 'hidden',
};

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  textDecoration: 'none',
  fontSize: '0.875rem',
  transition: 'all 0.2s ease',
  textAlign: 'left',
};

// Hover effect for dropdown items would ideally be CSS, but for this exercise:
const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'var(--border-color)',
  margin: '8px',
};

const mobileMenuStyle: React.CSSProperties = {
  position: 'fixed',
  top: '72px',
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'var(--bg-primary)',
  zIndex: 999,
  overflowY: 'auto',
};
