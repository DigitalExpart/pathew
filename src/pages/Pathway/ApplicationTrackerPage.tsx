import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  ClipboardList,
  Plus,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  FileText,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  getApplicationTrackerEntries,
  saveApplicationTrackerEntries,
  type ApplicationTrackerEntry,
} from '../../services/applicationTrackerService';

const STATUS_OPTIONS = [
  'Applied',
  'Ongoing',
  'Under Review',
  'Cancelled',
  'Hired',
  'Rejected',
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Applied': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' };
    case 'Ongoing': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' };
    case 'Under Review': return { bg: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.25)' };
    case 'Cancelled': return { bg: 'rgba(107, 114, 128, 0.1)', color: '#9ca3af', border: 'rgba(107, 114, 128, 0.25)' };
    case 'Hired': return { bg: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.25)' };
    case 'Rejected': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'rgba(239, 68, 68, 0.25)' };
    default: return { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'var(--border-color)' };
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Applied': return Briefcase;
    case 'Ongoing': return Clock;
    case 'Under Review': return AlertCircle;
    case 'Cancelled': return XCircle;
    case 'Hired': return CheckCircle;
    case 'Rejected': return XCircle;
    default: return FileText;
  }
};

const getActionBadgeColor = (action: string) => {
  if (action.includes('CV')) return { bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' };
  if (action.includes('Cover Letter')) return { bg: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' };
  if (action.includes('Grant') || action.includes('Proposal')) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' };
  if (action.includes('Applied')) return { bg: 'rgba(34, 197, 94, 0.1)', color: '#4ade80' };
  return { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
};

export const ApplicationTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<ApplicationTrackerEntry[]>([]);
  const [docId, setDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: '', action: 'Applied', status: 'Applied', deadline: '', notes: '' });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const formatDateForInput = (dStr?: string) => {
    if (!dStr) return '';
    const trimmed = dStr.trim();
    if (trimmed.toLowerCase().includes('ongoing') || trimmed.toLowerCase().includes('no deadline')) {
      return '';
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.substring(0, 10);
    }
    try {
      const d = new Date(trimmed);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const fetchEntries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getApplicationTrackerEntries(user.id);
      setDocId(result.docId);

      let hasChanges = false;
      const cleanedEntries = (result.entries || []).map(e => {
        let updated = { ...e };

        // Fix legacy status: If action is 'Applied' and status was incorrectly 'Ongoing', fix status to 'Applied'
        if (updated.action === 'Applied' && updated.status === 'Ongoing') {
          updated.status = 'Applied';
          hasChanges = true;
        }

        // Map ongoing opportunity deadline string to 'Ongoing'
        if (updated.deadline && updated.deadline.toLowerCase().includes('ongoing')) {
          if (updated.deadline !== 'Ongoing') {
            updated.deadline = 'Ongoing';
            hasChanges = true;
          }
        } else if (!updated.deadline && updated.name.toLowerCase().includes('womenlift')) {
          updated.deadline = 'Ongoing';
          hasChanges = true;
        }

        return updated;
      });

      setEntries(cleanedEntries);

      if (hasChanges && result.docId) {
        await saveApplicationTrackerEntries(user.id, result.docId, cleanedEntries);
      }
    } catch (error) {
      console.error('Error fetching tracker:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (entryId: string, newStatus: string) => {
    const updated = entries.map(e => e.id === entryId ? { ...e, status: newStatus } : e);
    setEntries(updated);
    if (user) await saveApplicationTrackerEntries(user.id, docId, updated);
  };

  const handleDeadlineChange = async (entryId: string, newDeadline: string) => {
    const updated = entries.map(e => e.id === entryId ? { ...e, deadline: newDeadline } : e);
    setEntries(updated);
    if (user) await saveApplicationTrackerEntries(user.id, docId, updated);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    const updated = entries.filter(e => e.id !== entryId);
    setEntries(updated);
    if (user) await saveApplicationTrackerEntries(user.id, docId, updated);
  };

  const handleAddEntry = async () => {
    if (!user || !newEntry.name.trim()) return;
    const entry: ApplicationTrackerEntry = {
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      name: newEntry.name.trim(),
      action: newEntry.action,
      status: newEntry.status,
      date: new Date().toISOString(),
      deadline: newEntry.deadline || undefined,
      notes: newEntry.notes,
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    setIsAddingNew(false);
    setNewEntry({ name: '', action: 'Applied', status: 'Applied', deadline: '', notes: '' });
    await saveApplicationTrackerEntries(user.id, docId, updated);
  };

  const handleNotesChange = async (entryId: string, notes: string) => {
    const updated = entries.map(e => e.id === entryId ? { ...e, notes } : e);
    setEntries(updated);
  };

  const handleNotesBlur = async () => {
    if (user) await saveApplicationTrackerEntries(user.id, docId, entries);
  };

  // Filter & search
  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || e.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Stats
  const stats = {
    total: entries.length,
    applied: entries.filter(e => e.status === 'Applied').length,
    ongoing: entries.filter(e => e.status === 'Ongoing' || e.status === 'Under Review').length,
    hired: entries.filter(e => e.status === 'Hired').length,
    rejected: entries.filter(e => e.status === 'Rejected').length,
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            <ClipboardList size={isMobile ? 28 : 36} color="var(--accent-primary)" style={{ marginRight: '12px' }} />
            {t('applicationTracker.title', 'Application Tracker')}
          </h1>
          <p style={subtitleStyle}>
            {t('applicationTracker.subtitle', 'Track all your job applications, CV generations, and grant submissions in one place.')}
          </p>
        </div>
      </header>

      {/* Stats Cards */}
      <div style={statsGridStyle}>
        {[
          { label: 'Total Applications', value: stats.total, color: 'var(--accent-primary)', icon: ClipboardList },
          { label: 'Applied', value: stats.applied, color: '#60a5fa', icon: Briefcase },
          { label: 'In Progress', value: stats.ongoing, color: '#fbbf24', icon: Clock },
          { label: 'Hired', value: stats.hired, color: '#4ade80', icon: CheckCircle },
        ].map((stat, i) => (
          <Card key={i} style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ ...statIconStyle, backgroundColor: `${stat.color}15` }}>
                <stat.icon size={20} color={stat.color} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={searchContainerStyle}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t('applicationTracker.search', 'Search applications...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Filter dropdown */}
          <div style={{ position: 'relative' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{ gap: '6px', fontSize: '0.8125rem' }}
            >
              <Filter size={14} />
              {filterStatus === 'All' ? 'All Status' : filterStatus}
              <ChevronDown size={14} />
            </Button>
            {isFilterOpen && (
              <div style={filterDropdownStyle}>
                <button
                  onClick={() => { setFilterStatus('All'); setIsFilterOpen(false); }}
                  style={{ ...filterOptionStyle, fontWeight: filterStatus === 'All' ? 700 : 400 }}
                >
                  All Status
                </button>
                {STATUS_OPTIONS.map(status => (
                  <button
                    key={status}
                    onClick={() => { setFilterStatus(status); setIsFilterOpen(false); }}
                    style={{ ...filterOptionStyle, fontWeight: filterStatus === status ? 700 : 400 }}
                  >
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: getStatusColor(status).color,
                      display: 'inline-block', marginRight: '8px'
                    }} />
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button size="sm" onClick={() => setIsAddingNew(true)} style={{ gap: '6px', fontSize: '0.8125rem' }}>
            <Plus size={14} />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Add New Entry Form */}
      {isAddingNew && (
        <Card style={{ marginBottom: '24px', padding: '20px', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="var(--accent-primary)" />
            {t('applicationTracker.addNew', 'Add New Application')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Name / Title</label>
              <input
                type="text"
                value={newEntry.name}
                onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                placeholder="e.g. Software Engineer at Google"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>Action</label>
              <select
                value={newEntry.action}
                onChange={(e) => setNewEntry({ ...newEntry, action: e.target.value })}
                style={selectStyle}
              >
                <option value="Applied">Applied</option>
                <option value="CV Generated">CV Generated</option>
                <option value="Cover Letter Generated">Cover Letter Generated</option>
                <option value="Proposal Generated">Proposal Generated</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={newEntry.status}
                onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value })}
                style={selectStyle}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Deadline (optional)</label>
              <input
                type="date"
                value={newEntry.deadline || ''}
                onChange={(e) => setNewEntry({ ...newEntry, deadline: e.target.value })}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <input
                type="text"
                value={newEntry.notes}
                onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                placeholder="Any extra notes..."
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="outline" size="sm" onClick={() => setIsAddingNew(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddEntry} disabled={!newEntry.name.trim()}>Save Entry</Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)', width: '100%' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={{ ...thStyle, width: '28%', minWidth: '220px' }}>Name</th>
                <th style={{ ...thStyle, width: '15%', minWidth: '150px' }}>Action</th>
                <th style={{ ...thStyle, width: '15%', minWidth: '140px' }}>Status</th>
                <th style={{ ...thStyle, width: '15%', minWidth: '140px' }}>Deadline</th>
                <th style={{ ...thStyle, width: '11%', minWidth: '110px' }}>Date</th>
                <th style={{ ...thStyle, width: '11%', minWidth: '160px' }}>Notes</th>
                <th style={{ ...thStyle, width: '5%', minWidth: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px', textAlign: 'center' }}>
                    <Loader2 size={32} color="var(--accent-primary)" className="animate-spin" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading your applications...</p>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px', textAlign: 'center' }}>
                    <ClipboardList size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {entries.length === 0 ? 'No applications yet' : 'No matching applications'}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {entries.length === 0
                        ? 'Your applications will appear here when you apply to opportunities or generate documents.'
                        : 'Try adjusting your search or filter.'}
                    </p>
                    {entries.length === 0 && (
                      <Button
                        size="sm"
                        onClick={() => setIsAddingNew(true)}
                        style={{ marginTop: '16px', gap: '6px' }}
                      >
                        <Plus size={14} /> Add Your First Entry
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const statusColors = getStatusColor(entry.status);
                  const actionColors = getActionBadgeColor(entry.action);
                  const StatusIcon = getStatusIcon(entry.status);
                  return (
                    <tr key={entry.id} style={tableRowStyle}>
                      {/* Name */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px', height: '36px',
                            borderRadius: '10px',
                            backgroundColor: statusColors.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <StatusIcon size={16} color={statusColors.color} />
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                            {entry.name}
                          </span>
                        </div>
                      </td>
                      {/* Action */}
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          backgroundColor: actionColors.bg,
                          color: actionColors.color,
                        }}>
                          {entry.action === 'Grant Generated' ? 'Proposal Generated' : entry.action}
                        </span>
                      </td>
                      {/* Status */}
                      <td style={tdStyle}>
                        <select
                          value={entry.status}
                          onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${statusColors.border}`,
                            backgroundColor: statusColors.bg,
                            color: statusColors.color,
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            outline: 'none',
                            width: '100%',
                          }}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      {/* Deadline */}
                      <td style={tdStyle}>
                        {entry.deadline === 'Ongoing' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              onClick={() => handleDeadlineChange(entry.id, '')}
                              title="Click to set a specific deadline date"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                color: '#fbbf24',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                cursor: 'pointer',
                                width: '100%',
                              }}
                            >
                              <span>Ongoing</span>
                              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Edit</span>
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="date"
                              value={formatDateForInput(entry.deadline)}
                              onChange={(e) => handleDeadlineChange(entry.id, e.target.value)}
                              title={entry.deadline ? `Deadline: ${new Date(entry.deadline).toLocaleDateString()}` : 'Click to select deadline'}
                              style={{
                                padding: '7px 10px',
                                borderRadius: '8px',
                                border: entry.deadline ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)',
                                backgroundColor: entry.deadline ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-primary)',
                                color: entry.deadline ? '#fbbf24' : 'var(--text-muted)',
                                fontWeight: entry.deadline ? 600 : 400,
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                                outline: 'none',
                                flex: 1,
                                colorScheme: 'dark',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeadlineChange(entry.id, 'Ongoing')}
                              title="Set deadline to Ongoing"
                              style={{
                                padding: '7px 8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.color = '#fbbf24'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                              Ongoing
                            </button>
                          </div>
                        )}
                      </td>
                      {/* Date */}
                      <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      {/* Notes */}
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={entry.notes || ''}
                          onChange={(e) => handleNotesChange(entry.id, e.target.value)}
                          onBlur={handleNotesBlur}
                          placeholder="Add notes..."
                          style={notesInputStyle}
                        />
                      </td>
                      {/* Delete */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          style={deleteButtonStyle}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary footer */}
      {entries.length > 0 && (
        <div style={footerStyle}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing {filteredEntries.length} of {entries.length} entries
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0',
  width: '100%',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  marginBottom: '8px',
  lineHeight: 1.2,
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '1rem',
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '16px',
  marginBottom: '24px',
};

const statCardStyle: React.CSSProperties = {
  padding: '20px',
};

const statIconStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const searchContainerStyle: React.CSSProperties = {
  position: 'relative',
  flex: '1 1 200px',
  maxWidth: '400px',
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px 10px 40px',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const filterDropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '4px',
  width: '180px',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  zIndex: 50,
  overflow: 'hidden',
};

const filterOptionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '10px 16px',
  background: 'none',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  transition: 'background-color 0.15s',
  textAlign: 'left',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '970px',
  tableLayout: 'fixed',
};

const tableHeaderRowStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--border-color)',
  backgroundColor: 'rgba(0,0,0,0.15)',
};

const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#ffffff',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  transition: 'background-color 0.15s ease',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle',
};

const notesInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid transparent',
  borderRadius: '6px',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: '0.8125rem',
  outline: 'none',
  transition: 'border-color 0.2s, background 0.2s',
};

const deleteButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '6px',
  transition: 'color 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const footerStyle: React.CSSProperties = {
  marginTop: '16px',
  textAlign: 'right',
};
