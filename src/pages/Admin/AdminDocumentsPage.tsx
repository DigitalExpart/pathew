import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { ChevronDown, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminDocumentsPage: React.FC = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('generated_documents').select('id, user_id, document_type, title, version, created_at').order('created_at', { ascending: false }).limit(100);
      setDocs(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const types = ['All', ...Array.from(new Set(docs.map(d => d.document_type).filter(Boolean)))];
  const filtered = typeFilter === 'All' ? docs : docs.filter(d => d.document_type === typeFilter);

  const typeColors: Record<string, string> = { cv: '#3b82f6', cover_letter: '#a855f7', proposal: '#f59e0b', grant: '#22c55e' };

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>Documents</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{docs.length} documents generated across the platform</p>
      </div>

      {/* Type Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {Object.entries(typeColors).map(([type, color]) => (
          <Card key={type} style={{ padding: '20px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '8px' }}>{type.replace('_', ' ')}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{docs.filter(d => d.document_type === type).length}</p>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ background: 'none', border: 'none', color: '#e2e8f0', fontSize: '0.8125rem', outline: 'none', cursor: 'pointer' }}>
            {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t.replace('_', ' ')}</option>)}
          </select>
          <ChevronDown size={14} color="#64748b" />
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: '0', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Title', 'Type', 'Version', 'User ID', 'Created'].map(h => (
                <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No documents found.</td></tr>
            ) : filtered.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={16} color={typeColors[d.document_type] || '#64748b'} />
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{d.title}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700, backgroundColor: `${typeColors[d.document_type] || '#64748b'}20`, color: typeColors[d.document_type] || '#64748b' }}>
                    {(d.document_type || '').replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '0.8125rem', fontWeight: 600 }}>v{d.version}</td>
                <td style={{ padding: '14px 20px', fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{d.user_id?.slice(0, 8)}...</td>
                <td style={{ padding: '14px 20px', fontSize: '0.8125rem', color: '#64748b' }}>{new Date(d.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
