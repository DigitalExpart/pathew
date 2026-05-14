import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

export const AdminSubscriptionsPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, subscription_plan, credits, created_at, updated_at').order('updated_at', { ascending: false });
      setData(profiles || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const tiers = [
    { name: 'Free', price: '£0', color: '#64748b', count: data.filter(d => !d.subscription_plan || d.subscription_plan === 'Free').length },
    { name: 'Starter', price: '£11.99/mo', color: '#3b82f6', count: data.filter(d => d.subscription_plan === 'Starter').length },
    { name: 'Growth', price: '£25.00/mo', color: '#f59e0b', count: data.filter(d => d.subscription_plan === 'Growth').length },
    { name: 'Power User', price: '£48.00/mo', color: '#22c55e', count: data.filter(d => d.subscription_plan === 'Power User').length },
  ];

  const revenue = tiers[1].count * 11.99 + tiers[2].count * 25 + tiers[3].count * 48;

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>Subscriptions</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Plan distribution and revenue overview</p>
      </div>

      {loading ? <p style={{ color: '#64748b' }}>Loading...</p> : (
        <>
          {/* Revenue Card */}
          <div style={{ padding: '28px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))', border: '1px solid rgba(245,158,11,0.15)', marginBottom: '28px' }}>
            <p style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Estimated Monthly Revenue</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800 }}>£{revenue.toFixed(2)}</p>
            <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Based on {data.length} total users</p>
          </div>

          {/* Tier Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {tiers.map(t => (
              <Card key={t.name} style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.color }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{t.name}</span>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>{t.count}</p>
                <p style={{ color: '#64748b', fontSize: '0.75rem' }}>{t.price}</p>
                <div style={{ marginTop: '12px', height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ height: '100%', borderRadius: '2px', backgroundColor: t.color, width: `${data.length ? (t.count / data.length) * 100 : 0}%` }} />
                </div>
              </Card>
            ))}
          </div>

          {/* Users by Plan Table */}
          <Card style={{ padding: '0', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontWeight: 700 }}>All Subscribers</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['User', 'Plan', 'Credits', 'Last Updated'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.filter(d => d.subscription_plan && d.subscription_plan !== 'Free').map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 20px', fontSize: '0.8125rem', fontWeight: 600 }}>{u.full_name || 'Unnamed'}</td>
                    <td style={{ padding: '14px 20px' }}><span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700, backgroundColor: `${tiers.find(t => t.name === u.subscription_plan)?.color || '#64748b'}20`, color: tiers.find(t => t.name === u.subscription_plan)?.color || '#64748b' }}>{u.subscription_plan}</span></td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: '0.8125rem' }}>{u.credits}</td>
                    <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.8125rem' }}>{new Date(u.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
};
