import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const PricingCard = ({ title, price, credits, subtitle, generatesUpTo, includedFeatures, badge, badgeColor = 'var(--accent-primary)' }: any) => (
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
      <span style={periodStyle}>/month</span>
    </div>
    <div style={creditsLabelStyle}>
      {credits}
    </div>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px', lineHeight: 1.5, minHeight: '42px' }}>
      {subtitle}
    </p>

    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
        GENERATES UP TO
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
        INCLUDED IN EVERY PLAN
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

    <a href="https://stripe.com" target="_blank" rel="noreferrer" style={{ marginTop: 'auto', textDecoration: 'none' }}>
      <Button variant={badge === '★ MOST POPULAR ★' ? 'primary' : 'outline'} style={{ width: '100%' }}>Choose {title}</Button>
    </a>
  </Card>
);

export const PricingPage: React.FC = () => {
  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Pricing Plans</h1>
        <p style={subtitleStyle}>Simple, credit-based pricing. Pay for what you create.</p>
      </header>

      <div style={gridStyle}>
        <PricingCard 
          title="Starter" 
          price="£11.99" 
          credits="25 credits / month"
          subtitle="Perfect for individuals tackling a single application round."
          generatesUpTo={[
            { label: 'Cover Letters', count: '25×' },
            { label: 'CVs / Resumes', count: '25×' },
            { label: 'Proposals', count: '25×' },
            { label: 'Grant Applications', count: '8×' },
            { label: 'Rewrites', count: '100×' }
          ]}
          includedFeatures={[
            'View live job & grant opportunities',
            'Percentage readiness score per application',
            'AI-generated preparation plan – credit applies'
          ]}
        />
        <PricingCard 
          title="Growth" 
          price="£25.00" 
          credits="60 credits / month"
          subtitle="For freelancers and active job seekers applying across multiple roles."
          badge="★ MOST POPULAR ★"
          generatesUpTo={[
            { label: 'Cover Letters', count: '60×' },
            { label: 'CVs / Resumes', count: '60×' },
            { label: 'Proposals', count: '60×' },
            { label: 'Grant Applications', count: '20×' },
            { label: 'Rewrites', count: '240×' }
          ]}
          includedFeatures={[
            'View live job & grant opportunities',
            'Percentage readiness score per application',
            'AI-generated preparation plan – credit applies'
          ]}
        />
        <PricingCard 
          title="Power User" 
          price="£48.00" 
          credits="120 credits / month"
          subtitle="For agencies, consultants and power users generating at scale."
          badge="★ BEST VALUE ★"
          badgeColor="#3b82f6"
          generatesUpTo={[
            { label: 'Cover Letters', count: '120×' },
            { label: 'CVs / Resumes', count: '120×' },
            { label: 'Proposals', count: '120×' },
            { label: 'Grant Applications', count: '40×' },
            { label: 'Rewrites', count: '480×' }
          ]}
          includedFeatures={[
            'View live job & grant opportunities',
            'Percentage readiness score per application',
            'AI-generated preparation plan – credit applies'
          ]}
        />
      </div>

      <div style={{ maxWidth: '800px', margin: '80px auto 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>Credit Cost Per Service</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Mix and match any service — credits work across your entire account.
          </p>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Service</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Credits</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { service: 'Cover Letter', credits: '1 credit', notes: 'per letter' },
                  { service: 'CV / Resume', credits: '1 credit', notes: 'per CV' },
                  { service: 'Proposal', credits: '1 credit', notes: 'per proposal' },
                  { service: 'Grant Application', credits: '3 credits', notes: 'per grant' },
                  { service: 'Preparation Plan', credits: '3 credits', notes: 'per plan' },
                  { service: 'Any Rewrite', credits: '0.25 credits', notes: 'per rewrite (¼ of original after 3 rewrites)' },
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
            Need more? Users can top up their credits at any time.
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


