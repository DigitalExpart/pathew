import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Coins, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const WalletPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWalletData();
  }, [user]);

  React.useEffect(() => {
    const checkPaymentRedirect = async () => {
      if (!user) return;
      const urlParams = new URLSearchParams(window.location.search);
      const redirectStatus = urlParams.get('redirect_status');
      
      if (redirectStatus === 'succeeded') {
        const pendingPlan = localStorage.getItem('pending_plan');
        const pendingCreditsStr = localStorage.getItem('pending_credits');
        
        if (pendingPlan && pendingCreditsStr) {
          const addedCredits = parseInt(pendingCreditsStr, 10);
          
          try {
            // Check if transaction already exists for this payment intent to prevent double-charging
            // We'll just rely on the local storage clear for now as a simple barrier
            
            // SECURITY: Server-side credit verification via Edge Function
            const paymentIntentId = urlParams.get('payment_intent');
            if (paymentIntentId) {
              await supabase.functions.invoke('verify-payment', {
                body: { 
                  paymentIntentId,
                  plan: pendingPlan,
                  paymentGateway: 'stripe'
                }
              });
            }
            
            // Clear local storage so it doesn't double apply
            localStorage.removeItem('pending_plan');
            localStorage.removeItem('pending_credits');
            
            // Clean URL
            window.history.replaceState({}, '', '/wallet');
            
            // Refresh data
            window.location.reload(); // Quickest way to refresh all context state
          } catch (err) {
            console.error('Error applying redirected payment:', err);
          }
        }
      }
    };
    checkPaymentRedirect();
  }, [user]);

  // Dynamic Responsive Styles
  const containerStyle: React.CSSProperties = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: isMobile ? '16px' : '0',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: isMobile ? '20px' : '32px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '1.75rem' : '2.5rem',
    fontWeight: 700,
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    color: 'var(--text-secondary)',
    fontSize: isMobile ? '0.9375rem' : '1.125rem',
  };

  const gridStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '20px' : '32px',
    alignItems: 'stretch',
  };

  const balanceCardStyle: React.CSSProperties = {
    flex: 1,
    background: 'linear-gradient(145deg, var(--bg-secondary) 0%, rgba(30,30,30,0.8) 100%)',
    border: '1px solid var(--border-color)',
    padding: isMobile ? '20px' : '24px',
    width: '100%'
  };

  const balanceHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };

  const iconBoxStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--accent-glow)',
  };

  const planBadgeStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    backgroundColor: 'var(--accent-primary)',
    color: '#000',
    padding: '4px 12px',
    borderRadius: 'var(--radius-full)',
  };

  const balanceContentStyle: React.CSSProperties = {
    marginBottom: '24px',
  };

  const balanceLabelStyle: React.CSSProperties = {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    marginBottom: '8px',
  };

  const balanceValueStyle: React.CSSProperties = {
    fontSize: isMobile ? '2.5rem' : '3.5rem',
    fontWeight: 800,
    lineHeight: 1,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  };

  const balanceSubtextStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
  };

  const balanceFooterStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    width: '100%'
  };

  const txListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const txItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '12px' : '16px',
    padding: isMobile ? '12px' : '16px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
  };

  const txIconStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  const txTitleStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: isMobile ? '0.875rem' : '1rem',
    marginBottom: '2px',
  };

  const txDateStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  };

  const txAmountStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: isMobile ? '1rem' : '1.125rem',
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>{t('wallet.title')}</h1>
        <p style={subtitleStyle}>{t('wallet.subtitle')}</p>
      </header>

      <div style={gridStyle}>
        {/* Balance Card */}
        <Card style={balanceCardStyle}>
          <div style={balanceHeaderStyle}>
            <div style={iconBoxStyle}>
              <Coins size={24} color="var(--accent-primary)" />
            </div>
            <span style={planBadgeStyle}>
              {profile?.subscription_plan ? `${profile.subscription_plan} ${t('profile.planLabel')}` : t('profile.freePlan')}
            </span>
          </div>
          <div style={balanceContentStyle}>
            <p style={balanceLabelStyle}>{t('wallet.availableBalance')}</p>
            <h2 style={balanceValueStyle}>{profile?.credits?.toLocaleString() || '0'}</h2>
            <p style={balanceSubtextStyle}>{t('wallet.creditsReady')}</p>
          </div>
          <div style={balanceFooterStyle}>
            <Link to="/pricing" style={{ width: '100%', display: 'flex', textDecoration: 'none' }}>
              <Button variant="primary" style={{ width: '100%' }}>{t('wallet.upgradePlan')}</Button>
            </Link>
          </div>
        </Card>

        {/* Transaction History */}
        <Card title={t('wallet.recentTransactions')} icon={Clock} style={{ flex: 2, width: '100%' }}>
          <div style={txListStyle}>
            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>{t('common.loading')}</p>
            ) : transactions.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>{t('wallet.noTransactions')}</p>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} style={txItemStyle}>
                  <div style={{ ...txIconStyle, backgroundColor: tx.type === 'credit' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}>
                    {tx.type === 'credit' ? <ArrowDownRight size={18} color="#22c55e" /> : <ArrowUpRight size={18} color="var(--accent-primary)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={txTitleStyle} className="truncate">{tx.description}</p>
                    <p style={txDateStyle}>{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={{ ...txAmountStyle, color: tx.type === 'credit' ? '#22c55e' : 'var(--text-primary)' }}>
                    {tx.type === 'credit' ? '+' : ''}{tx.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
