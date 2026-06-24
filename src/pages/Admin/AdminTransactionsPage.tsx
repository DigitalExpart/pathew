import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-get-users', {
          body: { action: 'get_all_transactions' }
        });
        if (error) throw error;
        setTransactions(data?.transactions || []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>Transactions</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Platform-wide credit transaction history</p>
      </div>

      <Card style={{ padding: '0', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Type', 'Description', 'Amount', 'User', 'Date'].map(h => (
                <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading transactions...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No transactions recorded yet.</td></tr>
            ) : transactions.map(tx => (
              <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: tx.type === 'credit' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)' }}>
                      {tx.type === 'credit' ? <ArrowDownRight size={14} color="#22c55e" /> : <ArrowUpRight size={14} color="#f59e0b" />}
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'capitalize' }}>{tx.type}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '0.8125rem' }}>{tx.description || '—'}</td>
                <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: '0.8125rem', color: tx.type === 'credit' ? '#22c55e' : '#e2e8f0' }}>{tx.type === 'credit' ? '+' : ''}{tx.amount}</td>
                <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.8125rem', color: '#e2e8f0' }}>{tx.user_name}</td>
                <td style={{ padding: '14px 20px', fontSize: '0.8125rem', color: '#64748b' }}>{new Date(tx.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
