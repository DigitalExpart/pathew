import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sparkles, Mail, Lock, Globe, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

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
          <img src={logo} alt="PATHEW Logo" style={{ height: '48px', objectFit: 'contain' }} />
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
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    marketingConsent: false,
    termsAccepted: false,
    privacyAccepted: false,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.termsAccepted) {
      newErrors.terms = 'You must accept the Terms & Conditions';
    }
    if (!formData.privacyAccepted) {
      newErrors.privacy = 'You must accept the Privacy Policy';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Mock saving state
      console.log('Registration Data:', {
        ...formData,
        timestamp: new Date().toISOString(),
        privacyVersion: '1.0.0'
      });
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div style={authWrapperStyle}>
        <div style={authContentStyle}>
          <Card style={{ padding: '48px', textAlign: 'center' }}>
            <div style={verifyIconStyle}>
              <Mail size={48} color="var(--accent-primary)" />
            </div>
            <h2 style={{ marginBottom: '16px' }}>Verify your email</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
              We've sent a verification link to <strong style={{ color: 'var(--text-primary)' }}>{formData.email}</strong>. 
              Please click the link to activate your account.
            </p>
            <Button onClick={() => navigate('/login')} style={{ width: '100%' }}>
              Back to Login
            </Button>
            <p style={{ marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Didn't receive the email? <a href="#" style={linkStyle}>Resend link</a>
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={authWrapperStyle}>
      <Link to="/" style={backButtonStyle}>
        <ArrowLeft size={20} /> Back to Home
      </Link>
      
      <div style={authContentStyle}>
        <div style={logoWrapperStyle}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '48px', objectFit: 'contain' }} />
        </div>

        <Card style={{ padding: '40px' }}>
          <h2 style={{ marginBottom: '8px' }}>Create an account</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Start your journey with Pathew Assistance.
          </p>

          <form onSubmit={handleSignUp} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Full Name</label>
              <input 
                type="text" 
                placeholder="First and last name" 
                style={baseInputStyle} 
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required 
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Email Address</label>
              <input 
                type="email" 
                placeholder="name@company.com" 
                style={baseInputStyle} 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Password</label>
              <input 
                type="password" 
                placeholder="Min. 8 characters" 
                style={baseInputStyle} 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required 
              />
              <p style={helperTextStyle}>Must contain at least 8 characters, one uppercase and one number.</p>
              {errors.password && <p style={errorTextStyle}>{errors.password}</p>}
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Confirm Password</label>
              <input 
                type="password" 
                placeholder="Repeat password" 
                style={baseInputStyle} 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required 
              />
              {errors.confirmPassword && <p style={errorTextStyle}>{errors.confirmPassword}</p>}
            </div>

            <div style={checkboxContainerStyle}>
              <div style={checkboxRowStyle}>
                <input 
                  type="checkbox" 
                  id="marketing"
                  checked={formData.marketingConsent}
                  onChange={(e) => setFormData({...formData, marketingConsent: e.target.checked})}
                />
                <label htmlFor="marketing" style={checkboxLabelStyle}>
                  I want to receive product updates and opportunity alerts
                </label>
              </div>

              <div style={checkboxRowStyle}>
                <input 
                  type="checkbox" 
                  id="terms"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})}
                  required
                />
                <label htmlFor="terms" style={checkboxLabelStyle}>
                  I agree to the <Link to="/terms" style={linkStyle}>Terms & Conditions</Link>
                </label>
              </div>
              {errors.terms && <p style={errorTextStyle}>{errors.terms}</p>}

              <div style={checkboxRowStyle}>
                <input 
                  type="checkbox" 
                  id="privacy"
                  checked={formData.privacyAccepted}
                  onChange={(e) => setFormData({...formData, privacyAccepted: e.target.checked})}
                  required
                />
                <label htmlFor="privacy" style={checkboxLabelStyle}>
                  I agree to the <Link to="/privacy-policy" style={linkStyle}>Privacy Policy</Link>
                </label>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '28px' }}>
                Version 1.0.0 (Effective May 2024)
              </p>
              {errors.privacy && <p style={errorTextStyle}>{errors.privacy}</p>}
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
  textDecoration: 'none',
};

const helperTextStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  marginTop: '4px',
};

const errorTextStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#ef4444',
  marginTop: '4px',
  fontWeight: 500,
};

const checkboxContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginTop: '8px',
};

const checkboxRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  cursor: 'pointer',
};

const checkboxLabelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
  lineHeight: '1.4',
  cursor: 'pointer',
};

const verifyIconStyle: React.CSSProperties = {
  width: '96px',
  height: '96px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
};
