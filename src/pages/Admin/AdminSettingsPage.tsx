import React from 'react';
import { Card } from '../../components/ui/Card';
import { Shield, Globe, Code, CreditCard } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const plans = [
    { name: 'Starter', price: '£11.99', credits: 25 },
    { name: 'Growth', price: '£25.00', credits: 60 },
    { name: 'Power User', price: '£48.00', credits: 120 },
  ];

  const creditCosts = [
    { service: 'Cover Letter', credits: 1 },
    { service: 'CV / Resume', credits: 1 },
    { service: 'Proposal', credits: 1 },
    { service: 'Grant Application', credits: 3 },
    { service: 'Prep Plan', credits: 3 },
    { service: 'Rewrite (after 3 free)', credits: 0.25 },
  ];

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>Platform Settings</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Configuration and pricing overview</p>
      </div>

      {/* Platform Info */}
      <Card style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Globe size={18} color="#3b82f6" /> Platform Info
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: 'Platform', value: 'PATHEW' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Environment', value: 'Production' },
            { label: 'Database', value: 'Supabase (PostgreSQL)' },
            { label: 'Payments', value: 'Stripe' },
            { label: 'AI Model', value: 'Claude (Anthropic)' },
          ].map(item => (
            <div key={item.label} style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '4px' }}>{item.label}</p>
              <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Pricing Config */}
      <Card style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CreditCard size={18} color="#f59e0b" /> Pricing Tiers
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Plan', 'Price', 'Credits/mo'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.875rem' }}>{p.name}</td>
                <td style={{ padding: '14px 16px', color: '#f59e0b', fontWeight: 700 }}>{p.price}/mo</td>
                <td style={{ padding: '14px 16px', fontWeight: 600 }}>{p.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Credit Costs */}
      <Card style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Code size={18} color="#a855f7" /> Credit Cost Per Service
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Service', 'Credits'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {creditCosts.map(c => (
              <tr key={c.service} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{c.service}</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f59e0b' }}>{c.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Security */}
      <Card style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={18} color="#22c55e" /> Security
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Admin access is currently protected by hardcoded credentials. For production, upgrade to Supabase role-based authentication with an <code style={{ color: '#f59e0b' }}>is_admin</code> column on the profiles table.
        </p>
      </Card>
    </div>
  );
};
