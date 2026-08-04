import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, User, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.svg';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { createOrganization, getUserPendingInvites, respondToOrganizationInvite } from '../../services/organizationService';
import { COUNTRIES } from '../../utils/countries';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user && !authLoading) {
      if (
        user.user_metadata?.account_type === 'business' ||
        profile?.account_type === 'business'
      ) {
        navigate('/org-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate]);

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (
        data.user?.user_metadata?.account_type === 'business' ||
        profile?.account_type === 'business'
      ) {
        navigate('/org-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || t('auth.errors.failedLogin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-header-bar" style={{ maxWidth: '480px' }}>
        <Link to="/" className="auth-back-button">
          <ArrowLeft size={18} />
          <span>Back</span>
        </Link>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </Link>
        <div style={{ width: '70px' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Card className="auth-card-padding">
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
  const [accountType, setAccountType] = React.useState<'personal' | 'business' | null>(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isOrgSubmitted, setIsOrgSubmitted] = React.useState(false);

  // Personal form data
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    marketingConsent: false,
    termsAccepted: false,
    privacyAccepted: false,
  });

  // Business form data
  const [orgData, setOrgData] = React.useState({
    orgName: '',
    orgType: 'Startup / SME',
    regNumber: '',
    taxId: '',
    country: 'United Kingdom',
    city: '',
    addressLine1: '',
    addressLine2: '',
    website: '',
    officialEmail: '',
    phone: '',
    contactName: '',
    contactTitle: 'Managing Director',
    contactEmail: '',
    contactPhone: '',
    password: '',
    confirmPassword: '',
    summary: '',
    servicesOffered: '',
    teamSize: '1-10',
    industryCategories: '',
    verificationNotes: '',
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [_resending, _setResending] = React.useState(false);
  const [_resendMessage, _setResendMessage] = React.useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const validatePersonal = () => {
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

  const validateBusiness = () => {
    const newErrors: Record<string, string> = {};
    if (orgData.password !== orgData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (orgData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!orgData.termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUpPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePersonal()) {
      setLoading(true);
      setAuthError(null);
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: window.location.origin + '/dashboard',
            data: {
              full_name: formData.fullName,
              account_type: 'personal',
              marketing_consent: formData.marketingConsent,
            }
          }
        });

        if (error) throw error;
        
        if (data.user?.id) {
          try {
            const pending = await getUserPendingInvites(formData.email);
            if (pending && pending.length > 0) {
              for (const inv of pending) {
                await respondToOrganizationInvite(inv.id, inv.organization_id, true, {
                  id: data.user.id,
                  email: formData.email,
                  full_name: formData.fullName,
                });
              }
            }
          } catch (invErr) {
            console.warn('Auto-claim invite error:', invErr);
          }
        }

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

  const handleSignUpBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateBusiness()) {
      setLoading(true);
      setAuthError(null);

      try {
        // 1. Create auth user
        const { data, error } = await supabase.auth.signUp({
          email: orgData.contactEmail,
          password: orgData.password,
          options: {
            emailRedirectTo: window.location.origin + '/org-dashboard',
            data: {
              full_name: orgData.contactName,
              account_type: 'business',
              organisation: orgData.orgName,
            }
          }
        });

        if (error) throw error;

        // 2. Create Organization record (pending verification)
        const userId = data.user?.id || 'temp_' + Date.now();
        try {
          await createOrganization(userId, {
            name: orgData.orgName,
            type: orgData.orgType,
            registration_number: orgData.regNumber,
            tax_id: orgData.taxId,
            country: orgData.country,
            city: orgData.city,
            address_line1: orgData.addressLine1,
            address_line2: orgData.addressLine2,
            website: orgData.website,
            official_email: orgData.officialEmail,
            phone: orgData.phone,
            contact_name: orgData.contactName,
            contact_title: orgData.contactTitle,
            contact_email: orgData.contactEmail,
            contact_phone: orgData.contactPhone,
            summary: orgData.summary,
            services_offered: orgData.servicesOffered,
            team_size: orgData.teamSize,
            industry_categories: orgData.industryCategories ? orgData.industryCategories.split(',').map(s => s.trim()) : [],
            verification_notes: orgData.verificationNotes,
          });
        } catch (orgErr) {
          console.warn('Secondary organization creation error:', orgErr);
        }

        if (data.session) {
          navigate('/org-dashboard', { replace: true });
        } else {
          setIsOrgSubmitted(true);
        }
      } catch (err: any) {
        setAuthError(err.message || 'Failed to register business account');
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

  if (isSubmitted || isOrgSubmitted) {
    return (
      <div className="auth-wrapper">
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <Card className="auth-card-padding" style={{ textAlign: 'center' }}>
            <div style={verifyIconStyle}>
              {isOrgSubmitted ? <Building2 size={48} color="var(--accent-primary)" /> : <Mail size={48} color="var(--accent-primary)" />}
            </div>
            <h2 style={{ marginBottom: '16px' }}>
              {isOrgSubmitted ? 'Organization Account Created' : t('auth.verifyEmail')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              {isOrgSubmitted ? (
                <>
                  Your registration for <strong>{orgData.orgName}</strong> was submitted successfully! Your account is currently <strong>pending admin verification</strong>. You can view your dashboard, and full business features will unlock once approved.
                </>
              ) : (
                <>
                  {t('auth.verifyEmailDesc')} <strong style={{ color: 'var(--text-primary)' }}>{formData.email}</strong>. {t('auth.verifyEmailSubDesc')}
                </>
              )}
            </p>
            <Button onClick={() => navigate(isOrgSubmitted ? '/org-dashboard' : '/login')} style={{ width: '100%' }}>
              {isOrgSubmitted ? 'Go to Organization Dashboard' : t('auth.backToLogin')}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Step 1: Choose Account Type Selection
  if (accountType === null) {
    return (
      <div className="auth-wrapper">
        <div className="auth-header-bar" style={{ maxWidth: '680px' }}>
          <Link to="/" className="auth-back-button">
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </Link>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="PATHEW Logo" style={{ height: '40px', objectFit: 'contain' }} />
          </Link>
          <div style={{ width: '110px' }} />
        </div>

        <div style={{ width: '100%', maxWidth: '680px' }}>
          <Card className="auth-card-padding">
            <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>Choose Your Account Type</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', textAlign: 'center' }}>
              Select how you plan to use PATHEW to customize your experience.
            </p>

            <div className="auth-grid-2" style={{ marginBottom: '32px' }}>
              {/* Personal Account Option */}
              <div
                onClick={() => setAccountType('personal')}
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: '2px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <User size={24} color="#60a5fa" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '6px' }}>Personal Account</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  For individuals
                </p>
              </div>

              {/* Business Account Option */}
              <div
                onClick={() => setAccountType('business')}
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: '2px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Building2 size={24} color="#f59e0b" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '6px' }}>Business Account</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  For Businesses
                </p>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Already have an account? <Link to="/login" style={linkStyle}>Log In</Link>
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2B: Business / Organization Registration Form
  if (accountType === 'business') {
    return (
      <div className="auth-wrapper">
        <div className="auth-header-bar" style={{ maxWidth: '760px' }}>
          <button onClick={() => setAccountType(null)} className="auth-back-button">
            <ArrowLeft size={18} />
            <span>Back to account type</span>
          </button>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="PATHEW Logo" style={{ height: '40px', objectFit: 'contain' }} />
          </Link>
          <div style={{ width: '150px' }} />
        </div>

        <div style={{ width: '100%', maxWidth: '760px' }}>
          <Card className="auth-card-padding">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Building2 size={24} color="#f59e0b" />
              <h2 style={{ margin: 0 }}>Organization Registration</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.875rem' }}>
              Register your organization to manage team members, share credits, and post opportunities.
            </p>

            <form onSubmit={handleSignUpBusiness} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="auth-grid-2">
                <div>
                  <label style={labelStyle}>Organization Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Innovations Ltd"
                    style={baseInputStyle}
                    value={orgData.orgName}
                    onChange={e => setOrgData({ ...orgData, orgName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Organization Type / Sector *</label>
                  <select
                    style={baseInputStyle}
                    value={orgData.orgType}
                    onChange={e => setOrgData({ ...orgData, orgType: e.target.value })}
                  >
                    <option value="Startup / SME">Startup / SME</option>
                    <option value="Non-Profit / NGO">Non-Profit / NGO</option>
                    <option value="Enterprise / Corporate">Enterprise / Corporate</option>
                    <option value="Educational / University">Educational / University</option>
                    <option value="Government / Public Agency">Government / Public Agency</option>
                  </select>
                </div>
              </div>

              <div className="auth-grid-2">
                <div>
                  <label style={labelStyle}>Registration Number *</label>
                  <input
                    type="text"
                    placeholder="Official company reg #"
                    style={baseInputStyle}
                    value={orgData.regNumber}
                    onChange={e => setOrgData({ ...orgData, regNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Tax / VAT Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="VAT123456789"
                    style={baseInputStyle}
                    value={orgData.taxId}
                    onChange={e => setOrgData({ ...orgData, taxId: e.target.value })}
                  />
                </div>
              </div>

              <div className="auth-grid-3">
                <div>
                  <label style={labelStyle}>Country *</label>
                  <select
                    style={{ ...baseInputStyle, cursor: 'pointer' }}
                    value={orgData.country}
                    onChange={e => setOrgData({ ...orgData, country: e.target.value })}
                    required
                  >
                    <option value="" disabled style={{ backgroundColor: '#0f172a', color: '#94a3b8' }}>Select Country...</option>
                    {COUNTRIES.map(country => (
                      <option key={country} value={country} style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input
                    type="text"
                    placeholder="e.g. London"
                    style={baseInputStyle}
                    value={orgData.city}
                    onChange={e => setOrgData({ ...orgData, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Official Phone *</label>
                  <input
                    type="text"
                    placeholder="+44 20 1234 5678"
                    style={baseInputStyle}
                    value={orgData.phone}
                    onChange={e => setOrgData({ ...orgData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Address Line 1 *</label>
                <input
                  type="text"
                  placeholder="Street address"
                  style={baseInputStyle}
                  value={orgData.addressLine1}
                  onChange={e => setOrgData({ ...orgData, addressLine1: e.target.value })}
                  required
                />
              </div>

              <div className="auth-grid-2">
                <div>
                  <label style={labelStyle}>Official Email *</label>
                  <input
                    type="email"
                    placeholder="info@org.com"
                    style={baseInputStyle}
                    value={orgData.officialEmail}
                    onChange={e => setOrgData({ ...orgData, officialEmail: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Website URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    style={baseInputStyle}
                    value={orgData.website}
                    onChange={e => setOrgData({ ...orgData, website: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '14px', color: 'var(--accent-primary)' }}>
                  Contact Person Details
                </h4>

                <div className="auth-grid-2">
                  <div>
                    <label style={labelStyle}>Contact Person Full Name *</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      style={baseInputStyle}
                      value={orgData.contactName}
                      onChange={e => setOrgData({ ...orgData, contactName: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Contact Person Title / Role *</label>
                    <input
                      type="text"
                      placeholder="e.g. Managing Director / HR Manager"
                      style={baseInputStyle}
                      value={orgData.contactTitle}
                      onChange={e => setOrgData({ ...orgData, contactTitle: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="auth-grid-2" style={{ marginTop: '12px' }}>
                  <div>
                    <label style={labelStyle}>Contact Email (Account Login) *</label>
                    <input
                      type="email"
                      placeholder="jane@org.com"
                      style={baseInputStyle}
                      value={orgData.contactEmail}
                      onChange={e => setOrgData({ ...orgData, contactEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Contact Phone *</label>
                    <input
                      type="text"
                      placeholder="+44 7123 456789"
                      style={baseInputStyle}
                      value={orgData.contactPhone}
                      onChange={e => setOrgData({ ...orgData, contactPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="auth-grid-2" style={{ marginTop: '12px' }}>
                  <div>
                    <label style={labelStyle}>Account Password *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        style={{...baseInputStyle, paddingRight: '40px'}}
                        value={orgData.password}
                        onChange={e => setOrgData({ ...orgData, password: e.target.value })}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {showPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Confirm Password *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repeat password"
                        style={{...baseInputStyle, paddingRight: '40px'}}
                        value={orgData.confirmPassword}
                        onChange={e => setOrgData({ ...orgData, confirmPassword: e.target.value })}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
                <label style={labelStyle}>Organization Summary / Mission Statement</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what your organization does..."
                  style={baseInputStyle}
                  value={orgData.summary}
                  onChange={e => setOrgData({ ...orgData, summary: e.target.value })}
                />
              </div>

              <div style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  id="org-terms"
                  checked={orgData.termsAccepted}
                  onChange={e => setOrgData({ ...orgData, termsAccepted: e.target.checked })}
                  required
                />
                <label htmlFor="org-terms" style={checkboxLabelStyle}>
                  I confirm I am an authorized representative of this organization and agree to <Link to="/terms" style={linkStyle}>Terms</Link>
                </label>
              </div>

              {authError && <p style={errorTextStyle}>{authError}</p>}

              <Button type="submit" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
                {loading ? 'Submitting Registration...' : 'Submit Organization Registration'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2A: Personal Registration Form
  return (
    <div className="auth-wrapper">
      <div className="auth-header-bar" style={{ maxWidth: '480px' }}>
        <button onClick={() => setAccountType(null)} className="auth-back-button">
          <ArrowLeft size={18} />
          <span>Back to account type</span>
        </button>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </Link>
        <div style={{ width: '150px' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Card className="auth-card-padding">
          <h2 style={{ marginBottom: '8px' }}>{t('auth.createAccountTitle')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            {t('auth.signUpDesc')}
          </p>

          <form onSubmit={handleSignUpPersonal} style={formStyle}>
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
                  style={{...baseInputStyle, paddingRight: '40px'}} 
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
                  style={{...baseInputStyle, paddingRight: '40px'}} 
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
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
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
      <div className="auth-wrapper">
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <Card className="auth-card-padding" style={{ textAlign: 'center' }}>
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
    <div className="auth-wrapper">
      <div className="auth-header-bar" style={{ maxWidth: '480px' }}>
        <Link to="/login" className="auth-back-button">
          <ArrowLeft size={18} />
          <span>Back to Login</span>
        </Link>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </Link>
        <div style={{ width: '110px' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Card className="auth-card-padding">
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
    <div className="auth-wrapper">
      <div className="auth-header-bar" style={{ maxWidth: '480px' }}>
        <Link to="/login" className="auth-back-button">
          <ArrowLeft size={18} />
          <span>Back to Login</span>
        </Link>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </Link>
        <div style={{ width: '110px' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Card className="auth-card-padding">
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
