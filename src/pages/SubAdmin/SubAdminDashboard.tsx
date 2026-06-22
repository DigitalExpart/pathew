import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
  BarChart3,
  Users,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const SubAdminDashboard: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Tab State: 'opportunities' | 'customers'
  const [activeTab, setActiveTab] = useState<'opportunities' | 'customers'>('opportunities');

  // Opportunities State
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [oppsLoading, setOppsLoading] = useState(true);
  const [oppSearch, setOppSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Customers State
  const [customers, setCustomers] = useState<any[]>([]);
  const [custLoading, setCustLoading] = useState(true);
  const [custSearch, setCustSearch] = useState('');

  // Fetch Opportunities
  const fetchOpportunities = async () => {
    setOppsLoading(true);
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setOppsLoading(false);
    }
  };

  // Fetch Customers
  const fetchCustomers = async () => {
    setCustLoading(true);
    try {
      // Fetch safe customer details: name, email (from profile metadata or id), credits, plan, date joined, role
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, subscription_plan, credits, role, created_at, last_active_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customer directory:', error);
    } finally {
      setCustLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'sub_admin') {
      fetchOpportunities();
      fetchCustomers();
    }
  }, [profile]);

  // Security Check: Guard page if not a sub-admin
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: 'var(--text-secondary)' }}>
        Loading permissions...
      </div>
    );
  }

  if (!profile || profile.role !== 'sub_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Opportunity Actions
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
      console.error('Error deleting opportunity:', error);
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
      console.error('Error duplicating opportunity:', error);
    }
  };

  // Filters for Opportunities
  const filteredOpps = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(oppSearch.toLowerCase()) || 
                          (opp.organization_name || '').toLowerCase().includes(oppSearch.toLowerCase());
    const matchesType = typeFilter === 'All' || opp.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || opp.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filters for Customers
  const filteredCusts = customers.filter(cust => {
    return (cust.full_name || '').toLowerCase().includes(custSearch.toLowerCase()) || 
           cust.id.includes(custSearch);
  });

  // Opportunities Stats
  const oppStats = {
    total: opportunities.length,
    published: opportunities.filter(o => o.status === 'published').length,
    drafts: opportunities.filter(o => o.status === 'draft').length,
    featured: opportunities.filter(o => o.featured).length
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }} className="text-gradient">
            Sub-Admin Workspace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Welcome, {profile.full_name || 'Sub Admin'}. You have safe administrative access to post opportunities and check customer records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', padding: '6px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', backgroundColor: '#f59e0b', borderRadius: '50%', display: 'inline-block' }}></span>
            Role: Sub Admin
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '32px', gap: '24px' }}>
        <button 
          onClick={() => setActiveTab('opportunities')}
          style={{
            ...tabButtonStyle,
            color: activeTab === 'opportunities' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            borderBottomColor: activeTab === 'opportunities' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <Megaphone size={18} />
          <span>Opportunity Posting</span>
        </button>
        <button 
          onClick={() => setActiveTab('customers')}
          style={{
            ...tabButtonStyle,
            color: activeTab === 'customers' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            borderBottomColor: activeTab === 'customers' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <Users size={18} />
          <span>Customer Directory</span>
        </button>
      </div>

      {/* TAB CONTENT: OPPORTUNITIES */}
      {activeTab === 'opportunities' && (
        <div className="animate-fade-in">
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <StatCard label="Total Posts" value={oppStats.total} icon={BarChart3} color="#3b82f6" />
            <StatCard label="Published" value={oppStats.published} icon={CheckCircle} color="#22c55e" />
            <StatCard label="Drafts" value={oppStats.drafts} icon={Archive} color="#64748b" />
            <StatCard label="Featured" value={oppStats.featured} icon={Star} color="#f59e0b" />
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
              <div style={filterBoxStyle}>
                <Search size={16} color="var(--text-muted)" />
                <input 
                  value={oppSearch} 
                  onChange={e => setOppSearch(e.target.value)} 
                  placeholder="Search opportunities..." 
                  style={filterInputStyle} 
                />
              </div>
              <div style={filterBoxStyle}>
                <Filter size={16} color="var(--text-muted)" />
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
                  <option value="All">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <Button onClick={() => navigate('/sub-admin/opportunities/new')} style={{ gap: '8px', padding: '10px 20px' }}>
              <Plus size={18} /> New Opportunity
            </Button>
          </div>

          {/* Opportunities Table */}
          <Card style={{ padding: '0', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <th style={thStyle}>Opportunity</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Deadline</th>
                    <th style={thStyle}>Clicks</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {oppsLoading ? (
                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading postings...</td></tr>
                  ) : filteredOpps.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No opportunities found.</td></tr>
                  ) : filteredOpps.map(opp => (
                    <tr key={opp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button 
                            onClick={() => handleToggleFeatured(opp.id, opp.featured)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <Star size={18} fill={opp.featured ? "#f59e0b" : "none"} color={opp.featured ? "#f59e0b" : "#475569"} />
                          </button>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{opp.title}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opp.organization_name || opp.funder_name || 'No Org'}</p>
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
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{opp.deadline || 'No deadline'}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{opp.click_count || 0}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => navigate(`/sub-admin/opportunities/${opp.id}/edit`)} style={actionBtnStyle} title="Edit">
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
                          {opp.apply_link && (
                            <a href={opp.apply_link} target="_blank" rel="noopener noreferrer" style={actionBtnStyle} title="View External">
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="animate-fade-in">
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={filterBoxStyle}>
              <Search size={16} color="var(--text-muted)" />
              <input 
                value={custSearch} 
                onChange={e => setCustSearch(e.target.value)} 
                placeholder="Search customers by name or ID..." 
                style={{ ...filterInputStyle, width: '280px' }} 
              />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Showing {filteredCusts.length} total clients
            </p>
          </div>

          {/* Customers Table */}
          <Card style={{ padding: '0', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <th style={thStyle}>Customer</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Plan</th>
                    <th style={thStyle}>Credits</th>
                    <th style={thStyle}>Joined</th>
                    <th style={thStyle}>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {custLoading ? (
                    <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading directory...</td></tr>
                  ) : filteredCusts.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No customers found.</td></tr>
                  ) : filteredCusts.map(cust => (
                    <tr key={cust.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                            {(cust.full_name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{cust.full_name || 'Unnamed User'}</p>
                            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{cust.email || cust.id.slice(0, 8) + '...'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ 
                          fontSize: '0.6875rem', 
                          fontWeight: 700, 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          backgroundColor: cust.role === 'sub_admin' ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.1)',
                          color: cust.role === 'sub_admin' ? '#f59e0b' : '#94a3b8'
                        }}>
                          {cust.role === 'sub_admin' ? 'Sub Admin' : 'User'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '0.6875rem', 
                          fontWeight: 700,
                          backgroundColor: cust.subscription_plan === 'Starter' ? 'rgba(59,130,246,0.15)' : 
                                           cust.subscription_plan === 'Growth' ? 'rgba(245,158,11,0.15)' : 
                                           cust.subscription_plan === 'Power User' ? 'rgba(34,197,94,0.15)' : 
                                           'rgba(100,116,139,0.15)',
                          color: cust.subscription_plan === 'Starter' ? '#3b82f6' : 
                                 cust.subscription_plan === 'Growth' ? '#f59e0b' : 
                                 cust.subscription_plan === 'Power User' ? '#22c55e' : 
                                 '#64748b'
                        }}>
                          {cust.subscription_plan || 'Free'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cust.credits ?? 0}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                          {cust.created_at ? new Date(cust.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                          {cust.last_active_at ? new Date(cust.last_active_at).toLocaleDateString() : 'Never'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Sub Components & Styles
const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
    </div>
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{value.toLocaleString()}</p>
    </div>
  </Card>
);

const tabButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 8px',
  borderBottom: '2px solid transparent',
  fontSize: '0.9375rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  backgroundColor: 'transparent'
};

const filterBoxStyle: React.CSSProperties = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px', 
  padding: '10px 14px', 
  backgroundColor: 'rgba(255,255,255,0.03)', 
  border: '1px solid var(--border-color)', 
  borderRadius: '10px' 
};

const filterInputStyle: React.CSSProperties = { 
  background: 'none', 
  border: 'none', 
  color: 'var(--text-primary)', 
  fontSize: '0.8125rem', 
  outline: 'none', 
  width: '180px' 
};

const selectStyle: React.CSSProperties = { 
  background: 'none', 
  border: 'none', 
  color: 'var(--text-primary)', 
  fontSize: '0.8125rem', 
  outline: 'none', 
  cursor: 'pointer' 
};

const thStyle: React.CSSProperties = { 
  padding: '14px 20px', 
  textAlign: 'left', 
  fontSize: '0.6875rem', 
  fontWeight: 700, 
  color: 'var(--text-muted)', 
  textTransform: 'uppercase', 
  letterSpacing: '0.05em' 
};

const tdStyle: React.CSSProperties = { 
  padding: '14px 20px', 
  verticalAlign: 'middle',
  fontSize: '0.8125rem'
};

const actionBtnStyle: React.CSSProperties = { 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  width: '32px', 
  height: '32px', 
  borderRadius: '6px', 
  border: '1px solid var(--border-color)', 
  background: 'rgba(255,255,255,0.01)', 
  color: 'var(--text-secondary)', 
  cursor: 'pointer', 
  transition: 'all 0.2s' 
};
