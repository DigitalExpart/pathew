import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Users, CreditCard, FileText, Bot, TrendingUp, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ users: 0, starter: 0, growth: 0, power: 0, free: 0, docs: 0, sessions: 0 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [usersRes, docsRes, sessionsRes, recentRes] = await Promise.all([
          supabase.from('profiles').select('subscription_plan'),
          supabase.from('assistant_drafts').select('id', { count: 'exact', head: true }),
          supabase.from('assistant_sessions').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id, full_name, avatar_url, subscription_plan, credits, created_at').order('created_at', { ascending: false }).limit(8),
        ]);

        const profiles = usersRes.data || [];
        setStats({
          users: profiles.length,
          starter: profiles.filter(p => p.subscription_plan === 'Starter').length,
          growth: profiles.filter(p => p.subscription_plan === 'Growth').length,
          power: profiles.filter(p => p.subscription_plan === 'Power User').length,
          free: profiles.filter(p => !p.subscription_plan || p.subscription_plan === 'Free').length,
          docs: docsRes.count || 0,
          sessions: sessionsRes.count || 0,
        });
        setRecentUsers(recentRes.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, []);

  const kpis = [
    { icon: Users, label: 'Total Users', value: stats.users, color: '#3b82f6' },
    { icon: CreditCard, label: 'Paid Plans', value: stats.starter + stats.growth + stats.power, color: '#22c55e' },
    { icon: FileText, label: 'Documents', value: stats.docs, color: '#a855f7' },
    { icon: Bot, label: 'AI Sessions', value: stats.sessions, color: '#f59e0b' },
  ];

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>Dashboard Overview</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Platform analytics and management</p>
      </div>

      {loading ? <p style={{ color: '#64748b' }}>Loading analytics...</p> : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {kpis.map(k => (
              <div key={k.label} style={kpiCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ ...iconBoxStyle, backgroundColor: `${k.color}15`, border: `1px solid ${k.color}30` }}>
                    <k.icon size={18} color={k.color} />
                  </div>
                  <ArrowUpRight size={16} color="#22c55e" />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '4px' }}>{k.label}</p>
                <p style={{ fontSize: '2rem', fontWeight: 800 }}>{k.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Plan Distribution + Recent Users */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <Card style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Plan Distribution</h3>
              {[
                { label: 'Free', count: stats.free, color: '#64748b' },
                { label: 'Starter', count: stats.starter, color: '#3b82f6' },
                { label: 'Growth', count: stats.growth, color: '#f59e0b' },
                { label: 'Power User', count: stats.power, color: '#22c55e' },
              ].map(p => (
                <div key={p.label} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{p.label}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{p.count}</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ height: '100%', borderRadius: '3px', backgroundColor: p.color, width: `${stats.users ? (p.count / stats.users) * 100 : 0}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </Card>

            <Card style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Sign-ups</h3>
                <TrendingUp size={16} color="#22c55e" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentUsers.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#f59e0b' }}>
                      {(u.full_name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{u.full_name || 'Unnamed'}</p>
                      <p style={{ fontSize: '0.6875rem', color: '#64748b' }}>{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', backgroundColor: u.subscription_plan === 'Free' || !u.subscription_plan ? 'rgba(100,116,139,0.15)' : 'rgba(245,158,11,0.1)', color: u.subscription_plan === 'Free' || !u.subscription_plan ? '#64748b' : '#f59e0b' }}>
                      {u.subscription_plan || 'Free'}
                    </span>
                  </div>
                ))}
                {!recentUsers.length && <p style={{ color: '#475569', textAlign: 'center', padding: '20px', fontSize: '0.875rem' }}>No users yet.</p>}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

const kpiCardStyle: React.CSSProperties = {
  padding: '24px', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)',
};
const iconBoxStyle: React.CSSProperties = {
  width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
