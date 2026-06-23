import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Rss, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, Plus, Edit3, Trash2 } from 'lucide-react';
import { rssService } from '../../services/rssService';
import type { RssSource, RssSyncLog } from '../../services/rssService';

export const AdminRssSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<RssSource[]>([]);
  const [logs, setLogs] = useState<RssSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSource, setNewSource] = useState({
    name: '',
    website_url: '',
    feed_url: '',
    enabled: true,
    sync_interval_hours: 24,
    classification_rules: '{"categories_to_job": ["Remote Jobs"], "title_to_job": ["Now Hiring", "Hiring:"], "title_to_fellowship": ["Fellowship"], "title_to_scholarship": ["Scholarship"], "title_to_grant": ["Grant", "Funding", "Fund "], "categories_to_opportunity": ["Opportunities for Women"]}'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sourcesData, logsData] = await Promise.all([
        rssService.fetchSources(),
        rssService.fetchSyncLogs()
      ]);
      setSources(sourcesData);
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching RSS data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async (sourceId: string) => {
    setSyncing(sourceId);
    try {
      await rssService.triggerSync(sourceId);
      await fetchData();
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please check the console or sync logs.');
    } finally {
      setSyncing(null);
    }
  };

  const handleToggleEnabled = async (source: RssSource) => {
    try {
      await rssService.updateSource(source.id, { enabled: !source.enabled });
      setSources(sources.map(s => s.id === source.id ? { ...s, enabled: !s.enabled } : s));
    } catch (error) {
      console.error('Error updating source:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this source? This will not delete the imported opportunities.')) return;
    try {
      await rssService.deleteSource(id);
      setSources(sources.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting source:', error);
    }
  };

  const handleAddSource = async () => {
    try {
      let rules = {};
      try {
        rules = JSON.parse(newSource.classification_rules);
      } catch (e) {
        alert('Invalid JSON in classification rules.');
        return;
      }
      
      await rssService.addSource({
        name: newSource.name,
        website_url: newSource.website_url,
        feed_url: newSource.feed_url,
        enabled: newSource.enabled,
        sync_interval_hours: newSource.sync_interval_hours,
        classification_rules: rules
      });
      setIsAddingSource(false);
      setNewSource({
        name: '',
        website_url: '',
        feed_url: '',
        enabled: true,
        sync_interval_hours: 24,
        classification_rules: '{"categories_to_job": ["Remote Jobs"], "title_to_job": ["Now Hiring", "Hiring:"], "title_to_fellowship": ["Fellowship"], "title_to_scholarship": ["Scholarship"], "title_to_grant": ["Grant", "Funding", "Fund "], "categories_to_opportunity": ["Opportunities for Women"]}'
      });
      fetchData();
    } catch (error) {
      console.error('Error adding source:', error);
      alert('Failed to add source.');
    }
  };

  const stats = {
    total: sources.length,
    active: sources.filter(s => s.enabled).length,
    imported: sources.reduce((acc, s) => acc + (s.items_imported || 0), 0)
  };

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>RSS Sources</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Manage automated content ingestion feeds</p>
        </div>
        <Button style={{ gap: '8px' }} onClick={() => setIsAddingSource(true)}>
          <Plus size={18} /> Add Source
        </Button>
      </div>

      {isAddingSource && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ backgroundColor: '#0f172a', width: '500px', maxWidth: '90%', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Add RSS Source</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Source Name</label>
                <input type="text" value={newSource.name} onChange={e => setNewSource({...newSource, name: e.target.value})} style={inputStyle} placeholder="Extraordinary Woman Blog" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Website URL</label>
                <input type="text" value={newSource.website_url} onChange={e => setNewSource({...newSource, website_url: e.target.value})} style={inputStyle} placeholder="https://extraordinarywomanblog.com" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Feed URL</label>
                <input type="text" value={newSource.feed_url} onChange={e => setNewSource({...newSource, feed_url: e.target.value})} style={inputStyle} placeholder="https://extraordinarywomanblog.com/feed/" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Classification Rules (JSON)</label>
                <textarea value={newSource.classification_rules} onChange={e => setNewSource({...newSource, classification_rules: e.target.value})} style={{...inputStyle, minHeight: '100px', fontFamily: 'monospace', fontSize: '0.75rem'}} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <Button variant="outline" onClick={() => setIsAddingSource(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddSource}>Save Source</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <StatCard label="Total Sources" value={stats.total} icon={Rss} color="#3b82f6" />
        <StatCard label="Active Sources" value={stats.active} icon={CheckCircle} color="#22c55e" />
        <StatCard label="Total Items Imported" value={stats.imported} icon={ExternalLink} color="#a855f7" />
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Configured Feeds</h2>
      
      <Card style={{ padding: '0', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: '32px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={thStyle}>Source Name</th>
                <th style={thStyle}>Feed URL</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Last Sync</th>
                <th style={thStyle}>Imported</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && sources.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading sources...</td></tr>
              ) : sources.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No RSS sources configured.</td></tr>
              ) : sources.map(source => (
                <tr key={source.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={tdStyle}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{source.name}</p>
                    <a href={source.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none' }}>Visit Website</a>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontFamily: 'monospace' }}>{source.feed_url}</span>
                  </td>
                  <td style={tdStyle}>
                    <button 
                      onClick={() => handleToggleEnabled(source)}
                      style={{ 
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      {source.enabled ? (
                         <Badge variant="outline" style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.2)', backgroundColor: 'rgba(34,197,94,0.1)' }}>Active</Badge>
                      ) : (
                         <Badge variant="outline">Disabled</Badge>
                      )}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    {source.last_sync_at ? (
                      <div>
                        <p style={{ fontSize: '0.8125rem', color: '#e2e8f0' }}>{new Date(source.last_sync_at).toLocaleString()}</p>
                        <p style={{ fontSize: '0.75rem', color: source.last_sync_status === 'success' ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          {source.last_sync_status === 'success' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {source.last_sync_status}
                        </p>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Never synced</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{source.items_imported || 0}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button 
                        size="sm" 
                        variant={source.enabled ? "primary" : "outline"}
                        onClick={() => handleSync(source.id)}
                        disabled={!source.enabled || syncing === source.id}
                        style={{ gap: '6px', fontSize: '0.75rem', padding: '6px 12px' }}
                      >
                        <RefreshCw size={14} className={syncing === source.id ? "spin" : ""} />
                        {syncing === source.id ? 'Syncing...' : 'Sync Now'}
                      </Button>
                      <button style={actionBtnStyle} title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(source.id)} style={{ ...actionBtnStyle, color: '#ef4444' }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Recent Sync Logs</h2>
      <Card style={{ padding: '0', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Found</th>
                <th style={thStyle}>New</th>
                <th style={thStyle}>Updated</th>
                <th style={thStyle}>Errors</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                 <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No sync logs available.</td></tr>
              ) : logs.map(log => {
                const source = sources.find(s => s.id === log.source_id);
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} color="#64748b" />
                        <span style={{ fontSize: '0.8125rem', color: '#e2e8f0' }}>{new Date(log.started_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{source?.name || 'Unknown Source'}</span>
                    </td>
                    <td style={tdStyle}>
                       <span style={{ 
                        fontSize: '0.6875rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase',
                        backgroundColor: log.status === 'success' ? 'rgba(34,197,94,0.1)' : log.status === 'running' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
                        color: log.status === 'success' ? '#22c55e' : log.status === 'running' ? '#3b82f6' : '#ef4444'
                      }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={tdStyle}><span style={{ fontSize: '0.875rem' }}>{log.items_found}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: 600 }}>+{log.items_new}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: '0.875rem', color: '#3b82f6' }}>{log.items_updated}</span></td>
                    <td style={tdStyle}>
                      {log.error_message ? (
                        <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{log.error_message}</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <style>
        {`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          .spin { animation: spin 1s linear infinite; }
        `}
      </style>
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

const thStyle: React.CSSProperties = { padding: '14px 20px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle: React.CSSProperties = { padding: '14px 20px', verticalAlign: 'middle' };
const actionBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#e2e8f0', outline: 'none', fontSize: '0.875rem' };
