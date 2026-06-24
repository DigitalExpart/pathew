import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Bot, MessageSquare, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminAIUsagePage: React.FC = () => {
  const [stats, setStats] = useState({ sessions: 0, messages: 0, tokensIn: 0, tokensOut: 0 });
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-get-users', {
          body: { action: 'get_ai_usage' }
        });
        
        if (error) throw error;
        
        const sessionsCount = data.sessionsCount || 0;
        const messages = data.messages || [];
        const recentMessages = data.recent || [];

      const tokensIn = messages.reduce((s: any, m: any) => s + (m.tokens_in || 0), 0);
      const tokensOut = messages.reduce((s: any, m: any) => s + (m.tokens_out || 0), 0);

      // Top users by message count
      const userCounts: Record<string, number> = {};
      messages.forEach((m: any) => { userCounts[m.user_id] = (userCounts[m.user_id] || 0) + 1; });
      const sorted = Object.entries(userCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

      // Fetch names for top users
      // Fetch names for top users and recent activities
      const userIds = Array.from(new Set([...sorted.map(s => s[0]), ...recentMessages.map((m: any) => m.user_id)]));
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.full_name || 'Unnamed'; });

      setStats({ sessions: sessionsCount, messages: messages.length, tokensIn, tokensOut });
      setTopUsers(sorted.map(([id, count]) => ({ id, name: nameMap[id] || id.slice(0, 8), count })));
      
      const activities = recentMessages.map((m: any) => ({
        ...m,
        user_name: nameMap[m.user_id] || m.user_id?.slice(0, 8) || 'System',
      }));
      setRecentActivities(activities);
      setLoading(false);
      } catch (err) {
        console.error('Error fetching AI usage:', err);
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  const kpis = [
    { icon: Bot, label: 'Total Sessions', value: stats.sessions, color: '#f59e0b' },
    { icon: MessageSquare, label: 'Messages', value: stats.messages, color: '#3b82f6' },
    { icon: Zap, label: 'Tokens In', value: stats.tokensIn.toLocaleString(), color: '#a855f7' },
    { icon: Zap, label: 'Tokens Out', value: stats.tokensOut.toLocaleString(), color: '#22c55e' },
  ];

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>AI Usage Analytics</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Monitor assistant sessions, messages, and token consumption</p>
      </div>

      {loading ? <p style={{ color: '#64748b' }}>Loading AI analytics...</p> : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {kpis.map(k => (
              <Card key={k.label} style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: `${k.color}15`, border: `1px solid ${k.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <k.icon size={18} color={k.color} />
                </div>
                <p style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '4px' }}>{k.label}</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{k.value}</p>
              </Card>
            ))}
          </div>

          {/* Top Users */}
          <Card style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>Top Users by AI Messages</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topUsers.length === 0 ? (
                <p style={{ color: '#475569', textAlign: 'center', padding: '20px' }}>No AI usage data yet.</p>
              ) : topUsers.map((u, i) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: i < 3 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 800, color: i < 3 ? '#f59e0b' : '#64748b' }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.8125rem' }}>{u.name}</span>
                  <span style={{ fontWeight: 800, color: '#f59e0b' }}>{u.count}</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>messages</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activities */}
          <Card style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', marginTop: '32px', overflowX: 'auto' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>Recent AI Activity</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Time</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>User</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Message Snippet</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ color: '#475569', textAlign: 'center', padding: '20px' }}>No recent activity found.</td>
                  </tr>
                ) : recentActivities.map((act) => (
                  <tr key={act.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px', fontSize: '0.8125rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(act.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.875rem', fontWeight: 600 }}>
                      {act.user_name}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.6875rem', 
                        fontWeight: 700, 
                        textTransform: 'uppercase',
                        backgroundColor: act.role === 'user' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: act.role === 'user' ? '#3b82f6' : '#22c55e'
                      }}>
                        {act.role}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.875rem', color: '#cbd5e1', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {act.content}
                    </td>
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
