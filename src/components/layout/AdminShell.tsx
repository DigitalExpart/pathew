import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Menu } from 'lucide-react';
import logo from '../../assets/images/logo.svg';

export const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#020617', flexDirection: 'column' }}>
      {/* Mobile Header */}
      {isMobile && (
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logo} alt="PATHEW" style={{ height: '28px' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', color: '#e2e8f0', padding: '4px', cursor: 'pointer' }}
          >
            <Menu size={24} />
          </button>
        </header>
      )}

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <AdminSidebar 
          isMobile={isMobile} 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        <main style={{ 
          flex: 1, 
          marginLeft: isMobile ? '0' : '240px', 
          padding: isMobile ? '16px' : '32px', 
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};
