import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Settings, 
  User, 
  Bell, 
  Lock, 
  Sparkles, 
  CreditCard, 
  Globe, 
  ShieldCheck,
  Mail,
  Smartphone
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'ai', label: 'AI Preferences', icon: Sparkles },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Settings</h1>
        <p style={subtitleStyle}>Manage your PATHEW account and platform preferences.</p>
      </header>

      <div style={layoutStyle}>
        {/* Sidebar Tabs */}
        <aside style={sidebarStyle}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...tabButtonStyle,
                backgroundColor: activeTab === tab.id ? 'var(--bg-tertiary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div style={contentStyle}>
          {activeTab === 'profile' && (
            <Card title="Profile Information" icon={User}>
              <div style={formGridStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" defaultValue="Alex Johnson" style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" defaultValue="alex.j@example.com" style={inputStyle} />
                </div>
                <div style={{ ...formGroupStyle, gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Bio</label>
                  <textarea 
                    defaultValue="Passionate about product design and solving complex user problems." 
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} 
                  />
                </div>
              </div>
              <Button style={{ marginTop: '16px' }}>Save Changes</Button>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card title="Notification Preferences" icon={Bell}>
              <div style={notificationListStyle}>
                <NotificationToggle 
                  icon={Mail} 
                  title="Email Notifications" 
                  desc="Receive updates about new matches and document reviews." 
                  enabled={true} 
                />
                <NotificationToggle 
                  icon={Smartphone} 
                  title="Push Notifications" 
                  desc="Get instant alerts on your desktop and mobile device." 
                  enabled={false} 
                />
                <NotificationToggle 
                  icon={Globe} 
                  title="Newsletter" 
                  desc="Stay updated with our weekly tips and success stories." 
                  enabled={true} 
                />
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card title="Security & Privacy" icon={Lock}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Current Password</label>
                <input type="password" placeholder="••••••••" style={inputStyle} />
              </div>
              <div style={formGridStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>New Password</label>
                  <input type="password" placeholder="••••••••" style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Confirm Password</label>
                  <input type="password" placeholder="••••••••" style={inputStyle} />
                </div>
              </div>
              <div style={securityBannerStyle}>
                <ShieldCheck size={20} color="var(--accent-primary)" />
                <div>
                  <p style={{ fontWeight: 600 }}>Two-Factor Authentication</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Secure your account with an additional security layer.</p>
                </div>
                <Button variant="outline" size="sm" style={{ marginLeft: 'auto' }}>Enable</Button>
              </div>
              <Button style={{ marginTop: '24px' }}>Update Security</Button>
            </Card>
          )}

          {activeTab === 'ai' && (
            <Card title="Pathew Assistance Settings" icon={Sparkles}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Default Tone of Voice</label>
                <select style={selectStyle}>
                  <option>Professional & Academic</option>
                  <option>Creative & Narrative</option>
                  <option>Concise & Impactful</option>
                  <option>Casual & Friendly</option>
                </select>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Preferred Language</label>
                <select style={selectStyle}>
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Spanish</option>
                </select>
              </div>
              <div style={toggleItemStyle}>
                <div>
                  <p style={{ fontWeight: 600 }}>Auto-Save AI History</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Save all generated content to your account history automatically.</p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
            </Card>
          )}

          {activeTab === 'billing' && (
            <Card title="Billing & Subscription" icon={CreditCard}>
              <div style={planCardStyle}>
                <div>
                  <p style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Current Plan</p>
                  <h3 style={{ fontSize: '1.5rem', marginTop: '4px' }}>Pro Professional</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Next renewal: June 12, 2026</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '1.5rem' }}>$29<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span></h3>
                  <Button variant="outline" size="sm" style={{ marginTop: '8px' }}>Change Plan</Button>
                </div>
              </div>
              <div style={{ marginTop: '32px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '1rem' }}>Payment Method</h4>
                <div style={paymentMethodStyle}>
                  <CreditCard size={20} color="var(--text-secondary)" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600 }}>Visa ending in 4242</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Expires 12/26</p>
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationToggle = ({ icon: Icon, title, desc, enabled }: any) => (
  <div style={toggleItemStyle}>
    <div style={iconBoxStyle}>
      <Icon size={20} color="var(--accent-primary)" />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontWeight: 600 }}>{title}</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{desc}</p>
    </div>
    <input type="checkbox" defaultChecked={enabled} />
  </div>
);

// Styles
const containerStyle: React.CSSProperties = { 
  maxWidth: '1000px', 
  margin: '0 auto', 
  padding: '40px 20px' 
};

const headerStyle: React.CSSProperties = { 
  marginBottom: '40px' 
};

const titleStyle: React.CSSProperties = { 
  fontSize: '2.75rem', 
  fontWeight: 800,
  marginBottom: '8px',
  letterSpacing: '-0.025em'
};

const subtitleStyle: React.CSSProperties = { 
  color: 'var(--text-secondary)',
  fontSize: '1.125rem'
};

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '240px 1fr',
  gap: '40px',
  alignItems: 'start'
};

const sidebarStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const contentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
};

const tabButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  fontSize: '0.9375rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'left'
};

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px'
};

const formGroupStyle: React.CSSProperties = { 
  marginBottom: '20px' 
};

const labelStyle: React.CSSProperties = { 
  display: 'block', 
  marginBottom: '8px', 
  fontWeight: 600,
  fontSize: '0.875rem',
  color: 'var(--text-secondary)'
};

const inputStyle: React.CSSProperties = { 
  width: '100%', 
  padding: '12px 16px', 
  backgroundColor: 'var(--bg-primary)', 
  border: '1px solid var(--border-color)', 
  borderRadius: 'var(--radius-md)', 
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none'
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer'
};

const toggleItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-color)',
  marginBottom: '12px'
};

const iconBoxStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const notificationListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const securityBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '20px',
  backgroundColor: 'rgba(245, 158, 11, 0.05)',
  border: '1px solid rgba(245, 158, 11, 0.2)',
  borderRadius: 'var(--radius-lg)',
  marginTop: '24px'
};

const planCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border-color)'
};

const paymentMethodStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  backgroundColor: 'var(--bg-primary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-color)'
};