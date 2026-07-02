import React from 'react';
import { Button } from '../../components/ui/Button';
import { CheckCircle } from 'lucide-react';
import { CheckoutModal } from '../../components/payment/CheckoutModal';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PricingCard = ({ title, price, credits, subtitle, generatesUpTo, includedFeatures, badge, badgeColor = 'var(--accent-primary)', isMobile }: any) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = (e: any) => {
    e.preventDefault();
    if (!user) {
      navigate('/signup');
      return;
    }
    setIsModalOpen(true);
  };

  // Dynamic Responsive Styles
  const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: isMobile ? '24px 20px' : '40px 32px',
    position: 'relative',
    height: '100%',
    transition: 'transform 0.3s ease',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-xl)',
    backgroundColor: 'var(--bg-secondary)',
    borderColor: badge ? badgeColor : 'var(--border-color)',
    boxShadow: badge ? `0 20px 40px -15px ${badgeColor}22` : 'none',
    zIndex: badge ? 1 : 0,
    transform: (badge && !isMobile) ? 'scale(1.05)' : 'scale(1)',
  };

  const popularBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-14px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: badgeColor,
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
    fontSize: isMobile ? '2.75rem' : '3.5rem',
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
    marginBottom: isMobile ? '20px' : '32px',
    paddingBottom: isMobile ? '20px' : '32px',
    borderBottom: '1px solid var(--border-color)',
  };

  return (
  <>
  <div style={cardStyle}>
    {badge && <div style={popularBadgeStyle}>{badge}</div>}
    <h3 style={tierNameStyle}>{title}</h3>
    <div style={priceContainerStyle}>
      <span style={priceStyle}>{price}</span>
      <span style={periodStyle}>{t('pricing.month')}</span>
    </div>
    <div style={creditsLabelStyle}>
      {credits}
    </div>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px', lineHeight: 1.5, minHeight: isMobile ? 'auto' : '42px' }}>
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
  </div>

  <CheckoutModal 
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
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamic Responsive Styles
  const containerStyle: React.CSSProperties = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: isMobile ? '16px' : '24px 0',
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: isMobile ? '32px' : '64px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '2rem' : '3rem',
    fontWeight: 800,
    marginBottom: '16px',
  };

  const subtitleStyle: React.CSSProperties = {
    color: 'var(--text-secondary)',
    fontSize: isMobile ? '1rem' : '1.25rem',
    maxWidth: '600px',
    margin: '0 auto',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
    gap: isMobile ? '24px' : '32px',
    alignItems: 'stretch',
  };

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
          isMobile={isMobile}
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
          isMobile={isMobile}
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
          isMobile={isMobile}
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


    </div>
  );
};


