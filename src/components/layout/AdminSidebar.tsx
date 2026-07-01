import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { LayoutDashboard, Users, CreditCard, ArrowLeftRight, FileText, Bot, Settings, LogOut, ArrowLeft, Megaphone, Star, Rss, Ticket, X } from 'lucide-react';
import logo from '../../assets/images/logo.svg';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions' },
  { icon: ArrowLeftRight, label: 'Transactions', path: '/admin/transactions' },
  { icon: Ticket, label: 'Coupons', path: '/admin/coupons' },
  { icon: Megaphone, label: 'Opportunities', path: '/admin/opportunities' },
  { icon: Rss, label: 'RSS Sources', path: '/admin/rss-sources' },
  { icon: FileText, label: 'Documents', path: '/admin/documents' },
  { icon: Star, label: 'Reviews', path: '/admin/reviews' },
  { icon: Bot, label: 'AI Usage', path: '/admin/ai-usage' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

interface AdminSidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isMobile, isOpen, onClose }) => {
  const { adminLogout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => { adminLogout(); navigate('/admin'); };

  const sidebarStyle: React.CSSProperties = {
    width: '240px', height: '100vh', backgroundColor: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 100,
    transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
    transition: 'transform 0.3s ease-in-out',
  };

  return (
    <>
      {isMobile && isOpen && (
        <div 
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90 }}
        />
      )}
      <aside style={sidebarStyle}>
        <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/admin/dashboard" onClick={isMobile ? onClose : undefined}><img src={logo} alt="PATHEW" style={{ height: '32px' }} /></Link>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin</span>
          </div>
          {isMobile && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          )}
        </div>

        <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} onClick={isMobile ? onClose : undefined} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.15s',
              backgroundColor: isActive ? 'rgba(245,158,11,0.1)' : 'transparent',
              color: isActive ? '#f59e0b' : '#94a3b8',
            })}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', color: '#64748b', fontSize: '0.8125rem', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Site
          </Link>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', color: '#ef4444', fontSize: '0.8125rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
