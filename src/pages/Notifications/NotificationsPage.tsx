import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Bell, 
  Search, 
  Filter, 
  Trash2, 
  CheckCheck, 
  MessageSquare, 
  Briefcase, 
  Zap, 
  Star,
  MoreVertical,
  Clock
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'opportunity' | 'system' | 'message' | 'achievement';
  isRead: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Opportunity Match',
    description: 'We found a 95% match for a Senior Frontend Developer role at TechFlow Inc.',
    time: '2 hours ago',
    type: 'opportunity',
    isRead: false
  },
  {
    id: '2',
    title: 'Profile Boosted',
    description: 'Your recent profile updates have increased your visibility by 40%.',
    time: '5 hours ago',
    type: 'achievement',
    isRead: false
  },
  {
    id: '3',
    title: 'Credits Added',
    description: 'Your purchase of 500 credits was successful. Your balance is now 1,500.',
    time: 'Yesterday',
    type: 'system',
    isRead: true
  },
  {
    id: '4',
    title: 'Message from Assistant',
    description: 'I have finished analyzing your CV. Click here to see the suggested improvements.',
    time: 'Yesterday',
    type: 'message',
    isRead: true
  },
  {
    id: '5',
    title: 'Grant Opportunity',
    description: 'A new Innovation Grant in your field is now accepting applications.',
    time: '2 days ago',
    type: 'opportunity',
    isRead: true
  }
];

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'opportunity': return <Zap size={18} color="var(--accent-primary)" />;
      case 'message': return <MessageSquare size={18} color="#3b82f6" />;
      case 'achievement': return <Star size={18} color="#eab308" />;
      default: return <Bell size={18} color="var(--text-muted)" />;
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Notifications</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Stay updated with your matches and activity.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck size={16} style={{ marginRight: '8px' }} /> Mark all as read
          </Button>
        </div>
      </header>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={filterBarStyle}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <button 
              style={{ ...filterButtonStyle, borderBottomColor: filter === 'all' ? 'var(--accent-primary)' : 'transparent', color: filter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)' }}
              onClick={() => setFilter('all')}
            >
              All Notifications
            </button>
            <button 
              style={{ ...filterButtonStyle, borderBottomColor: filter === 'unread' ? 'var(--accent-primary)' : 'transparent', color: filter === 'unread' ? 'var(--text-primary)' : 'var(--text-muted)' }}
              onClick={() => setFilter('unread')}
            >
              Unread
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span style={countBadgeStyle}>{notifications.filter(n => !n.isRead).length}</span>
              )}
            </button>
          </div>
          <div style={searchContainerStyle}>
            <Search size={16} color="var(--text-muted)" />
            <input type="text" placeholder="Filter notifications..." style={searchInputStyle} />
          </div>
        </div>

        <div style={listStyle}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((noti) => (
              <div key={noti.id} style={{ ...notificationItemStyle, backgroundColor: noti.isRead ? 'transparent' : 'rgba(245, 158, 11, 0.03)' }}>
                <div style={iconBoxStyle}>
                  {getTypeIcon(noti.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: noti.isRead ? 500 : 700 }}>{noti.title}</h3>
                    <span style={timeStyle}><Clock size={12} /> {noti.time}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{noti.description}</p>
                </div>
                <div style={actionsContainerStyle}>
                  {!noti.isRead && <div style={unreadDotStyle} />}
                  <button style={moreButtonStyle} onClick={() => deleteNotification(noti.id)}>
                    <Trash2 size={16} color="var(--text-muted)" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={emptyStateStyle}>
              <Bell size={48} color="var(--bg-tertiary)" style={{ marginBottom: '16px' }} />
              <h3>No notifications found</h3>
              <p style={{ color: 'var(--text-muted)' }}>We'll notify you when something important happens.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  marginBottom: '32px',
};

const filterBarStyle: React.CSSProperties = {
  padding: '0 24px',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'var(--bg-secondary)',
};

const filterButtonStyle: React.CSSProperties = {
  padding: '16px 0',
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
};

const searchInputStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  outline: 'none',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  width: '150px',
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const notificationItemStyle: React.CSSProperties = {
  padding: '20px 24px',
  display: 'flex',
  gap: '20px',
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
};

const actionsContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
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
  padding: '80px 20px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};
