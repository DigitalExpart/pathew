import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { User, CheckCircle2, Sparkles, Target, Briefcase, BookOpen, FileEdit, Award } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    story: '',
    avatar_url: ''
  });
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);

  const isMobile = window.innerWidth <= 768;

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

  // Calculate profile strength
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
    <div style={{ ...containerStyle, padding: isMobile ? '20px 16px' : '40px 20px' }}>
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={headerStyle}
      >
        <h1 style={{ ...titleStyle, fontSize: isMobile ? '1.75rem' : '2.5rem' }}>Professional Profile</h1>
        <p style={subtitleStyle}>Your comprehensive career summary and goals.</p>
      </motion.header>

      <div className="grid-responsive" style={{
        ...layoutStyle,
        gridTemplateColumns: isMobile ? '1fr' : '1fr 320px',
      }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
        >
          {/* Basic Info & Story */}
          <Card>
            <div style={{ padding: '32px' }}>
              <div style={{ ...avatarSectionStyle, flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
                <div style={avatarWrapperStyle}>
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Profile" style={avatarImgStyle} />
                  ) : (
                    <div style={avatarPlaceholderStyle}>
                      <User size={40} color="var(--accent-primary)" />
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '16px' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{formData.full_name || 'Anonymous User'}</h2>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{formData.email}</p>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <Badge variant="primary">{profile?.subscription_plan || 'Free'} Plan</Badge>
                    <Badge variant="outline">Verified Professional</Badge>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>My Story</h3>
                <div style={{ position: 'relative' }}>
                  <p style={{ 
                    color: 'var(--text-secondary)', 
                    lineHeight: 1.8, 
                    whiteSpace: 'pre-wrap',
                    fontSize: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: isStoryExpanded ? 'unset' : 5,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}>
                    {formData.story || 'No bio provided yet. Use the Edit Profile to share your professional journey.'}
                  </p>
                  
                  {formData.story && formData.story.length > 250 && (
                    <button 
                      onClick={() => setIsStoryExpanded(!isStoryExpanded)}
                      style={{ 
                        marginTop: '12px', 
                        color: 'var(--accent-primary)', 
                        fontWeight: 600, 
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {isStoryExpanded ? 'Show Less' : 'Read Full Story'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Goals & Skills */}
          <div className="grid-responsive" style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
            <Card title="Career Goals" icon={Target}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile?.goals?.length ? (
                  profile.goals.map((goal: string, i: number) => (
                    <Badge key={i} variant="primary" style={{ padding: '8px 12px' }}>{goal}</Badge>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No goals set yet.</p>
                )}
              </div>
            </Card>
            <Card title="Core Skills" icon={Sparkles}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile?.skills?.length ? (
                  profile.skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary" style={{ padding: '8px 12px' }}>{skill}</Badge>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No skills listed yet.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Experience */}
          <Card title="Work Experience" icon={Briefcase}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {profile?.experience?.length ? (
                profile.experience.map((exp: any, i: number, arr: any[]) => (
                  <div key={i} style={{ display: 'flex', gap: '20px', paddingBottom: i !== arr.length - 1 ? '24px' : 0, borderBottom: i !== arr.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Briefcase size={20} color="var(--accent-primary)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{exp.title}</h4>
                      <p style={{ color: 'var(--accent-primary)', fontSize: '0.9375rem', fontWeight: 500 }}>{exp.company}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '4px' }}>{exp.duration}</p>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '0.9375rem', lineHeight: 1.6 }}>{exp.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No experience added yet.</p>
              )}
            </div>
          </Card>

          {/* Education */}
          <Card title="Education" icon={BookOpen}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {profile?.education?.length ? (
                profile.education.map((edu: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BookOpen size={20} color="var(--accent-primary)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{edu.degree}</h4>
                      <p style={{ color: 'var(--text-secondary)' }}>{edu.school}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{edu.year}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No education details added yet.</p>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={sidebarStyle}
        >
          <Card title="Profile Status" glass>
            <div style={strengthContainerStyle}>
              <div style={progressBarContainerStyle}>
                <div style={{ ...progressBarFillStyle, width: `${strength}%` }}></div>
              </div>
              <p style={{ fontSize: '0.875rem', marginTop: '12px' }}>
                Your profile is <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{strength}% complete</span>.
              </p>
              <Button 
                variant="primary" 
                style={{ marginTop: '24px', width: '100%', gap: '8px' }}
                onClick={() => navigate('/profile')}
              >
                <FileEdit size={18} /> Edit Profile
              </Button>
            </div>
          </Card>

          <Card title="Achievements" icon={Award} style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {profile?.achievements?.length ? (
                profile.achievements.map((ach: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <CheckCircle2 size={16} color="var(--accent-primary)" style={{ marginTop: '4px' }} />
                    <span style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>{ach}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No achievements listed.</p>
              )}
            </div>
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


