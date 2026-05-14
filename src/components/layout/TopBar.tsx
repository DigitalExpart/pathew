import React from 'react';
import { Search, Bell, HelpCircle, ChevronDown, Coins, Sparkles, UserCircle, LogOut, LayoutDashboard, Menu } from 'lucide-react';
import { mockUser } from '../../data/mockData';
import { useAssistant } from '../../context/AssistantContext';

import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { user, profile, signOut } = useAuth();
  const { openAssistant } = useAssistant();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 1024;
  const isSmallMobile = windowWidth <= 768;

  React.useEffect(() => {
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
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || mockUser.name;

  const headerResponsiveStyle: React.CSSProperties = {
    ...headerStyle,
    padding: isSmallMobile ? '0 16px' : '0 32px',
    marginLeft: isMobile ? '0' : '260px',
  };

  return (
    <header style={headerResponsiveStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isMobile && (
          <button onClick={onMenuClick} style={iconButtonStyle}>
            <Menu size={24} color="var(--text-primary)" />
          </button>
        )}
        {!isSmallMobile && (
          <div style={searchContainerStyle}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search..." 
              style={searchInputStyle}
            />
          </div>
        )}
      </div>

      <div style={actionsStyle}>
        {!isSmallMobile && (
          <button 
            style={AssistantButtonStyle}
            onClick={() => openAssistant('Pathew Assistant', ['How can I improve my profile?', 'What opportunities are trending?', 'Help me write a document'])}
          >
            <Sparkles size={16} />
            <span>Assistant</span>
          </button>
        )}

        {isSmallMobile && (
          <button 
            style={{ ...iconButtonStyle, color: 'var(--accent-primary)' }}
            onClick={() => openAssistant('Pathew Assistant', ['How can I improve my profile?', 'What opportunities are trending?', 'Help me write a document'])}
          >
            <Sparkles size={20} />
          </button>
        )}

        {!isSmallMobile && (
          <>
            <button style={iconButtonStyle}>
              <HelpCircle size={20} color="var(--text-secondary)" />
            </button>
            <Link to="/notifications" style={iconButtonStyle}>
              <div style={notificationBadgeStyle}></div>
              <Bell size={20} color="var(--text-secondary)" />
            </Link>
          </>
        )}

        <Link to="/wallet" style={{ ...creditBadgeStyle, textDecoration: 'none' }}>
          <Coins size={16} color="var(--accent-primary)" />
          <span style={creditTextStyle}>{profile?.credits?.toLocaleString() || '0'}</span>
        </Link>
        
        <div style={dividerStyle}></div>

        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div style={userProfileStyle} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            {!isSmallMobile && (
              <div style={userInfoStyle}>
                <span style={userNameStyle}>{displayName}</span>
                <span style={userRoleStyle}>
                  {profile?.subscription_plan ? `${profile.subscription_plan} Member` : (user ? 'Explorer' : 'Guest')}
                </span>
              </div>
            )}
            <div style={avatarWrapperStyle}>
              {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                <img src={profile?.avatar_url || user?.user_metadata?.avatar_url} alt={displayName} style={avatarStyle} />
              ) : (
                <div style={avatarFallbackStyle}>
                  <UserCircle size={24} color="var(--accent-primary)" />
                </div>
              )}
            </div>
            <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

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
                  <UserCircle size={18} /> Edit Profile
                </Link>
                <div style={dividerMenuStyle} />
                <button onClick={handleLogout} style={logoutBtnStyle}>
                  <LogOut size={18} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

const headerStyle: React.CSSProperties = {
  height: '72px',
  backgroundColor: 'var(--bg-primary)',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: window.innerWidth <= 768 ? '0 16px' : '0 32px',
  position: 'sticky',
  top: 0,
  zIndex: 90,
  marginLeft: window.innerWidth <= 1024 ? '0' : '260px',
  transition: 'margin-left 0.3s ease',
};

const searchContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  backgroundColor: 'var(--bg-secondary)',
  padding: '10px 16px',
  borderRadius: 'var(--radius-lg)',
  width: '400px',
  border: '1px solid var(--border-color)',
};

const searchInputStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-primary)',
  width: '100%',
  outline: 'none',
  fontSize: '0.875rem',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const iconButtonStyle: React.CSSProperties = {
  position: 'relative',
  padding: '8px',
  borderRadius: 'var(--radius-md)',
  transition: 'background 0.2s ease',
};

const notificationBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '6px',
  right: '6px',
  width: '8px',
  height: '8px',
  backgroundColor: 'var(--accent-primary)',
  borderRadius: '50%',
  border: '2px solid var(--bg-primary)',
};

const dividerStyle: React.CSSProperties = {
  width: '1px',
  height: '24px',
  backgroundColor: 'var(--border-color)',
  margin: '0 8px',
};

const userProfileStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: 'var(--radius-md)',
  transition: 'background 0.2s ease',
};

const userInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
};

const userNameStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const userRoleStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--accent-primary)',
  fontWeight: 500,
};

const avatarStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid var(--bg-tertiary)',
};

const creditBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--accent-glow)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const creditTextStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 700,
  color: 'var(--accent-primary)',
};

const AssistantButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  border: '1px solid var(--accent-glow)',
  borderRadius: '20px',
  color: 'var(--accent-primary)',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  marginRight: '8px',
};
const avatarWrapperStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: '2px solid var(--bg-tertiary)',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const avatarFallbackStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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

const dividerMenuStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'var(--border-color)',
  margin: '8px',
};

const logoutBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: '10px',
  color: '#ef4444',
  textDecoration: 'none',
  fontSize: '0.875rem',
  transition: 'all 0.2s ease',
  textAlign: 'left',
  border: 'none',
  background: 'none',
  width: '100%',
  cursor: 'pointer',
};
