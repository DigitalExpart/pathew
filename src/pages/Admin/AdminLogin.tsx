import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import logo from '../../assets/images/logo.png';

export const AdminLogin: React.FC = () => {
  const { adminLogin, isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAdmin) navigate('/admin/dashboard');
  }, [isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const success = await adminLogin(email, password);
      if (success) {
        navigate('/admin/dashboard');
      } else {
        setError('Invalid admin credentials or insufficient permissions');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrapperStyle}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src={logo} alt="PATHEW" style={{ height: '40px', marginBottom: '24px' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '6px 16px', borderRadius: '999px', marginBottom: '16px' }}>
            <Shield size={14} color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Portal</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Admin Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Sign in to manage the PATHEW platform</p>
        </div>

        <Card style={{ padding: '32px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <div style={inputBoxStyle}>
                <Mail size={16} color="#64748b" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@gmail.com" required style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={inputBoxStyle}>
                <Lock size={16} color="#64748b" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px' }}>
                <AlertCircle size={16} color="#ef4444" />
                <span style={{ color: '#ef4444', fontSize: '0.8125rem' }}>{error}</span>
              </div>
            )}

            <Button type="submit" style={{ width: '100%', padding: '14px' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Admin'}
            </Button>
          </form>
        </Card>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.75rem', color: '#475569' }}>
          Protected area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
};

const wrapperStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  backgroundColor: '#020617', padding: '24px',
  background: 'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.05) 0%, transparent 50%), #020617',
};
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '8px', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8' };
const inputBoxStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' };
const inputStyle: React.CSSProperties = { flex: 1, background: 'none', border: 'none', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none' };
