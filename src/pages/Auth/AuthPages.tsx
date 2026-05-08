import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sparkles, Mail, Lock, Globe, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div style={authWrapperStyle}>
      <Link to="/" style={backButtonStyle}>
        <ArrowLeft size={20} /> Back to Home
      </Link>
      
      <div style={authContentStyle}>
        <div style={logoWrapperStyle}>
          <Sparkles size={32} color="var(--accent-primary)" />
          <h1 style={{ fontSize: '1.75rem' }}>Herpath</h1>
        </div>

        <Card style={{ padding: '40px' }}>
          <h2 style={{ marginBottom: '8px' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Enter your credentials to access your account.
          </p>

          <form onSubmit={handleLogin} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Email Address</label>
              <div style={inputWrapperStyle}>
                <Mail size={18} color="var(--text-muted)" />
                <input type="email" placeholder="name@company.com" style={inputStyle} required />
              </div>
            </div>

            <div style={inputGroupStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={labelStyle}>Password</label>
                <a href="#" style={forgotLinkStyle}>Forgot password?</a>
              </div>
              <div style={inputWrapperStyle}>
                <Lock size={18} color="var(--text-muted)" />
                <input type="password" placeholder="••••••••" style={inputStyle} required />
              </div>
            </div>

            <Button type="submit" style={{ width: '100%', marginTop: '12px' }}>
              Sign In
            </Button>
          </form>

          <div style={dividerWrapperStyle}>
            <div style={lineStyle}></div>
            <span style={dividerTextStyle}>Or continue with</span>
            <div style={lineStyle}></div>
          </div>

          <div style={socialGridStyle}>
            <Button variant="outline" style={{ flex: 1, gap: '8px' }}>
              <Globe size={18} /> GitHub
            </Button>
            <Button variant="outline" style={{ flex: 1, gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.288 1.288-3.136 2.536-7.12 2.536-6.392 0-11.408-5.144-11.408-11.536s5.016-11.536 11.408-11.536c3.416 0 5.856 1.336 7.64 3.032l2.312-2.312C18.76 1.112 15.96 0 12.48 0 5.688 0 0 5.688 0 12.48s5.688 12.48 12.48 12.48c3.704 0 6.504-1.224 8.712-3.528 2.272-2.272 2.992-5.456 2.992-8.008 0-.768-.064-1.512-.184-2.24h-11.52z"/>
              </svg>
              Google
            </Button>
          </div>

          <p style={footerTextStyle}>
            Don't have an account? <Link to="/signup" style={linkStyle}>Create account</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/profile-setup');
  };

  return (
    <div style={authWrapperStyle}>
      <Link to="/" style={backButtonStyle}>
        <ArrowLeft size={20} /> Back to Home
      </Link>
      
      <div style={authContentStyle}>
        <div style={logoWrapperStyle}>
          <Sparkles size={32} color="var(--accent-primary)" />
          <h1 style={{ fontSize: '1.75rem' }}>Herpath</h1>
        </div>

        <Card style={{ padding: '40px' }}>
          <h2 style={{ marginBottom: '8px' }}>Create an account</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Start your journey to better opportunities.
          </p>

          <form onSubmit={handleSignUp} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" placeholder="John Doe" style={baseInputStyle} required />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" placeholder="name@company.com" style={baseInputStyle} required />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Password</label>
              <input type="password" placeholder="••••••••" style={baseInputStyle} required />
            </div>

            <Button type="submit" style={{ width: '100%', marginTop: '12px' }}>
              Create Account
            </Button>
          </form>

          <p style={footerTextStyle}>
            Already have an account? <Link to="/login" style={linkStyle}>Log in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

// Shared Styles
const authWrapperStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px',
  position: 'relative',
};

const backButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '40px',
  left: '40px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: 'var(--text-secondary)',
  fontSize: '0.875rem',
  fontWeight: 500,
};

const authContentStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
};

const logoWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  marginBottom: '40px',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
};

const inputWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 16px',
};

const inputStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-primary)',
  width: '100%',
  outline: 'none',
  fontSize: '0.875rem',
};

const baseInputStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 16px',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: '0.875rem',
};

const forgotLinkStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--accent-primary)',
  fontWeight: 600,
};

const dividerWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  margin: '32px 0',
};

const lineStyle: React.CSSProperties = {
  flex: 1,
  height: '1px',
  backgroundColor: 'var(--border-color)',
};

const dividerTextStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const socialGridStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  marginBottom: '32px',
};

const footerTextStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
  marginTop: '32px',
};

const linkStyle: React.CSSProperties = {
  color: 'var(--accent-primary)',
  fontWeight: 600,
};
