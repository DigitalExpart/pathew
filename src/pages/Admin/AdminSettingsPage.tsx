import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Shield, Globe, Code, CreditCard, Edit3, Save, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminSettingsPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [creditCosts, setCreditCosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  const [editingPlans, setEditingPlans] = useState(false);
  const [editingCosts, setEditingCosts] = useState(false);
  
  const [tempPlans, setTempPlans] = useState<any[]>([]);
  const [tempCosts, setTempCosts] = useState<any[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('app_settings').select('*');
    if (data) {
      const p = data.find(s => s.id === 'pricing_tiers')?.value || [];
      const c = data.find(s => s.id === 'credit_costs')?.value || [];
      setPlans(p);
      setCreditCosts(c);
      setTempPlans(p);
      setTempCosts(c);
    }
    setLoading(false);
  };

  const handleSavePlans = async () => {
    setSaving('plans');
    const { error } = await supabase.from('app_settings').upsert({ id: 'pricing_tiers', value: tempPlans });
    if (!error) {
      setPlans(tempPlans);
      setEditingPlans(false);
    }
    setSaving(null);
  };

  const handleSaveCosts = async () => {
    setSaving('costs');
    const { error } = await supabase.from('app_settings').upsert({ id: 'credit_costs', value: tempCosts });
    if (!error) {
      setCreditCosts(tempCosts);
      setEditingCosts(false);
    }
    setSaving(null);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading settings...</div>;
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>Platform Settings</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Manage pricing and service configurations</p>
      </div>

      {/* Platform Info */}
      <Card style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Globe size={18} color="#3b82f6" /> Platform Info
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: 'Platform', value: 'PATHEW' },
            { label: 'Version', value: '1.2.0' },
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
      <Card style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={18} color="#f59e0b" /> Pricing Tiers
          </h3>
          {!editingPlans ? (
            <button onClick={() => setEditingPlans(true)} style={actionBtnStyle}><Edit3 size={14} /> Edit</button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setTempPlans(plans); setEditingPlans(false); }} style={{ ...actionBtnStyle, color: '#ef4444' }}><X size={14} /> Cancel</button>
              <button onClick={handleSavePlans} disabled={saving === 'plans'} style={{ ...actionBtnStyle, color: '#f59e0b' }}>
                {saving === 'plans' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
            </div>
          )}
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Plan', 'Price', 'Credits/mo'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(editingPlans ? tempPlans : plans).map((p, idx) => (
              <tr key={p.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.875rem' }}>{p.name}</td>
                <td style={{ padding: '14px 16px' }}>
                  {editingPlans ? (
                    <input style={inputStyle} value={p.price} onChange={e => {
                      const next = [...tempPlans];
                      next[idx].price = e.target.value;
                      setTempPlans(next);
                    }} />
                  ) : (
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{p.price}/mo</span>
                  )}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {editingPlans ? (
                    <input type="number" style={inputStyle} value={p.credits} onChange={e => {
                      const next = [...tempPlans];
                      next[idx].credits = parseInt(e.target.value);
                      setTempPlans(next);
                    }} />
                  ) : (
                    <span style={{ fontWeight: 600 }}>{p.credits}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Credit Costs */}
      <Card style={{ padding: '24px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Code size={18} color="#a855f7" /> Credit Cost Per Service
          </h3>
          {!editingCosts ? (
            <button onClick={() => setEditingCosts(true)} style={actionBtnStyle}><Edit3 size={14} /> Edit</button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setTempCosts(creditCosts); setEditingCosts(false); }} style={{ ...actionBtnStyle, color: '#ef4444' }}><X size={14} /> Cancel</button>
              <button onClick={handleSaveCosts} disabled={saving === 'costs'} style={{ ...actionBtnStyle, color: '#a855f7' }}>
                {saving === 'costs' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
            </div>
          )}
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Service', 'Credits'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(editingCosts ? tempCosts : creditCosts).map((c, idx) => (
              <tr key={c.service} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{c.service}</td>
                <td style={{ padding: '12px 16px' }}>
                  {editingCosts ? (
                    <input type="number" step="0.25" style={inputStyle} value={c.credits} onChange={e => {
                      const next = [...tempCosts];
                      next[idx].credits = parseFloat(e.target.value);
                      setTempCosts(next);
                    }} />
                  ) : (
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>{c.credits}</span>
                  )}
                </td>
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
          Platform configuration is managed in the <code style={{ color: '#f59e0b' }}>app_settings</code> table. Changes made here will reflect globally across the platform interface.
        </p>
      </Card>
    </div>
  );
};

const actionBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.875rem', outline: 'none' };
