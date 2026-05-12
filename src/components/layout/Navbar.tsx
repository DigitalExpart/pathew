import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, LayoutDashboard, UserCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import logo from '../../assets/images/logo.png';

interface NavbarProps {
  activePage?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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
    fontSize: '0.875rem',
    fontWeight: 500,
    color: activePage === page ? 'var(--accent-primary)' : 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  });

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      style={navStyle}
    >
      <Link to="/" style={logoStyle}>
        <img src={logo} alt="PATHEW Logo" style={{ height: '40px', objectFit: 'contain' }} />
      </Link>

      <div style={navLinksStyle}>
        <a href="#features" style={navLinkStyle('features')}>Features</a>
        <Link to="/how-it-works" style={navLinkStyle('how-it-works')}>How it works</Link>
        <Link to="/pricing" style={navLinkStyle('pricing')}>Pricing</Link>
        <Link to="/contact" style={navLinkStyle('contact')}>Contact</Link>
      </div>

      <div style={navActionsStyle}>
        {user ? (
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
                  <Link to="/profile" style={dropdownItemStyle} onClick={() => setIsDropdownOpen(false)}>
                    <UserCircle size={18} /> Profile
                  </Link>
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
        )}
      </div>
    </motion.nav>
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
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
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
