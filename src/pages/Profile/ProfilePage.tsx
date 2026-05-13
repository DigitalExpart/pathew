import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Mail, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    story: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (profile || user) {
      setFormData({
        full_name: profile?.full_name || user?.user_metadata?.full_name || '',
        email: user?.email || '',
        story: profile?.story || '',
        avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || ''
      });
    }
  }, [profile, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      // Update auth metadata immediately for header feedback
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSuccess(false);

    try {
      // 1. Update Profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          story: formData.story,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: formData.full_name,
          avatar_url: formData.avatar_url 
        }
      });

      if (authError) throw authError;

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const strength = React.useMemo(() => {
    let score = 0;
    
    // Basic Info (10%)
    if (formData.full_name) score += 5;
    if (formData.avatar_url) score += 5;
    
    // Story (10%)
    if (formData.story) score += 10;
    
    // Skills (10%)
    if (profile?.skills && profile.skills.length > 0) score += 10;
    
    // Education (10%)
    if (profile?.education && profile.education.length > 0 && (profile.education[0]?.school || profile.education[0]?.degree)) score += 10;
    
    // Experience (10%)
    if (profile?.experience && profile.experience.length > 0 && (profile.experience[0]?.company || profile.experience[0]?.title)) score += 10;
    
    // Goals (10%)
    if (profile?.goals && profile.goals.length > 0) score += 10;
    
    // Achievements (10%)
    if (profile?.achievements && profile.achievements.length > 0 && profile.achievements[0]) score += 10;
    
    // Projects (10%)
    if (profile?.projects && profile.projects.length > 0 && profile.projects[0]?.title) score += 10;
    
    // Organisation (10%)
    if (profile?.organisation) score += 10;
    
    // Portfolio (10%)
    if ((profile?.portfolios && profile.portfolios.length > 0) || profile?.portfolio_url) score += 10;
    
    return Math.min(score, 100);
  }, [profile, formData]);

  return (
    <div style={containerStyle}>
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={headerStyle}
      >
        <h1 style={titleStyle}>Profile Information</h1>
        <p style={subtitleStyle}>Update your personal details and how you appear on the platform.</p>
      </motion.header>

      <div style={layoutStyle}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={avatarSectionStyle}>
                <div style={avatarWrapperStyle}>
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Profile" style={avatarImgStyle} />
                  ) : (
                    <div style={avatarPlaceholderStyle}>
                      <User size={40} color="var(--accent-primary)" />
                    </div>
                  )}
                  <label style={uploadButtonStyle}>
                    <Camera size={16} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      style={{ display: 'none' }} 
                    />
                    {uploading && <Loader2 size={14} className="animate-spin" />}
                  </label>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Profile Picture</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    JPG, GIF or PNG. Max size of 2MB.
                  </p>
                </div>
              </div>

              <div style={gridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Full Name</label>
                  <div style={inputWrapperStyle}>
                    <User size={18} style={inputIconStyle} />
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Alex Johnson"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Email Address</label>
                  <div style={inputWrapperStyle}>
                    <Mail size={18} style={inputIconStyle} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
                    />
                  </div>
                  <p style={helperTextStyle}>Email cannot be changed here.</p>
                </div>

                <div style={{ ...inputGroupStyle, gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Bio / Personal Story</label>
                  <textarea
                    name="story"
                    value={formData.story}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    style={textareaStyle}
                  />
                </div>
              </div>

              <div style={footerStyle}>
                <Button 
                  type="submit" 
                  disabled={loading || uploading}
                  style={{ minWidth: '140px' }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={18} className="animate-spin" /> Saving...
                    </span>
                  ) : success ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} /> Saved!
                    </span>
                  ) : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={sidebarStyle}
        >
          <Card title="Profile Strength" glass>
            <div style={strengthContainerStyle}>
              <div style={progressBarContainerStyle}>
                <div style={{ ...progressBarFillStyle, width: `${strength}%` }}></div>
              </div>
              <p style={{ fontSize: '0.875rem', marginTop: '12px' }}>
                Your profile is <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{strength}% complete</span>. 
                {strength < 100 ? ' Add more details to improve your match accuracy.' : ' Your profile is fully optimized!'}
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                style={{ marginTop: '16px', padding: 0 }}
                onClick={() => navigate('/career-profile')}
              >
                Complete profile setup →
              </Button>
            </div>
          </Card>

          <Card title="Privacy Tip" style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your email address is never shared publicly. We only use it for account-related notifications and direct communication from verified opportunities.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  maxWidth: '1100px',
  margin: '0 auto',
  padding: '40px 20px',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '40px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 800,
  marginBottom: '8px',
  letterSpacing: '-0.02em',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  color: 'var(--text-secondary)',
};

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 320px',
  gap: '32px',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
};

const avatarSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
};

const avatarWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100px',
  height: '100px',
};

const avatarImgStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '3px solid var(--bg-tertiary)',
};

const avatarPlaceholderStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '3px dashed rgba(245, 158, 11, 0.3)',
};

const uploadButtonStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: 'var(--accent-primary)',
  color: '#000',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  border: '3px solid var(--bg-secondary)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  transition: 'transform 0.2s ease',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '24px',
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const inputWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const inputIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '16px',
  color: 'var(--text-muted)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px 12px 48px',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  outline: 'none',
  transition: 'all 0.2s ease',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '150px',
  padding: '16px',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  outline: 'none',
  resize: 'vertical',
  transition: 'all 0.2s ease',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '8px',
};

const helperTextStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  marginTop: '4px',
};

const sidebarStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const strengthContainerStyle: React.CSSProperties = {
  marginTop: '8px',
};

const progressBarContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '8px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '4px',
  overflow: 'hidden',
};

const progressBarFillStyle: React.CSSProperties = {
  height: '100%',
  backgroundColor: 'var(--accent-primary)',
  borderRadius: '4px',
};
