import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AssistantProvider } from '../../context/AssistantContext';
import { AssistantPanel } from '../ai/AssistantPanel';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 1024;
  const isSmallMobile = windowWidth <= 768;

  const contentStyle: React.CSSProperties = {
    padding: isSmallMobile ? '16px' : '32px',
    marginLeft: isMobile ? '0' : '260px',
    flex: 1,
    transition: 'margin-left 0.3s ease',
  };

  return (
    <div style={shellStyle}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{...overlayStyle, display: isMobile ? 'block' : 'none'}}
        />
      )}

      <AssistantProvider>
        <div style={mainContainerStyle}>
          <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
          <main style={contentStyle}>
            {children}
          </main>
        </div>
        <AssistantPanel />
      </AssistantProvider>
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
  minWidth: 0, // Prevent flex items from overflowing
};
