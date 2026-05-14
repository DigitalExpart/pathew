import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Archive, 
  CheckCircle, 
  XCircle, 
  Star,
  Filter,
  Copy,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const AdminOpportunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      fetchOpportunities();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ featured: !current })
        .eq('id', id);
      if (error) throw error;
      fetchOpportunities();
    } catch (error) {
      console.error('Error updating featured status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchOpportunities();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleDuplicate = async (opp: any) => {
    try {
      const { id, created_at, updated_at, ...rest } = opp;
      const { error } = await supabase
        .from('opportunities')
        .insert({
          ...rest,
          title: `${rest.title} (Copy)`,
          status: 'draft',
          featured: false
        });
      if (error) throw error;
      fetchOpportunities();
    } catch (error) {
      console.error('Error duplicating:', error);
    }
  };

  const filtered = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(search.toLowerCase()) || 
                         (opp.organization_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || opp.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || opp.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: opportunities.length,
    published: opportunities.filter(o => o.status === 'published').length,
    drafts: opportunities.filter(o => o.status === 'draft').length,
    featured: opportunities.filter(o => o.featured).length
  };

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>Opportunity Management</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Create and manage jobs, grants, and fellowships</p>
        </div>
        <Button onClick={() => navigate('/admin/opportunities/new')} style={{ gap: '8px' }}>
          <Plus size={18} /> New Opportunity
        </Button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <StatCard label="Total Posts" value={stats.total} icon={BarChart3} color="#3b82f6" />
        <StatCard label="Published" value={stats.published} icon={CheckCircle} color="#22c55e" />
        <StatCard label="Drafts" value={stats.drafts} icon={Archive} color="#64748b" />
        <StatCard label="Featured" value={stats.featured} icon={Star} color="#f59e0b" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={filterBoxStyle}>
          <Search size={16} color="#64748b" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search titles or orgs..." 
            style={filterInputStyle} 
          />
        </div>
        <div style={filterBoxStyle}>
          <Filter size={16} color="#64748b" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
            <option value="All">All Types</option>
            <option value="job">Jobs</option>
            <option value="grant">Grants</option>
            <option value="fellowship">Fellowships</option>
            <option value="scholarship">Scholarships</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div style={filterBoxStyle}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="All">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: '0', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={thStyle}>Opportunity</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Deadline</th>
                <th style={thStyle}>Clicks</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No opportunities found.</td></tr>
              ) : filtered.map(opp => (
                <tr key={opp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        onClick={() => handleToggleFeatured(opp.id, opp.featured)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <Star size={18} fill={opp.featured ? "#f59e0b" : "none"} color={opp.featured ? "#f59e0b" : "#475569"} />
                      </button>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{opp.title}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{opp.organization_name || opp.funder_name || 'No Org'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <Badge variant="outline" style={{ textTransform: 'capitalize' }}>{opp.type}</Badge>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ 
                      fontSize: '0.6875rem', 
                      fontWeight: 700, 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      backgroundColor: opp.status === 'published' ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                      color: opp.status === 'published' ? '#22c55e' : '#94a3b8'
                    }}>
                      {opp.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{opp.deadline || 'No deadline'}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{opp.click_count || 0}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => navigate(`/admin/opportunities/${opp.id}/edit`)} style={actionBtnStyle} title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDuplicate(opp)} style={actionBtnStyle} title="Duplicate">
                        <Copy size={14} />
                      </button>
                      {opp.status === 'published' ? (
                        <button onClick={() => handleStatusChange(opp.id, 'draft')} style={actionBtnStyle} title="Unpublish">
                          <XCircle size={14} />
                        </button>
                      ) : (
                        <button onClick={() => handleStatusChange(opp.id, 'published')} style={{ ...actionBtnStyle, color: '#22c55e' }} title="Publish">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(opp.id)} style={{ ...actionBtnStyle, color: '#ef4444' }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                      <a href={opp.apply_link} target="_blank" rel="noopener noreferrer" style={actionBtnStyle} title="View External">
                        <ExternalLink size={14} />
                      </a>
                    </div>
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

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card style={{ padding: '20px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
    </div>
    <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    <p style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{value.toLocaleString()}</p>
  </Card>
);

const filterBoxStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' };
const filterInputStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#e2e8f0', fontSize: '0.8125rem', outline: 'none', width: '200px' };
const selectStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#e2e8f0', fontSize: '0.8125rem', outline: 'none', cursor: 'pointer' };
const thStyle: React.CSSProperties = { padding: '14px 20px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle: React.CSSProperties = { padding: '14px 20px', verticalAlign: 'middle' };
const actionBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' };
