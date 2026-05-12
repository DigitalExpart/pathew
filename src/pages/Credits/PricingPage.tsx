import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Check, Sparkles } from 'lucide-react';
import { mockPricingTiers } from '../../data/mockData';

export const PricingPage: React.FC = () => {
  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Pricing & Credit Packs</h1>
        <p style={subtitleStyle}>Choose the plan that fits your ambition. Upgrade anytime.</p>
      </header>

      <div style={gridStyle}>
        {mockPricingTiers.map((tier) => (
          <Card 
            key={tier.id} 
            style={{ 
              ...cardStyle, 
              border: tier.id === 'pro' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
              transform: tier.id === 'pro' ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            {tier.id === 'pro' && (
              <div style={popularBadgeStyle}>
                <Sparkles size={14} /> Most Popular
              </div>
            )}
            <h3 style={tierNameStyle}>{tier.name}</h3>
            <div style={priceContainerStyle}>
              <span style={priceStyle}>{tier.price}</span>
              <span style={periodStyle}>/month</span>
            </div>
            <p style={creditsLabelStyle}>{tier.credits} Credits included</p>
            
            <ul style={featuresListStyle}>
              {tier.features.map((feature, idx) => (
                <li key={idx} style={featureItemStyle}>
                  <Check size={16} color="var(--accent-primary)" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button 
              variant={tier.id === 'pro' ? 'primary' : 'outline'} 
              style={{ width: '100%', marginTop: 'auto' }}
            >
              {tier.id === 'free' ? 'Current Plan' : 'Select Plan'}
            </Button>
          </Card>
        ))}
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

const featuresListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  marginBottom: '40px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const featureItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '0.9375rem',
};