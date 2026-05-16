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
        <Card title={t('wallet.recentTransactions')} icon={Clock} style={{ flex: 2 }}>
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
                  <div style={{ flex: 1 }}>
                    <p style={txTitleStyle}>{tx.description}</p>
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

const containerStyle: React.CSSProperties = {
  maxWidth: '1000px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '1.125rem',
};

const gridStyle: React.CSSProperties = {
  display: 'flex',
  gap: '32px',
  alignItems: 'flex-start',
};

const balanceCardStyle: React.CSSProperties = {
  flex: 1,
  background: 'linear-gradient(145deg, var(--bg-secondary) 0%, rgba(30,30,30,0.8) 100%)',
  border: '1px solid var(--border-color)',
  padding: '24px',
};

const balanceHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
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
  marginBottom: '32px',
};

const balanceLabelStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '0.875rem',
  marginBottom: '8px',
};

const balanceValueStyle: React.CSSProperties = {
  fontSize: '3.5rem',
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
};

const txListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const txItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
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
};

const txTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: '4px',
};

const txDateStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
};

const txAmountStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '1.125rem',
};
