import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Bell,
  Lock,
  Sparkles,
  CreditCard,
  Globe,
  ShieldCheck,
  Mail,
  Smartphone,
  Shield,
  CheckSquare,
  AlertTriangle,
  History,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notifications');
  const [settings, setSettings] = useState({
    email: true,
    push: false,
    newsletter: true
  });
  const [assistantSettings, setAssistantSettings] = useState({
    tone: 'Professional & Academic',
    language: 'English (US)',
    autoSave: true
  });
  const [marketingPrefs, setMarketingPrefs] = useState({
    opportunityAlerts: true,
    productUpdates: true
  });
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (profile?.notification_settings) {
      setSettings(profile.notification_settings);
    }
    if (profile?.assistant_settings) {
      setAssistantSettings(profile.assistant_settings);
    }
    if (profile?.marketing_preferences) {
      setMarketingPrefs(profile.marketing_preferences);
    }
    fetchBillingHistory();
  }, [profile]);

  const fetchBillingHistory = async () => {
    if (!user) return;
    setBillingLoading(true);
    try {
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setBillingHistory(data || []);
    } catch (error) {
      console.error('Error fetching billing history:', error);
    } finally {
      setBillingLoading(false);
    }
  };

  const updateProfileSettings = async (updates: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      await refreshProfile();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleToggle = (key: string) => {
    const newSettings = { ...settings, [key]: !settings[key as keyof typeof settings] };
    setSettings(newSettings);
    updateProfileSettings({ notification_settings: newSettings });
  };

  const handleAssistantChange = (key: string, value: any) => {
    const newAssistantSettings = { ...assistantSettings, [key]: value };
    setAssistantSettings(newAssistantSettings);
    updateProfileSettings({ assistant_settings: newAssistantSettings });
  };

  const handleMarketingToggle = (key: string) => {
    const newMarketingPrefs = { ...marketingPrefs, [key]: !marketingPrefs[key as keyof typeof marketingPrefs] };
    setMarketingPrefs(newMarketingPrefs);
    updateProfileSettings({ marketing_preferences: newMarketingPrefs });
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [passwordError, setPasswordError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);
        
        if (profileError) throw profileError;

        await signOut();
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account: ' + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus('error');
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordStatus('error');
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    setPasswordStatus('idle');

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordStatus('success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordStatus('idle'), 3000);
    } catch (error: any) {
      setPasswordStatus('error');
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabs = [
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    { id: 'security', label: t('settings.tabs.security'), icon: Lock },
    { id: 'Assistant', label: t('assistant.title'), icon: Sparkles },
    { id: 'billing', label: t('settings.tabs.billing'), icon: CreditCard },
    { id: 'privacy', label: t('settings.tabs.privacy'), icon: Shield },
    { id: 'preferences', label: t('settings.tabs.preferences'), icon: CheckSquare },
    { id: 'account', label: t('settings.tabs.account'), icon: AlertTriangle },
  ];

  // Dynamic Responsive Styles
  const containerStyle: React.CSSProperties = { 
    maxWidth: '1000px', 
    margin: '0 auto', 
    padding: isMobile ? '16px' : '40px 20px' 
  };

  const headerStyle: React.CSSProperties = { 
    marginBottom: isMobile ? '24px' : '40px' 
  };

  const titleStyle: React.CSSProperties = { 
    fontSize: isMobile ? '1.75rem' : '2.75rem', 
    fontWeight: 800,
    marginBottom: '8px',
    letterSpacing: '-0.025em'
  };

  const subtitleStyle: React.CSSProperties = { 
    color: 'var(--text-secondary)',
    fontSize: isMobile ? '0.9375rem' : '1.125rem'
  };

  const layoutStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '240px 1fr',
    gap: isMobile ? '24px' : '40px',
    alignItems: 'start'
  };

  const sidebarStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'row' : 'column',
    gap: '8px',
    overflowX: isMobile ? 'auto' : 'visible',
    paddingBottom: isMobile ? '8px' : '0',
    margin: isMobile ? '0 -16px' : '0',
    padding: isMobile ? '0 16px' : '0',
    whiteSpace: isMobile ? 'nowrap' : 'normal',
    scrollbarWidth: 'none',
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
    padding: isMobile ? '8px 16px' : '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    fontSize: '0.9375rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    flexShrink: isMobile ? 0 : 1,
  };

  const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? '16px' : '20px'
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
    justifyContent: 'center',
    flexShrink: 0
  };

  const dividerMenuStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: 'var(--border-color)',
    margin: '16px 0'
  };

  const notificationListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const securityBannerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: 'var(--radius-lg)',
    marginTop: '24px',
    width: '100%'
  };

  const planCardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    padding: '24px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border-color)',
    gap: isMobile ? '16px' : '0'
  };

  const paymentMethodStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)'
  };

  const tableWrapperStyle: React.CSSProperties = {
    width: '100%',
    overflowX: 'auto',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
    minWidth: '500px',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  };

  const statusBadgeStyle: React.CSSProperties = {
    padding: '4px 8px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
  };

  const checkboxStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    marginTop: '2px',
    accentColor: 'var(--accent-primary)',
  };

  const NotificationToggle = ({ icon: Icon, title, desc, enabled, onToggle }: any) => (
    <div style={toggleItemStyle} onClick={onToggle} className="cursor-pointer">
      <div style={iconBoxStyle}>
        <Icon size={20} color="var(--accent-primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: isMobile ? '0.875rem' : '1rem' }} className="truncate">{title}</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <div style={{
        width: '44px',
        height: '24px',
        backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
        borderRadius: '12px',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: enabled ? 'flex-end' : 'flex-start',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        flexShrink: 0
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          backgroundColor: enabled ? '#000' : 'var(--text-muted)',
          borderRadius: '50%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>{t('settings.title')}</h1>
        <p style={subtitleStyle}>{t('settings.subtitle')}</p>
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
          {activeTab === 'notifications' && (
            <Card title={t('settings.notifications.title')} icon={Bell} style={{ padding: isMobile ? '16px' : '24px' }}>
              <div style={notificationListStyle}>
                <NotificationToggle 
                  icon={Mail} 
                  title={t('settings.notifications.email')}
                  desc={t('settings.notifications.emailDesc')}
                  enabled={settings.email} 
                  onToggle={() => handleToggle('email')}
                />
                <NotificationToggle 
                  icon={Smartphone} 
                  title={t('settings.notifications.push')}
                  desc={t('settings.notifications.pushDesc')}
                  enabled={settings.push} 
                  onToggle={() => handleToggle('push')}
                />
                <NotificationToggle 
                  icon={Globe} 
                  title={t('settings.notifications.newsletter')}
                  desc={t('settings.notifications.newsletterDesc')}
                  enabled={settings.newsletter} 
                  onToggle={() => handleToggle('newsletter')}
                />
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card title={t('settings.security.title')} icon={Lock} style={{ padding: isMobile ? '16px' : '24px' }}>
              <form onSubmit={handleUpdatePassword}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>{t('settings.security.currentPassword')}</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    style={inputStyle}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>
                <div style={formGridStyle}>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>{t('settings.security.newPassword')}</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      style={inputStyle}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                  </div>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>{t('settings.security.confirmPassword')}</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      style={inputStyle}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                {passwordStatus === 'error' && (
                  <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <XCircle size={16} /> {passwordError}
                  </div>
                )}

                <div style={securityBannerStyle}>
                  <ShieldCheck size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: isMobile ? '0.875rem' : '1rem' }}>{t('settings.security.twoFactor')}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('settings.security.twoFactorDesc')}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    type="button" 
                    style={{ 
                      marginLeft: isMobile ? '0' : 'auto',
                      width: isMobile ? '100%' : 'auto',
                      marginTop: isMobile ? '8px' : '0',
                      justifyContent: 'center'
                    }}
                  >
                    {t('settings.security.enable')}
                  </Button>
                </div>
                <Button 
                  style={{ marginTop: '24px', minWidth: '160px', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }} 
                  disabled={passwordLoading}
                  type="submit"
                >
                  {passwordLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={18} className="animate-spin" /> Updating...
                    </span>
                  ) : passwordStatus === 'success' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} /> {t('common.saved', 'Updated!')}
                    </span>
                  ) : t('settings.security.updateSecurity')}
                </Button>
              </form>
            </Card>
          )}

          {activeTab === 'Assistant' && (
            <Card title={t('assistant.title')} icon={Sparkles} style={{ padding: isMobile ? '16px' : '24px' }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>{t('settings.assistant.tone')}</label>
                <select 
                  style={selectStyle}
                  value={assistantSettings.tone}
                  onChange={(e) => handleAssistantChange('tone', e.target.value)}
                >
                  <option>Professional & Academic</option>
                  <option>Creative & Narrative</option>
                  <option>Concise & Impactful</option>
                  <option>Casual & Friendly</option>
                </select>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>{t('settings.assistant.language')}</label>
                <select 
                  style={selectStyle}
                  value={assistantSettings.language}
                  onChange={(e) => handleAssistantChange('language', e.target.value)}
                >
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Spanish</option>
                </select>
              </div>
              <div style={toggleItemStyle} onClick={() => handleAssistantChange('autoSave', !assistantSettings.autoSave)} className="cursor-pointer">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: isMobile ? '0.875rem' : '1rem' }}>{t('settings.assistant.autoSave')}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('settings.assistant.autoSaveDesc')}</p>
                </div>
                <div style={{
                  width: '44px',
                  height: '24px',
                  backgroundColor: assistantSettings.autoSave ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  borderRadius: '12px',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: assistantSettings.autoSave ? 'flex-end' : 'flex-start',
                  transition: 'all 0.3s ease',
                  flexShrink: 0
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: assistantSettings.autoSave ? '#000' : 'var(--text-muted)',
                    borderRadius: '50%'
                  }} />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'billing' && (
            <Card title={t('settings.billing.title')} icon={CreditCard} style={{ padding: isMobile ? '16px' : '24px' }}>
              <div style={planCardStyle}>
                <div>
                  <p style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('settings.billing.currentPlan')}</p>
                  <h3 style={{ fontSize: '1.5rem', marginTop: '4px' }}>{profile?.subscription_plan || t('profile.freePlan', 'Free Plan')}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('settings.billing.nextRenewal')} {profile?.renewal_date || 'N/A'}</p>
                </div>
                <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                  <h3 style={{ fontSize: '1.5rem' }}>{profile?.subscription_plan === 'Professional' ? '$29' : profile?.subscription_plan === 'Elite' ? '$99' : '$0'}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span></h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    style={{ marginTop: '8px', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
                    onClick={() => navigate('/wallet')}
                  >
                    {t('settings.billing.changePlan')}
                  </Button>
                </div>
              </div>
              
              <div style={{ marginTop: '32px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 600 }}>{t('settings.billing.paymentMethod')}</h4>
                <div style={paymentMethodStyle}>
                  <CreditCard size={20} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: isMobile ? '0.875rem' : '1rem' }} className="truncate">{profile?.payment_method ? `${profile.payment_method.brand} ending in ${profile.payment_method.last4}` : t('settings.billing.noPaymentMethod')}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{profile?.payment_method ? `Expires ${profile.payment_method.expiry}` : t('settings.billing.addPaymentMethod')}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    style={{
                      width: isMobile ? '100%' : 'auto',
                      justifyContent: 'center',
                      marginTop: isMobile ? '8px' : '0'
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              <div style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <History size={18} color="var(--text-secondary)" />
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('settings.billing.billingHistory')}</h4>
                </div>
                <div style={tableWrapperStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>{t('settings.billing.date')}</th>
                        <th style={thStyle}>{t('settings.billing.invoice')}</th>
                        <th style={thStyle}>{t('settings.billing.amount')}</th>
                        <th style={thStyle}>{t('settings.billing.status')}</th>
                        <th style={thStyle}>{t('settings.billing.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingLoading ? (
                        <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '32px' }}>Loading history...</td></tr>
                      ) : billingHistory.length > 0 ? (
                        billingHistory.map((item) => (
                          <tr key={item.id}>
                            <td style={tdStyle}>{item.date}</td>
                            <td style={tdStyle}>#{item.invoice_no}</td>
                            <td style={tdStyle}>${item.amount.toFixed(2)}</td>
                            <td style={tdStyle}>
                              <span style={{ 
                                ...statusBadgeStyle,
                                backgroundColor: item.status === 'Paid' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: item.status === 'Paid' ? '#22c55e' : '#ef4444',
                              }}>
                                {item.status}
                              </span>
                            </td>
                            <td style={tdStyle}><Button variant="ghost" size="sm">{t('settings.billing.download')}</Button></td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>{t('settings.billing.noHistory')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card title={t('settings.privacy.title')} icon={Shield} style={{ padding: isMobile ? '16px' : '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>{t('settings.privacy.dataExport')}</h4>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.875rem' }}>
                    {t('settings.privacy.dataExportDesc')}
                  </p>
                  <Button variant="outline" style={{ width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>{t('settings.privacy.exportZip')}</Button>
                </div>
                <div style={dividerMenuStyle} />
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>{t('settings.privacy.tracking')}</h4>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.875rem' }}>
                    {t('settings.privacy.trackingDesc')}
                  </p>
                  <div style={toggleItemStyle}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: isMobile ? '0.875rem' : '1rem' }}>{t('settings.privacy.analytics')}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('settings.privacy.analyticsDesc')}</p>
                    </div>
                    <input type="checkbox" defaultChecked style={{ flexShrink: 0 }} />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card title={t('settings.preferences.title')} icon={CheckSquare} style={{ padding: isMobile ? '16px' : '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {t('settings.preferences.desc')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={checkboxLabelStyle}>
                    <input 
                      type="checkbox" 
                      checked={marketingPrefs.opportunityAlerts} 
                      onChange={() => handleMarketingToggle('opportunityAlerts')}
                      style={checkboxStyle} 
                    />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: isMobile ? '0.875rem' : '1rem' }}>{t('settings.preferences.opportunityAlerts')}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('settings.preferences.opportunityAlertsDesc')}</p>
                    </div>
                  </label>
                  <label style={checkboxLabelStyle}>
                    <input 
                      type="checkbox" 
                      checked={marketingPrefs.productUpdates} 
                      onChange={() => handleMarketingToggle('productUpdates')}
                      style={checkboxStyle} 
                    />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: isMobile ? '0.875rem' : '1rem' }}>{t('settings.preferences.productUpdates')}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('settings.preferences.productUpdatesDesc')}</p>
                    </div>
                  </label>
                </div>
                <Button 
                  style={{ alignSelf: isMobile ? 'stretch' : 'flex-start', marginTop: '12px', justifyContent: 'center' }}
                  onClick={refreshProfile}
                >
                  {t('settings.preferences.refreshState')}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'account' && (
            <Card title={t('settings.account.title')} icon={AlertTriangle} style={{ border: '1px solid #ef4444', padding: isMobile ? '16px' : '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: '4px' }}>{t('settings.account.warning')}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {t('settings.account.warningDesc')}
                  </p>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {t('settings.account.contactSupport')}
                </p>
                
                {!showDeleteConfirm ? (
                  <Button 
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{ 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      color: '#ef4444', 
                      border: '1px solid #ef4444', 
                      alignSelf: isMobile ? 'stretch' : 'flex-start',
                      minWidth: '180px',
                      justifyContent: 'center'
                    }}
                  >
                    {t('settings.account.requestDeletion')}
                  </Button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: isMobile ? 'stretch' : 'flex-start', width: '100%' }}>
                    <p style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.875rem' }}>{t('settings.account.areYouSure')}</p>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', width: '100%' }}>
                      <Button 
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                        style={{ 
                          backgroundColor: '#ef4444', 
                          color: '#fff', 
                          border: 'none',
                          minWidth: '180px',
                          width: isMobile ? '100%' : 'auto',
                          justifyContent: 'center'
                        }}
                      >
                        {deleteLoading ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Loader2 size={18} className="animate-spin" /> {t('common.loading')}
                          </span>
                        ) : t('settings.account.confirmDeletion')}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deleteLoading}
                        style={{
                          width: isMobile ? '100%' : 'auto',
                          justifyContent: 'center'
                        }}
                      >
                        {t('settings.account.cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
