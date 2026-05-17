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
  Wallet,
  Clock,
  X,
  ShieldAlert
} from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/images/logo.png';



interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { signOut, profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navGroups = [
    {
      title: 'PATHWAY',
      items: [
        { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
        { icon: Clock, label: t('nav.applicationTracker'), path: '/preparation' },
        { icon: Briefcase, label: t('nav.opportunities'), path: '/opportunities' },
        { icon: Briefcase, label: t('nav.jobs'), path: '/jobs' },
        { icon: Bookmark, label: t('nav.savedItems'), path: '/saved' },
      ]
    },
    {
      title: 'CV BUILDER',
      items: [
        { icon: FileText, label: t('nav.cvBuilder'), path: '/cv-builder' },
        { icon: FileEdit, label: t('nav.coverLetter'), path: '/cover-letter' },
      ]
    },
    {
      title: 'GRANT BUILDER',
      items: [
        { icon: Send, label: t('nav.grantBuilder'), path: '/grant-builder' },
      ]
    },
    ...(profile?.role === 'sub_admin' ? [
      {
        title: 'MANAGEMENT',
        items: [
          { icon: ShieldAlert, label: 'Access Sub Admin', path: '/sub-admin' }
        ]
      }
    ] : []),
    {
      title: 'ACCOUNT',
      items: [
        { icon: Wallet, label: t('nav.wallet'), path: '/wallet' },
        { icon: User, label: t('nav.profile'), path: '/career-profile' },
        { icon: Settings, label: t('nav.settings'), path: '/settings' },
      ]
    }
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isMobile = window.innerWidth <= 1024;

  return (
    <aside style={{
      ...sidebarStyle,
      transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      visibility: isMobile && !isOpen ? 'hidden' : 'visible',
    }}>
      <div style={logoContainerStyle}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }} onClick={onClose}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </Link>
        {isMobile && (
          <button onClick={onClose} style={closeButtonStyle}>
            <X size={20} />
          </button>
        )}
      </div>

      <nav style={navStyle}>
        {navGroups.map((group, idx) => (
          <div key={idx} style={groupStyle}>
            <div style={groupTitleStyle}>{group.title}</div>
            {group.items.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path}
                onClick={onClose}
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
          <span>{t('nav.logout')}</span>
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
  transition: 'transform 0.3s ease, visibility 0.3s',
};

const closeButtonStyle: React.CSSProperties = {
  marginLeft: 'auto',
  color: 'var(--text-secondary)',
  padding: '8px',
};

const logoContainerStyle: React.CSSProperties = {
  padding: '24px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
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
