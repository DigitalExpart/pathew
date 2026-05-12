import React from 'react';
import { Search, Bell, HelpCircle, ChevronDown, Coins } from 'lucide-react';
import { mockUser } from '../../data/mockData';

export const TopBar: React.FC = () => {
  return (
    <header style={headerStyle}>
      <div style={searchContainerStyle}>
        <Search size={18} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Search opportunities, documents..." 
          style={searchInputStyle}
        />
      </div>

      <div style={actionsStyle}>
        <button style={iconButtonStyle}>
          <HelpCircle size={20} color="var(--text-secondary)" />
        </button>
        <button style={iconButtonStyle}>
          <div style={notificationBadgeStyle}></div>
          <Bell size={20} color="var(--text-secondary)" />
        </button>

        <div style={creditBadgeStyle}>
          <Coins size={16} color="var(--accent-primary)" />
          <span style={creditTextStyle}>1,250 Credits</span>
        </div>
        
        <div style={dividerStyle}></div>

        <div style={userProfileStyle}>
          <div style={userInfoStyle}>
            <span style={userNameStyle}>{mockUser.name}</span>
            <span style={userRoleStyle}>Pro Plan</span>
          </div>
          <img 
            src={mockUser.avatar} 
            alt={mockUser.name} 
            style={avatarStyle}
          />
          <ChevronDown size={16} color="var(--text-muted)" />
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
  padding: '0 32px',
  position: 'sticky',
  top: 0,
  zIndex: 90,
  marginLeft: '260px',
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
