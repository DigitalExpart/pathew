import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Search, ChevronDown, Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editCredits, setEditCredits] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [editRole, setEditRole] = useState('user');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-get-users', {
          body: { action: 'get_all_users' }
        });
        
        if (error) throw error;
        
        setUsers(data?.users || []);
        setFiltered(data?.users || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;
    if (search) result = result.filter(u => (u.full_name || '').toLowerCase().includes(search.toLowerCase()) || u.id.includes(search));
    if (planFilter !== 'All') result = result.filter(u => (u.subscription_plan || 'Free') === planFilter);
    setFiltered(result);
  }, [search, planFilter, users]);

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    try {
      const { error } = await supabase.functions.invoke('admin-get-users', {
        body: { 
          action: 'update_user',
          userId: editingUser.id,
          updateData: {
            credits: parseInt(editCredits) || 0, 
            subscription_plan: editPlan,
            role: editRole 
          }
        }
      });
      
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { 
        ...u, 
        credits: parseInt(editCredits) || 0, 
        subscription_plan: editPlan,
        role: editRole 
      } : u));
    } catch (err) {
      console.error('Error updating user:', err);
    } finally {
      setEditingUser(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>User Management</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{users.length} registered users</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ ...filterBoxStyle, flex: 1, minWidth: '200px' }}>
          <Search size={16} color="#64748b" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..." style={filterInputStyle} />
        </div>
        <div style={filterBoxStyle}>
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} style={{ ...filterInputStyle, cursor: 'pointer' }}>
            {['All', 'Free', 'Starter', 'Growth', 'Power User'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown size={14} color="#64748b" />
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setEditingUser(null)}>
          <div style={{ maxWidth: '400px', width: '100%', padding: '32px', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>Edit User: {editingUser.full_name}</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={editLabelStyle}>Credits</label>
              <input type="number" value={editCredits} onChange={e => setEditCredits(e.target.value)} style={editInputStyle} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={editLabelStyle}>Subscription Plan</label>
              <select value={editPlan} onChange={e => setEditPlan(e.target.value)} style={editInputStyle}>
                {['Free', 'Starter', 'Growth', 'Power User'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={editLabelStyle}>Role</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value)} style={editInputStyle}>
                <option value="user">User</option>
                <option value="sub_admin">Sub Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="ghost" onClick={() => setEditingUser(null)} style={{ flex: 1 }}>Cancel</Button>
              <Button onClick={handleSaveEdit} style={{ flex: 1 }}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <Card style={{ padding: '0', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['User', 'Role', 'Plan', 'Credits', 'Joined', 'Last Active', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No users found.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#f59e0b' }}>
                        {(u.full_name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#e2e8f0' }}>{u.full_name || 'Unnamed'}</p>
                        <p style={{ fontSize: '0.6875rem', color: '#64748b' }}>{u.email || u.id.slice(0, 8) + '...'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ 
                      fontSize: '0.6875rem', 
                      fontWeight: 700, 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      backgroundColor: u.role === 'sub_admin' ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.1)',
                      color: u.role === 'sub_admin' ? '#f59e0b' : '#94a3b8'
                    }}>
                      {u.role === 'sub_admin' ? 'Sub Admin' : 'User'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ ...planBadgeStyle, backgroundColor: planColor(u.subscription_plan).bg, color: planColor(u.subscription_plan).text }}>
                      {u.subscription_plan || 'Free'}
                    </span>
                  </td>
                  <td style={tdStyle}><span style={{ fontWeight: 700, color: '#e2e8f0' }}>{u.credits ?? 0}</span></td>
                  <td style={tdStyle}><span style={{ color: '#64748b', fontSize: '0.8125rem' }}>{new Date(u.created_at).toLocaleDateString()}</span></td>
                  <td style={tdStyle}><span style={{ color: '#64748b', fontSize: '0.8125rem' }}>{u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : 'Never'}</span></td>
                  <td style={tdStyle}>
                    <button onClick={() => { setEditingUser(u); setEditCredits(String(u.credits || 0)); setEditPlan(u.subscription_plan || 'Free'); setEditRole(u.role || 'user'); }} style={actionBtnStyle}>
                      <Edit3 size={14} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const planColor = (plan: string) => {
  switch (plan) {
    case 'Starter': return { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' };
    case 'Growth': return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' };
    case 'Power User': return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' };
    default: return { bg: 'rgba(100,116,139,0.15)', text: '#64748b' };
  }
};

const filterBoxStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' };
const filterInputStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#e2e8f0', fontSize: '0.8125rem', outline: 'none', flex: 1 };
const thStyle: React.CSSProperties = { padding: '14px 20px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle: React.CSSProperties = { padding: '14px 20px', fontSize: '0.8125rem' };
const planBadgeStyle: React.CSSProperties = { padding: '4px 10px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700 };
const actionBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' };
const editLabelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' };
const editInputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none' };
