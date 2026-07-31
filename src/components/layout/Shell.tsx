import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AssistantProvider, useAssistant } from '../../context/AssistantContext';
import { AssistantPanel } from '../ai/AssistantPanel';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { isAssistantPanelOpen } = useAssistant();

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 1024;
  const isSmallMobile = windowWidth <= 768;

  const sidebarWidth = isMobile ? 0 : (isSidebarCollapsed ? 0 : 260);
  const assistantWidth = (isAssistantPanelOpen && !isMobile) ? 360 : 0;

  const contentStyle: React.CSSProperties = {
    padding: isSmallMobile ? '16px' : '32px',
    marginLeft: `${sidebarWidth}px`,
    flex: 1,
    transition: 'margin-left 0.3s ease',
  };

  return (
    <div style={shellStyle}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isCollapsed={isSidebarCollapsed}
      />
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{...overlayStyle, display: isMobile ? 'block' : 'none'}}
        />
      )}

      <div style={{ ...mainContainerStyle, marginRight: assistantWidth, transition: 'margin-right 0.3s ease' }}>
        <TopBar 
          onMenuClick={() => setIsSidebarOpen(true)} 
          sidebarWidth={sidebarWidth}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
        />
        <main style={contentStyle}>
          {children}
        </main>
      </div>
    </div>
  );
};

const shellStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: 'var(--bg-primary)',
  position: 'relative',
  overflowX: 'hidden',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(4px)',
  zIndex: 95,
};

const mainContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};
