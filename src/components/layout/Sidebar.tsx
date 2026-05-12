import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  User, 
  FileText, 
  FileEdit, 
  Send, 
  Bookmark, 
  Settings,
  LogOut,
  Sparkles,
  Wallet,
  GraduationCap,
  Award
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const navGroups = [
  {
    title: 'Pathway',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Briefcase, label: 'Opportunities', path: '/opportunities' },
      { icon: Briefcase, label: 'Jobs', path: '/jobs' },
      { icon: Bookmark, label: 'Saved Items', path: '/saved' },
    ]
  },
  {
    title: 'CV Builder',
    items: [
      { icon: FileText, label: 'CV Builder', path: '/cv-builder' },
      { icon: FileEdit, label: 'Cover Letter', path: '/cover-letter' },
    ]
  },
  {
    title: 'Grant Builder',
    items: [
      { icon: Send, label: 'Grant Builder', path: '/grant-builder' },
    ]
  },
  {
    title: 'Account',
    items: [
      { icon: Wallet, label: 'Wallet & Credits', path: '/wallet' },
      { icon: User, label: 'Profile', path: '/profile' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ]
  }
];

import logo from '../../assets/images/logo.png';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In a real app, clear tokens here
    navigate('/login');
  };

  return (
    <aside style={sidebarStyle}>
      <Link to="/" style={logoContainerStyle}>
        <img src={logo} alt="PATHEW Logo" style={{ height: '40px', objectFit: 'contain' }} />
      </Link>

      <nav style={navStyle}>
        {navGroups.map((group, idx) => (
          <div key={idx} style={groupStyle}>
            <div style={groupTitleStyle}>{group.title}</div>
            {group.items.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path}
                style={({ isActive }) => ({
                  ...navItemStyle,
                  backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                })}
              >
                <item.icon size={20} />
                <span style={{ fontWeight: 500 }}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div style={footerStyle}>
        <button style={logoutButtonStyle} onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const sidebarStyle: React.CSSProperties = {
  width: '260px',
  height: '100vh',
  backgroundColor: 'var(--bg-secondary)',
  borderRight: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 100,
};

const logoContainerStyle: React.CSSProperties = {
  padding: '24px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const logoIconStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  backgroundColor: 'var(--bg-tertiary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'var(--shadow-sm)',
};

const logoTextStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 800,
  color: 'var(--text-primary)',
  letterSpacing: '-0.025em',
};

const navStyle: React.CSSProperties = {
  padding: '12px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  overflowY: 'auto',
};

const groupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const groupTitleStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: 'var(--text-muted)',
  padding: '0 16px',
  marginBottom: '4px',
  letterSpacing: '0.05em',
};

const navItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  transition: 'all 0.2s ease',
  textDecoration: 'none',
};

const footerStyle: React.CSSProperties = {
  padding: '24px',
  borderTop: '1px solid var(--border-color)',
};

const logoutButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  color: 'var(--text-secondary)',
  width: '100%',
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  transition: 'all 0.2s ease',
};
