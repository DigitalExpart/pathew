import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Bell, 
  Search, 
  Trash2, 
  CheckCheck, 
  MessageSquare, 
  Zap, 
  Star,
  Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Notification {
  id: string;
  title: string;
  description: string;
  created_at: string;
  type: 'opportunity' | 'system' | 'message' | 'achievement';
  is_read: boolean;
}

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        // Create a default welcome notification if they have none
        const welcomeNotif = {
          user_id: user.id,
          title: 'Welcome to Pathew! 🎉',
          description: 'Your profile is set up. Explore new opportunities matched just for you.',
          type: 'system',
          is_read: false
        };
        const { data: newData, error: insertError } = await supabase
          .from('notifications')
          .insert(welcomeNotif)
          .select();
          
        if (!insertError && newData) {
          setNotifications(newData);
        } else {
          setNotifications([]);
        }
      } else {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const filteredNotifications = notifications
    .filter(n => filter === 'unread' ? !n.is_read : true)
    .filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'opportunity': return <Zap size={18} color="var(--accent-primary)" />;
      case 'message': return <MessageSquare size={18} color="#3b82f6" />;
      case 'achievement': return <Star size={18} color="#eab308" />;
      default: return <Bell size={18} color="var(--text-muted)" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  // Dynamic Responsive Styles
  const containerStyle: React.CSSProperties = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: isMobile ? '16px' : '0',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'flex-end',
    marginBottom: isMobile ? '20px' : '32px',
    gap: isMobile ? '16px' : '0',
  };

  const filterBarStyle: React.CSSProperties = {
    padding: isMobile ? '12px 16px' : '0 24px',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    backgroundColor: 'var(--bg-secondary)',
    gap: isMobile ? '12px' : '0',
  };

  const filterButtonStyle: React.CSSProperties = {
    padding: isMobile ? '10px 0' : '16px 0',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  };

  const countBadgeStyle: React.CSSProperties = {
    padding: '2px 6px',
    backgroundColor: 'var(--accent-primary)',
    color: '#000',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 700,
  };

  const searchContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--bg-primary)',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    marginBottom: isMobile ? '8px' : '0',
  };

  const searchInputStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    width: '100%',
  };

  const listStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  const notificationItemStyle: React.CSSProperties = {
    padding: isMobile ? '16px 16px' : '20px 24px',
    display: 'flex',
    gap: isMobile ? '12px' : '20px',
    borderBottom: '1px solid var(--border-color)',
    transition: 'background 0.2s',
    cursor: 'pointer',
    position: 'relative',
  };

  const iconBoxStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const timeStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
  };

  const actionsContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: 'auto',
    alignSelf: 'center',
  };

  const unreadDotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--accent-primary)',
    borderRadius: '50%',
  };

  const moreButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'background 0.2s',
  };

  const emptyStateStyle: React.CSSProperties = {
    padding: isMobile ? '40px 16px' : '80px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, marginBottom: '8px' }}>{t('notifications.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('notifications.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={notifications.every(n => n.is_read)} style={{ width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
            <CheckCheck size={16} style={{ marginRight: '8px' }} /> {t('notifications.markAllRead')}
          </Button>
        </div>
      </header>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={filterBarStyle}>
          <div style={{ display: 'flex', gap: '24px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
            <button 
              style={{ ...filterButtonStyle, borderBottomColor: filter === 'all' ? 'var(--accent-primary)' : 'transparent', color: filter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)' }}
              onClick={() => setFilter('all')}
            >
              {t('notifications.tabs.all')}
            </button>
            <button 
              style={{ ...filterButtonStyle, borderBottomColor: filter === 'unread' ? 'var(--accent-primary)' : 'transparent', color: filter === 'unread' ? 'var(--text-primary)' : 'var(--text-muted)' }}
              onClick={() => setFilter('unread')}
            >
              {t('notifications.tabs.unread')}
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span style={countBadgeStyle}>{notifications.filter(n => !n.is_read).length}</span>
              )}
            </button>
          </div>
          <div style={{ ...searchContainerStyle, width: isMobile ? '100%' : 'auto' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder={t('notifications.filter')} 
              style={searchInputStyle} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={listStyle}>
          {loading ? (
            <div style={emptyStateStyle}>
              <div className="loading-spinner" style={{ marginBottom: '16px' }} />
              <p>{t('common.loading')}</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((noti) => (
              <div 
                key={noti.id} 
                style={{ ...notificationItemStyle, backgroundColor: noti.is_read ? 'transparent' : 'rgba(245, 158, 11, 0.03)' }}
                onClick={() => !noti.is_read && markAsRead(noti.id)}
              >
                <div style={iconBoxStyle}>
                  {getTypeIcon(noti.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '6px', gap: isMobile ? '4px' : '0' }}>
                    <h3 style={{ fontSize: isMobile ? '0.9375rem' : '1rem', fontWeight: noti.is_read ? 500 : 700, paddingRight: isMobile ? '0' : '16px', lineHeight: 1.3 }}>{noti.title}</h3>
                    <span style={timeStyle}><Clock size={12} /> {formatRelativeTime(noti.created_at)}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: '1.5' }}>{noti.description}</p>
                </div>
                <div style={actionsContainerStyle}>
                  {!noti.is_read && <div style={unreadDotStyle} />}
                  <button 
                    style={moreButtonStyle} 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(noti.id);
                    }}
                  >
                    <Trash2 size={16} color="var(--text-muted)" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={emptyStateStyle}>
              <Bell size={48} color="var(--bg-tertiary)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: isMobile ? '1.125rem' : '1.25rem', fontWeight: 700, marginBottom: '8px' }}>{t('notifications.noNotifications')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('notifications.noNotificationsDesc')}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
