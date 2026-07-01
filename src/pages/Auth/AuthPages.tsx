import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.svg';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: 600 }}>Loading Pathew...</div>
      </div>
    );
  }

  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || t('auth.errors.failedLogin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authWrapperStyle}>
      <Link to="/" style={backButtonStyle}>
        <ArrowLeft size={20} /> {t('common.backToHome')}
      </Link>
      
      <div style={authContentStyle}>
        <Link to="/" style={logoWrapperStyle}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '48px', objectFit: 'contain' }} />
        </Link>

        <Card style={{ padding: '40px' }}>
          <h2 style={{ marginBottom: '8px' }}>{t('auth.welcomeBack')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            {t('auth.loginDesc')}
          </p>

          <form onSubmit={handleLogin} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('auth.email')}</label>
              <div style={inputWrapperStyle}>
                <Mail size={18} color="var(--text-muted)" />
                <input 
                  type="email" 
                  placeholder={t('auth.placeholders.email')} 
                  style={inputStyle} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            {error && <p style={errorTextStyle}>{error}</p>}

            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('auth.password')}</label>
              <div style={{...inputWrapperStyle, paddingRight: '12px'}}>
                <Lock size={18} color="var(--text-muted)" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  style={inputStyle} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                <Link to="/forgot-password" style={forgotLinkStyle}>{t('auth.forgotPassword')}</Link>
              </div>
            </div>

            <Button type="submit" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          <p style={footerTextStyle}>
            {t('auth.noAccount')} <Link to="/signup" style={linkStyle}>{t('auth.createAccount')}</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const { user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordMismatch');
    }
    if (formData.password.length < 8) {
      newErrors.password = t('auth.errors.passwordTooShort');
    }
    if (!formData.termsAccepted) {
      newErrors.terms = t('auth.errors.acceptTerms');
    }
    if (!formData.privacyAccepted) {
      newErrors.privacy = t('auth.errors.acceptPrivacy');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      setAuthError(null);
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            }
          }
        });

        if (error) throw error;
        
        if (data.session) {
          navigate('/dashboard', { replace: true });
        } else {
          setIsSubmitted(true);
        }
      } catch (err: any) {
        setAuthError(err.message || t('auth.errors.failedSignUp'));
      } finally {
        setLoading(false);
      }
    }
  };

  if (authLoading || (user && !authLoading)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: 600 }}>Loading Pathew...</div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div style={authWrapperStyle}>
        <div style={authContentStyle}>
          <Card style={{ padding: '48px', textAlign: 'center' }}>
            <div style={verifyIconStyle}>
              <Mail size={48} color="var(--accent-primary)" />
            </div>
            <h2 style={{ marginBottom: '16px' }}>{t('auth.verifyEmail')}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
              {t('auth.verifyEmailDesc')} <strong style={{ color: 'var(--text-primary)' }}>{formData.email}</strong>. 
              {t('auth.verifyEmailSubDesc')}
            </p>
            <Button onClick={() => navigate('/login')} style={{ width: '100%' }}>
              {t('auth.backToLogin')}
            </Button>
            <p style={{ marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {t('auth.didntReceiveEmail')} <a href="#" style={linkStyle}>{t('auth.resendLink')}</a>
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={authWrapperStyle}>
      <Link to="/" style={backButtonStyle}>
        <ArrowLeft size={20} /> {t('common.backToHome')}
      </Link>
      
      <div style={authContentStyle}>
        <Link to="/" style={logoWrapperStyle}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '48px', objectFit: 'contain' }} />
        </Link>

        <Card style={{ padding: '40px' }}>
          <h2 style={{ marginBottom: '8px' }}>{t('auth.createAccountTitle')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            {t('auth.signUpDesc')}
          </p>

          <form onSubmit={handleSignUp} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('auth.fullName')}</label>
              <input 
                type="text" 
                placeholder={t('auth.placeholders.fullName')} 
                style={baseInputStyle} 
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required 
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('auth.email')}</label>
              <input 
                type="email" 
                placeholder={t('auth.placeholders.email')} 
                style={baseInputStyle} 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('auth.password')}</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder={t('auth.placeholders.password')} 
                  style={{...baseInputStyle, width: '100%', paddingRight: '40px'}} 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
                </button>
              </div>
              <p style={helperTextStyle}>{t('auth.passwordHint')}</p>
              {errors.password && <p style={errorTextStyle}>{errors.password}</p>}
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('auth.confirmPassword')}</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder={t('auth.placeholders.repeatPassword')} 
                  style={{...baseInputStyle, width: '100%', paddingRight: '40px'}} 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
                </button>
              </div>
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
                  {t('auth.marketingConsent')}
                </label>
              </div>

              <div style={checkboxRowStyle}>
                <input 
                  type="checkbox" 
                  id="terms-privacy"
                  checked={formData.termsAccepted && formData.privacyAccepted}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({...formData, termsAccepted: checked, privacyAccepted: checked});
                  }}
                  required
                />
                <label htmlFor="terms-privacy" style={checkboxLabelStyle}>
                  I have read and agreed to <Link to="/terms" style={linkStyle}>Terms</Link> and <Link to="/privacy-policy" style={linkStyle}>Privacy policy</Link>
                </label>
              </div>
              {(errors.terms || errors.privacy) && <p style={errorTextStyle}>{errors.terms || errors.privacy}</p>}
            </div>

            {authError && <p style={errorTextStyle}>{authError}</p>}

            <Button type="submit" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              {loading ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
            </Button>
          </form>

          <p style={footerTextStyle}>
            {t('auth.hasAccount')} <Link to="/login" style={linkStyle}>{t('auth.login')}</Link>
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

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={authWrapperStyle}>
        <div style={authContentStyle}>
          <Card style={{ padding: '48px', textAlign: 'center' }}>
            <div style={verifyIconStyle}>
              <Mail size={48} color="var(--accent-primary)" />
            </div>
            <h2 style={{ marginBottom: '16px' }}>Check Your Email</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
              We've sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. 
              Please check your inbox and click the link to choose a new password.
            </p>
            <Button onClick={() => navigate('/login')} style={{ width: '100%' }}>
              {t('auth.backToLogin')}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={authWrapperStyle}>
      <Link to="/login" style={backButtonStyle}>
        <ArrowLeft size={20} /> Back to Login
      </Link>
      
      <div style={authContentStyle}>
        <Link to="/" style={logoWrapperStyle}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '48px', objectFit: 'contain' }} />
        </Link>

        <Card style={{ padding: '40px' }}>
          <h2 style={{ marginBottom: '8px' }}>Reset Password</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleResetPassword} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('auth.email')}</label>
              <div style={inputWrapperStyle}>
                <Mail size={18} color="var(--text-muted)" />
                <input 
                  type="email" 
                  placeholder={t('auth.placeholders.email')} 
                  style={inputStyle} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            {error && <p style={errorTextStyle}>{error}</p>}

            <Button type="submit" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authWrapperStyle}>
      <div style={authContentStyle}>
        <Link to="/" style={logoWrapperStyle}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '48px', objectFit: 'contain' }} />
        </Link>

        <Card style={{ padding: '40px' }}>
          <h2 style={{ marginBottom: '8px' }}>Create New Password</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Please enter your new password below.
          </p>

          <form onSubmit={handleUpdatePassword} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>New Password</label>
              <div style={{...inputWrapperStyle, paddingRight: '12px'}}>
                <Lock size={18} color="var(--text-muted)" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  style={inputStyle} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={8}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
                </button>
              </div>
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Confirm New Password</label>
              <div style={{...inputWrapperStyle, paddingRight: '12px'}}>
                <Lock size={18} color="var(--text-muted)" />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  style={inputStyle} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  minLength={8}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
                </button>
              </div>
            </div>

            {error && <p style={errorTextStyle}>{error}</p>}

            <Button type="submit" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
