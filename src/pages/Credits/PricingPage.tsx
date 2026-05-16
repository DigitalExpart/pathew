import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle, Zap } from 'lucide-react';
import { StripeCheckoutModal } from '../../components/payment/StripeCheckoutModal';
import { useTranslation } from 'react-i18next';

const PricingCard = ({ title, price, credits, subtitle, generatesUpTo, includedFeatures, badge, badgeColor = 'var(--accent-primary)' }: any) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleSubscribe = (e: any) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
  <>
  <Card 
    style={{
      ...cardStyle,
      borderColor: badge ? badgeColor : 'var(--border-color)',
      boxShadow: badge ? `0 30px 60px -15px ${badgeColor}33` : 'none',
      zIndex: badge ? 1 : 0,
      transform: badge ? 'scale(1.05)' : 'scale(1)',
    }}
  >
    {badge && <div style={{...popularBadgeStyle, backgroundColor: badgeColor, color: '#000'}}>{badge}</div>}
    <h3 style={tierNameStyle}>{title}</h3>
    <div style={priceContainerStyle}>
      <span style={priceStyle}>{price}</span>
      <span style={periodStyle}>{t('pricing.month')}</span>
    </div>
    <div style={creditsLabelStyle}>
      {credits}
    </div>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px', lineHeight: 1.5, minHeight: '42px' }}>
      {subtitle}
    </p>

    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
        {t('pricing.generatesUpTo')}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {generatesUpTo.map((g: any) => (
          <li key={g.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            <span>{g.label}</span>
            <span style={{ fontWeight: 600 }}>{g.count}</span>
          </li>
        ))}
      </ul>
    </div>

    <div style={{ flex: 1, marginBottom: '32px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
        {t('pricing.included')}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {includedFeatures.map((f: string) => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.4 }}>
            <CheckCircle size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} /> 
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>

    <div style={{ marginTop: 'auto' }}>
      <Button onClick={handleSubscribe} variant={badge ? 'primary' : 'outline'} style={{ width: '100%' }}>
        {t('pricing.choose')} {title}
      </Button>
    </div>
  </Card>

  <StripeCheckoutModal 
    isOpen={isModalOpen} 
    onClose={() => setIsModalOpen(false)} 
    planTitle={title} 
    planPrice={price}
    planCredits={credits}
  />
  </>
  );
};

export const PricingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>{t('pricing.title')}</h1>
        <p style={subtitleStyle}>{t('pricing.subtitle')}</p>
      </header>

      <div style={gridStyle}>
        <PricingCard 
          title={t('pricing.plans.starter.title', 'Starter')}
          price="£11.99" 
          credits={t('pricing.plans.starter.credits')}
          subtitle={t('pricing.plans.starter.subtitle')}
          generatesUpTo={[
            { label: t('pricing.services.coverLetter'), count: '25×' },
            { label: t('pricing.services.cv'), count: '25×' },
            { label: t('pricing.services.proposal'), count: '25×' },
            { label: t('pricing.services.grant'), count: '8×' },
            { label: t('pricing.services.rewrite'), count: '100×' }
          ]}
          includedFeatures={[
            t('pricing.features.0', 'View live job & grant opportunities'),
            t('pricing.features.1', 'Percentage readiness score per application'),
            t('pricing.features.2', 'AI-generated preparation plan – credit applies')
          ]}
        />
        <PricingCard 
          title={t('pricing.plans.growth.title', 'Growth')}
          price="£25.00" 
          credits={t('pricing.plans.growth.credits')}
          subtitle={t('pricing.plans.growth.subtitle')}
          badge={t('pricing.plans.growth.badge', '★ MOST POPULAR ★')}
          generatesUpTo={[
            { label: t('pricing.services.coverLetter'), count: '60×' },
            { label: t('pricing.services.cv'), count: '60×' },
            { label: t('pricing.services.proposal'), count: '60×' },
            { label: t('pricing.services.grant'), count: '20×' },
            { label: t('pricing.services.rewrite'), count: '240×' }
          ]}
          includedFeatures={[
            t('pricing.features.0', 'View live job & grant opportunities'),
            t('pricing.features.1', 'Percentage readiness score per application'),
            t('pricing.features.2', 'AI-generated preparation plan – credit applies')
          ]}
        />
        <PricingCard 
          title={t('pricing.plans.power.title', 'Power User')}
          price="£48.00" 
          credits={t('pricing.plans.power.credits')}
          subtitle={t('pricing.plans.power.subtitle')}
          badge={t('pricing.plans.power.badge', '★ BEST VALUE ★')}
          badgeColor="#3b82f6"
          generatesUpTo={[
            { label: t('pricing.services.coverLetter'), count: '120×' },
            { label: t('pricing.services.cv'), count: '120×' },
            { label: t('pricing.services.proposal'), count: '120×' },
            { label: t('pricing.services.grant'), count: '40×' },
            { label: t('pricing.services.rewrite'), count: '480×' }
          ]}
          includedFeatures={[
            t('pricing.features.0', 'View live job & grant opportunities'),
            t('pricing.features.1', 'Percentage readiness score per application'),
            t('pricing.features.2', 'AI-generated preparation plan – credit applies')
          ]}
        />
      </div>

      <div style={{ maxWidth: '800px', margin: '80px auto 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>{t('pricing.creditCost')}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            {t('pricing.creditCostSubtitle')}
          </p>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('pricing.service')}</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('pricing.credits')}</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('pricing.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { service: t('pricing.services.coverLetter'), credits: '1 credit', notes: 'per letter' },
                  { service: t('pricing.services.cv'), credits: '1 credit', notes: 'per CV' },
                  { service: t('pricing.services.proposal'), credits: '1 credit', notes: 'per proposal' },
                  { service: t('pricing.services.grant'), credits: '3 credits', notes: 'per grant' },
                  { service: t('pricing.services.prep'), credits: '3 credits', notes: 'per plan' },
                  { service: t('pricing.services.rewrite'), credits: '0.25 credits', notes: 'per rewrite (¼ of original after 3 rewrites)' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: idx !== 5 ? '1px solid var(--border-color)' : 'none' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 500 }}>{row.service}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--accent-primary)', fontWeight: 600 }}>{row.credits}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '12px 24px', borderRadius: 'var(--radius-full)', color: 'var(--accent-primary)', fontWeight: 600 }}>
            <Zap size={18} />
            {t('pricing.needMore')}
          </div>
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  maxWidth: '1000px',
  margin: '0 auto',
  padding: '24px 0',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '64px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '3rem',
  marginBottom: '16px',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '1.25rem',
  maxWidth: '600px',
  margin: '0 auto',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '32px',
  alignItems: 'center',
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '40px 32px',
  position: 'relative',
  height: '100%',
  transition: 'transform 0.3s ease',
};

const popularBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-14px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'var(--accent-primary)',
  color: '#000',
  padding: '6px 16px',
  borderRadius: 'var(--radius-full)',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const tierNameStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  marginBottom: '16px',
  fontWeight: 600,
};

const priceContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  marginBottom: '8px',
};

const priceStyle: React.CSSProperties = {
  fontSize: '3.5rem',
  fontWeight: 800,
  lineHeight: 1,
};

const periodStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  marginLeft: '8px',
};

const creditsLabelStyle: React.CSSProperties = {
  color: 'var(--accent-primary)',
  fontWeight: 600,
  marginBottom: '32px',
  paddingBottom: '32px',
  borderBottom: '1px solid var(--border-color)',
};


