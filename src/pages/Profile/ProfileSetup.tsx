import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Sparkles, 
  User, 
  BookOpen, 
  Briefcase, 
  Target, 
  ChevronRight, 
  ChevronLeft, 
  Award,
  Layers,
  Building,
  FileUp,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAssistant } from '../../context/AssistantContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const AssistantLinkButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--accent-primary)',
  fontSize: '0.75rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(245, 158, 11, 0.05)',
  transition: 'all 0.2s ease',
};

const steps = [
  { id: 'story', title: 'Your Story', icon: User },
  { id: 'education', title: 'Education', icon: BookOpen },
  { id: 'experience', title: 'Experience', icon: Briefcase },
  { id: 'certifications', title: 'Certifications', icon: Award },
  { id: 'goals', title: 'Goals', icon: Target },
  { id: 'achievements', title: 'Achievements', icon: Award },
  { id: 'projects', title: 'Projects', icon: Layers },
  { id: 'organisation', title: 'Organisation', icon: Building },
  { id: 'portfolio', title: 'Portfolio', icon: FileUp },
];

export const ProfileSetup: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Centralized State
  const [profileData, setProfileData] = useState({
    story: '',
    education: [] as any[],
    experience: [] as any[],
    goals: [] as string[],
    skills: [] as string[],
    achievements: [] as string[],
    projects: [] as any[],
    organisation: '',
    portfolio_url: '',
    portfolios: [] as any[],
    languages: [] as string[],
    location: '',
    year_of_birth: '',
    certifications: [] as any[],
  });

  const updateData = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  React.useEffect(() => {
    if (profile) {
      setProfileData({
        story: profile.story || '',
        education: profile.education || [],
        experience: profile.experience || [],
        goals: profile.goals || [],
        skills: profile.skills || [],
        achievements: profile.achievements || [],
        projects: profile.projects || [],
        organisation: profile.organisation || '',
        portfolio_url: profile.portfolio_url || '',
        portfolios: profile.portfolios || [],
        languages: profile.languages || [],
        location: profile.location || '',
        year_of_birth: profile.year_of_birth || (profile as any).date_of_birth || '',
        certifications: profile.certifications || [],
      });
    }
  }, [profile]);

  const saveProgress = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          story: profileData.story,
          education: profileData.education,
          experience: profileData.experience,
          goals: profileData.goals,
          achievements: profileData.achievements,
          projects: profileData.projects,
          organisation: profileData.organisation,
          portfolio_url: profileData.portfolio_url,
          skills: profileData.skills,
          portfolios: profileData.portfolios,
          languages: profileData.languages,
          location: profileData.location,
          year_of_birth: profileData.year_of_birth,
          certifications: profileData.certifications,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading portfolio:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    await saveProgress();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div style={containerStyle}>
      <header style={{
        ...headerStyle,
        padding: isMobile ? '16px' : '24px',
      }}>
        <div style={{
          ...stepperStyle,
          justifyContent: isMobile ? 'center' : 'flex-start',
        }}>
          <AnimatePresence mode="popLayout">
            {steps.map((step, idx) => {
              const isFirst = idx === 0;
              const isCurrent = idx === currentStep;
              const isPast = idx < currentStep;
              
              const windowSize = isMobile ? 3 : 5;
              const startWindow = Math.max(0, Math.min(currentStep - (isMobile ? 1 : 1), steps.length - windowSize));
              const endWindow = startWindow + windowSize;
              
              const isInWindow = idx >= startWindow && idx < endWindow;
              const shouldRender = isFirst || isInWindow;
              if (!shouldRender) return null;

              return (
                <React.Fragment key={step.id}>
                  {idx === startWindow && idx > 0 && !isFirst && (
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: isMobile ? 20 : 40, opacity: 0.3 }}
                      style={{ ...stepLineStyle, borderStyle: 'dashed', backgroundColor: 'transparent', borderBottom: '1px dashed var(--border-color)' }}
                    />
                  )}

                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ 
                      opacity: idx > currentStep ? 0.4 : 1, 
                      scale: isCurrent ? 1.1 : 1, 
                      x: 0 
                    }}
                    exit={{ opacity: 0, scale: 0.8, x: -20 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      ...stepItemStyle,
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{
                      ...stepCircleStyle,
                      width: isMobile ? '28px' : '32px',
                      height: isMobile ? '28px' : '32px',
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      backgroundColor: idx <= currentStep ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: idx <= currentStep ? '#000' : 'var(--text-muted)',
                      boxShadow: isCurrent ? '0 0 20px var(--accent-glow)' : 'none',
                    }}>
                      {isPast ? '✓' : idx + 1}
                    </div>
                    
                    {!isMobile && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        style={{
                          ...stepLabelStyle,
                          color: idx <= currentStep ? 'var(--text-primary)' : 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
                      >
                        {t(`setup.steps.${step.id}`)}
                      </motion.span>
                    )}
                  </motion.div>

                  {idx < steps.length - 1 && ( (idx >= startWindow && idx < endWindow - 1) || (isFirst && startWindow === 1) ) && (
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: isMobile ? 16 : 32, opacity: idx < currentStep ? 0.6 : 0.2 }}
                      style={stepLineStyle}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        </div>
      </header>

      <main style={{
        ...mainStyle,
        padding: isMobile ? '24px 16px' : '40px 24px',
      }}>
        <div style={{
          ...contentWrapperStyle,
          maxWidth: '800px',
        }}>
          <div style={{ marginBottom: '32px', textAlign: isMobile ? 'center' : 'left' }}>
            <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '8px' }}>{t(`setup.steps.${steps[currentStep].id}`)}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '0.875rem' : '1rem' }}>
              {t('setup.subtitle')}
            </p>
          </div>

          <Card style={{ padding: isMobile ? '20px' : '32px' }}>
            {currentStep === 0 && <StoryStep data={profileData} update={updateData} isMobile={isMobile} />}
            {currentStep === 1 && <EducationStep data={profileData} update={updateData} isMobile={isMobile} />}
            {currentStep === 2 && <ExperienceStep data={profileData} update={updateData} isMobile={isMobile} />}
            {currentStep === 3 && <CertificationsStep data={profileData} update={updateData} isMobile={isMobile} />}
            {currentStep === 4 && <GoalsStep data={profileData} update={updateData} isMobile={isMobile} />}
            {currentStep === 5 && <AchievementStep data={profileData} update={updateData} isMobile={isMobile} />}
            {currentStep === 6 && <ProjectsStep data={profileData} update={updateData} isMobile={isMobile} />}
            {currentStep === 7 && <OrganisationStep data={profileData} update={updateData} isMobile={isMobile} />}
            {currentStep === 8 && (
              <PortfolioStep 
                data={profileData} 
                update={updateData} 
                onUpload={handleFileUpload}
                uploading={uploading}
                isMobile={isMobile}
              />
            )}

            <div style={{
              ...actionsStyle,
              flexDirection: isMobile ? 'column-reverse' : 'row',
              gap: isMobile ? '12px' : '0',
              alignItems: isMobile ? 'stretch' : 'center',
            }}>
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={loading}
                style={{ visibility: currentStep === 0 ? 'hidden' : 'visible', gap: '8px', justifyContent: 'center' }}
              >
                <ChevronLeft size={18} /> {t('common.back')}
              </Button>
              <Button onClick={handleNext} disabled={loading} style={{ gap: '8px', justifyContent: 'center' }}>
                {loading ? t('common.save') : currentStep === steps.length - 1 ? t('setup.saveAndComplete') : t('setup.saveAndContinue')} 
                {!loading && <ChevronRight size={18} />}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Step Components
const StoryStep = ({ data, update, isMobile }: any) => {
  const { t } = useTranslation();
  const { openAssistant } = useAssistant();

  return (
    <div style={formGridStyle}>

      <div style={inputGroupStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '8px', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '8px' : '0' }}>
          <label style={labelStyle}>{t('setup.bioLabel')}</label>
          <button 
            style={AssistantLinkButtonStyle}
            onClick={() => openAssistant('Personal Story', ['Rewrite this to be more professional', 'Turn my notes into a story', 'Polish this summary'], (text) => update('story', text), { bio: data.story })}
          >
            <Sparkles size={14} /> {t('setup.polishWithAssistant')}
          </button>
        </div>
        <textarea 
          placeholder={t('setup.bioPlaceholder')} 
          style={textareaStyle}
          value={data.story}
          onChange={(e) => update('story', e.target.value)}
        />
      </div>
      <div style={inputGroupStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '8px', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '8px' : '0' }}>
          <label style={labelStyle}>{t('setup.skillsLabel')}</label>
          <button 
            style={AssistantLinkButtonStyle}
            onClick={() => openAssistant('Skills Assistant', ['Suggest skills based on my bio', 'Group my skills by category', 'Improve this list'], (text) => {
              update('goals', [...data.goals, text]);
            }, { bio: data.story })}
          >
            <Sparkles size={14} /> {t('setup.suggestSkills')}
          </button>
        </div>
        <input 
          type="text" 
          placeholder={t('setup.skillsPlaceholder')} 
          style={inputStyle} 
          value={data.skills.join(', ')}
          onChange={(e) => update('skills', e.target.value.split(',').map(s => s.trim()))}
        />
      </div>
    </div>
  );
};

const EducationStep = ({ data, update, isMobile }: any) => {
  const { t } = useTranslation();
  const educations = data.education.length > 0 ? data.education : [{ school: '', degree: '', field: '', year: '' }];

  const addEducation = () => update('education', [...educations, { school: '', degree: '', field: '', year: '' }]);
  
  const removeEducation = (index: number) => {
    if (educations.length > 1) {
      const newEdu = [...educations];
      newEdu.splice(index, 1);
      update('education', newEdu);
    }
  };

  const handleChange = (index: number, field: string, value: string) => {
    const newEdu = [...educations];
    newEdu[index] = { ...newEdu[index], [field]: value };
    update('education', newEdu);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {educations.map((edu: any, index: number) => (
        <div key={index} style={{ ...inputGroupStyle, padding: isMobile ? '16px' : '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
          {educations.length > 1 && (
            <button 
              onClick={() => removeEducation(index)}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
            >
              <Trash2 size={16} />
            </button>
          )}
          
          <div style={formGridStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('setup.institution')}</label>
              <input 
                type="text" 
                placeholder="Stanford University" 
                style={inputStyle} 
                value={edu.school}
                onChange={(e) => handleChange(index, 'school', e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
              <div style={{ ...inputGroupStyle, flex: 1 }}>
                <label style={labelStyle}>{t('setup.degree')}</label>
                <input 
                  type="text" 
                  placeholder="Master of Science" 
                  style={inputStyle} 
                  value={edu.degree}
                  onChange={(e) => handleChange(index, 'degree', e.target.value)}
                />
              </div>
              <div style={{ ...inputGroupStyle, flex: 1 }}>
                <label style={labelStyle}>{t('setup.fieldOfStudy')}</label>
                <input 
                  type="text" 
                  placeholder="Computer Science" 
                  style={inputStyle} 
                  value={edu.field}
                  onChange={(e) => handleChange(index, 'field', e.target.value)}
                />
              </div>
              <div style={{ ...inputGroupStyle, flex: 1 }}>
                <label style={labelStyle}>{t('setup.graduationYear')}</label>
                <input 
                  type="text" 
                  placeholder="2022" 
                  style={inputStyle} 
                  value={edu.year}
                  onChange={(e) => handleChange(index, 'year', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <Button 
        variant="outline" 
        onClick={addEducation}
        style={{ width: '100%', borderStyle: 'dashed', justifyContent: 'center' }}
      >
        <Plus size={18} style={{ marginRight: '8px' }} /> {t('setup.addAnotherEducation')}
      </Button>
    </div>
  );
};

const ExperienceStep = ({ data, update, isMobile }: any) => {
  const { t } = useTranslation();
  const { openAssistant } = useAssistant();
  const experiences = data.experience.length > 0 ? data.experience : [{ company: '', title: '', description: '', duration: '' }];

  const addExperience = () => update('experience', [...experiences, { company: '', title: '', description: '', duration: '' }]);
  
  const removeExperience = (index: number) => {
    if (experiences.length > 1) {
      const newExp = [...experiences];
      newExp.splice(index, 1);
      update('experience', newExp);
    }
  };

  const handleChange = (index: number, field: string, value: string) => {
    const newExp = [...experiences];
    newExp[index] = { ...newExp[index], [field]: value };
    update('experience', newExp);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {experiences.map((exp: any, index: number) => (
        <div key={index} style={{ ...inputGroupStyle, padding: isMobile ? '16px' : '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
          {experiences.length > 1 && (
            <button 
              onClick={() => removeExperience(index)}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
            >
              <Trash2 size={16} />
            </button>
          )}

          <div style={formGridStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>{t('setup.company')}</label>
                <input 
                  type="text" 
                  placeholder="TechFlow Inc." 
                  style={inputStyle} 
                  value={exp.company}
                  onChange={(e) => handleChange(index, 'company', e.target.value)}
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>{t('setup.jobTitle')}</label>
                <input 
                  type="text" 
                  placeholder="Senior Frontend Engineer" 
                  style={inputStyle} 
                  value={exp.title}
                  onChange={(e) => handleChange(index, 'title', e.target.value)}
                />
              </div>
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('setup.duration')}</label>
              <input 
                type="text" 
                placeholder="Jan 2020 - Present" 
                style={inputStyle} 
                value={exp.duration}
                onChange={(e) => handleChange(index, 'duration', e.target.value)}
              />
            </div>
            <div style={inputGroupStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
                <label style={labelStyle}>{t('setup.description')}</label>
                <button 
                  style={AssistantLinkButtonStyle}
                  onClick={() => openAssistant('Experience Assistant', ['Improve this description', 'Turn into bullet points', 'Make it more achievement-oriented'], (text) => handleChange(index, 'description', text), { description: exp.description })}
                >
                  <Sparkles size={14} /> {t('setup.rewriteWithAssistant')}
                </button>
              </div>
              <textarea 
                placeholder="What were your key responsibilities?" 
                style={textareaStyle} 
                value={exp.description}
                onChange={(e) => handleChange(index, 'description', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      <Button 
        variant="outline" 
        onClick={addExperience}
        style={{ width: '100%', borderStyle: 'dashed', justifyContent: 'center' }}
      >
        <Plus size={18} style={{ marginRight: '8px' }} /> {t('setup.addAnotherExperience')}
      </Button>
    </div>
  );
};

const CertificationsStep = ({ data, update, isMobile }: any) => {
  const { t } = useTranslation();
  const certifications = data.certifications.length > 0 ? data.certifications : [{ title: '', organization: '', level: '', tutor: '', year: '' }];

  const addCert = () => update('certifications', [...certifications, { title: '', organization: '', level: '', tutor: '', year: '' }]);
  
  const removeCert = (index: number) => {
    if (certifications.length > 1) {
      const newCerts = [...certifications];
      newCerts.splice(index, 1);
      update('certifications', newCerts);
    }
  };

  const handleChange = (index: number, field: string, value: string) => {
    const newCerts = [...certifications];
    newCerts[index] = { ...newCerts[index], [field]: value };
    update('certifications', newCerts);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {certifications.map((cert: any, index: number) => (
        <div key={index} style={{ ...inputGroupStyle, padding: isMobile ? '16px' : '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
          {certifications.length > 1 && (
            <button 
              onClick={() => removeCert(index)}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
            >
              <Trash2 size={16} />
            </button>
          )}
          
          <div style={formGridStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('setup.certTitle')}</label>
              <input 
                type="text" 
                placeholder="Google Data Analytics Professional Certificate" 
                style={inputStyle} 
                value={cert.title}
                onChange={(e) => handleChange(index, 'title', e.target.value)}
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>{t('setup.issuingOrg')}</label>
              <input 
                type="text" 
                placeholder="Udemy, Coursera, Google, etc." 
                style={inputStyle} 
                value={cert.organization}
                onChange={(e) => handleChange(index, 'organization', e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
              <div style={{ ...inputGroupStyle, flex: 1 }}>
                <label style={labelStyle}>{t('setup.expLevel')}</label>
                <select 
                  style={inputStyle} 
                  value={cert.level}
                  onChange={(e) => handleChange(index, 'level', e.target.value)}
                >
                  <option value="">{t('editProfile.selectLevel')}</option>
                  <option value="Beginner">{t('editProfile.beginner')}</option>
                  <option value="Intermediate">{t('editProfile.intermediate')}</option>
                  <option value="Pro">{t('editProfile.pro')}</option>
                </select>
              </div>
              <div style={{ ...inputGroupStyle, flex: 1 }}>
                <label style={labelStyle}>{t('setup.instructor')}</label>
                <input 
                  type="text" 
                  placeholder="Dr. John Doe" 
                  style={inputStyle} 
                  value={cert.tutor}
                  onChange={(e) => handleChange(index, 'tutor', e.target.value)}
                />
              </div>
              <div style={{ ...inputGroupStyle, flex: 1 }}>
                <label style={labelStyle}>{t('setup.yearGiven')}</label>
                <input 
                  type="text" 
                  placeholder="2023" 
                  style={inputStyle} 
                  value={cert.year}
                  onChange={(e) => handleChange(index, 'year', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <Button 
        variant="outline" 
        onClick={addCert}
        style={{ width: '100%', borderStyle: 'dashed', justifyContent: 'center' }}
      >
        <Plus size={18} style={{ marginRight: '8px' }} /> {t('setup.addAnotherCert')}
      </Button>
    </div>
  );
};

const GoalsStep = ({ data, update, isMobile }: any) => {
  const { t } = useTranslation();
  const [showManual, setShowManual] = useState(false);
  
  const toggleGoal = (label: string) => {
    const newGoals = data.goals.includes(label)
      ? data.goals.filter((g: string) => g !== label)
      : [...data.goals, label];
    update('goals', newGoals);
  };

  return (
    <div style={formGridStyle}>
      <div style={inputGroupStyle}>
        <label style={labelStyle}>{t('setup.lookingFor')}</label>
        <div style={{
          ...goalsGridStyle,
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        }}>
          {['Full-time Roles', 'Contract Work', 'Freelance Projects', 'Fellowships', 'Grants', 'Leadership Positions'].map(label => (
            <div 
              key={label}
              style={{ ...goalOptionStyle, borderColor: data.goals.includes(label) ? 'var(--accent-primary)' : 'var(--border-color)' }}
              onClick={() => toggleGoal(label)}
            >
              <div style={{ 
                width: '18px', 
                height: '18px', 
                borderRadius: '4px', 
                border: '2px solid var(--accent-primary)',
                backgroundColor: data.goals.includes(label) ? 'var(--accent-primary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {data.goals.includes(label) && <Check size={12} color="#000" />}
              </div>
              <label style={{ flex: 1, cursor: 'pointer' }}>{t(`setup.goalsList.${label}`, { defaultValue: label })}</label>
            </div>
          ))}
          <div 
            style={{ ...goalOptionStyle, gridColumn: isMobile ? 'auto' : 'span 2' }}
            onClick={() => setShowManual(!showManual)}
          >
            <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--border-color)', backgroundColor: showManual ? 'var(--bg-tertiary)' : 'transparent' }} />
            <label style={{ flex: 1, cursor: 'pointer' }}>{t('setup.goalsList.Others (Add manually)')}</label>
          </div>
        </div>
      </div>
      
      {showManual && (
        <div style={inputGroupStyle}>
          <label style={labelStyle}>{t('setup.customGoal')}</label>
          <input 
            type="text" 
            placeholder={t('setup.customGoalPlaceholder')} 
            style={inputStyle}
            onBlur={(e) => e.target.value && toggleGoal(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

const AchievementStep = ({ data, update, isMobile }: any) => {
  const { t } = useTranslation();
  const { openAssistant } = useAssistant();
  const achievements = data.achievements.length > 0 ? data.achievements : [''];

  const addAchievement = () => update('achievements', [...achievements, '']);
  const removeAchievement = (index: number) => {
    const newAchievements = [...achievements];
    newAchievements.splice(index, 1);
    update('achievements', newAchievements);
  };
  const updateAchievement = (index: number, value: string) => {
    const newAchievements = [...achievements];
    newAchievements[index] = value;
    update('achievements', newAchievements);
  };

  return (
    <div style={formGridStyle}>
      {achievements.map((ach: string, index: number) => (
        <div key={index} style={{ ...inputGroupStyle, padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
            <label style={labelStyle}>{t('setup.achievementLabel', { index: index + 1 })}</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                style={AssistantLinkButtonStyle}
                onClick={() => openAssistant('Achievement Assistant', ['Make this more impactful', 'Quantify this accomplishment'], (text) => updateAchievement(index, text), { achievement: ach })}
              >
                <Sparkles size={14} /> {t('assistant.regenerate')}
              </button>
              {achievements.length > 1 && (
                <button 
                   style={{ ...AssistantLinkButtonStyle, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                  onClick={() => removeAchievement(index)}
                >
                  {t('common.delete')}
                </button>
              )}
            </div>
          </div>
          <textarea 
            placeholder="e.g. Awarded 'Employee of the Year'..." 
            style={{ ...textareaStyle, minHeight: '80px' }}
            value={ach}
            onChange={(e) => updateAchievement(index, e.target.value)}
          />
        </div>
      ))}
      
      <Button 
        variant="outline" 
        onClick={addAchievement}
        style={{ width: '100%', borderStyle: 'dashed', marginTop: '8px', justifyContent: 'center' }}
      >
        + {t('setup.addAnotherAchievement')}
      </Button>
    </div>
  );
};

const ProjectsStep = ({ data, update, isMobile }: any) => {
  const { t } = useTranslation();
  const projects = data.projects.length > 0 ? data.projects : [
    { id: 1, title: '', description: '', isSaved: false },
    { id: 2, title: '', description: '', isSaved: false },
  ];

  const addProject = () => update('projects', [...projects, { id: Date.now(), title: '', description: '', isSaved: false }]);
  
  const removeProject = (id: number) => {
    if (projects.length > 1) {
      update('projects', projects.filter((p: any) => p.id !== id));
    }
  };

  const updateProject = (id: number, field: string, value: any) => {
    update('projects', projects.map((p: any) => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', width: '100%' }}>
      {projects.map((proj: any, index: number) => (
        <div key={proj.id} style={{ 
          ...listItemStyle, 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          borderColor: proj.isSaved ? 'var(--accent-primary)' : 'var(--border-color)',
          boxShadow: proj.isSaved ? '0 0 10px rgba(245, 158, 11, 0.1)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ ...listHeaderStyle, marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ ...labelStyle, color: proj.isSaved ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                {t('setup.projectLabel', { index: index + 1 })}
              </label>
              {proj.isSaved && <Check size={14} color="var(--accent-primary)" />}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                style={{ 
                  ...AssistantLinkButtonStyle, 
                  padding: '2px 8px', 
                  fontSize: '0.7rem',
                  backgroundColor: proj.isSaved ? 'var(--accent-primary)' : 'rgba(245, 158, 11, 0.1)',
                  color: proj.isSaved ? '#000' : 'var(--accent-primary)'
                }} 
                onClick={() => updateProject(proj.id, 'isSaved', !proj.isSaved)}
              >
                {proj.isSaved ? t('opportunities.saved') : t('opportunities.save')}
              </button>
              {projects.length > 1 && (
                <button style={removeBtnStyle} onClick={() => removeProject(proj.id)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <input 
              type="text" 
              placeholder={t('setup.portfolioTitle')} 
              style={inputStyle}
              disabled={proj.isSaved}
              value={proj.title}
              onChange={(e) => updateProject(proj.id, 'title', e.target.value)}
            />
            <textarea 
              placeholder={t('setup.portfolioDesc')} 
              style={{ ...textareaStyle, flex: 1, minHeight: '100px' }}
              value={proj.description}
              onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
              disabled={proj.isSaved}
            />
          </div>
        </div>
      ))}
      <Button 
        variant="outline" 
        onClick={addProject} 
        style={{ ...addBtnStyle, height: '100%', minHeight: isMobile ? '120px' : '180px', borderStyle: 'dashed' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Plus size={24} />
          <span>{t('setup.addProject')}</span>
        </div>
      </Button>
    </div>
  );
};

const OrganisationStep = ({ data, update }: any) => {
  const { t } = useTranslation();
  return (
    <div style={formGridStyle}>
      <div style={inputGroupStyle}>
        <label style={labelStyle}>{t('editProfile.primaryOrg')}</label>
        <input 
          type="text" 
          placeholder="Current Company or Institution" 
          style={inputStyle} 
          value={data.organisation}
          onChange={(e) => update('organisation', e.target.value)}
        />
      </div>
    </div>
  );
};

const PortfolioStep = ({ data, update, onUpload, uploading, isMobile }: any) => {
  const { t } = useTranslation();
  const [newProject, setNewProject] = useState({ title: '', description: '', url: '' });

  const handleAddProject = async () => {
    if (!newProject.url) {
      alert(t('setup.errorFile'));
      return;
    }
    if (!newProject.title) {
      alert(t('setup.errorTitle'));
      return;
    }
    
    const updatedPortfolios = [...(data.portfolios || []), newProject];
    update('portfolios', updatedPortfolios);
    setNewProject({ title: '', description: '', url: '' });
  };

  const removeProject = (index: number) => {
    const updated = [...data.portfolios];
    updated.splice(index, 1);
    update('portfolios', updated);
  };

  return (
    <div style={formGridStyle}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        {data.portfolios?.map((proj: any, idx: number) => (
          <Card key={idx} style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}>
            <button 
              onClick={() => removeProject(idx)}
              style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', zIndex: 10 }}
            >
              <Trash2 size={14} />
            </button>
            
            <div style={{ height: isMobile ? '160px' : '120px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {proj.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={proj.url} alt={proj.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <FileUp size={32} color="var(--accent-primary)" />
              )}
            </div>
            <h4 style={{ fontSize: '1rem', marginBottom: '4px', color: 'var(--text-primary)' }}>{proj.title}</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {proj.description}
            </p>
          </Card>
        ))}
        
        {/* Add New Card */}
        <Card style={{ padding: '24px', borderStyle: 'dashed', borderColor: 'var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input 
              type="text" 
              placeholder={t('setup.portfolioTitle')} 
              style={inputStyle} 
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            />
            <textarea 
              placeholder={t('setup.portfolioDesc')} 
              style={{ ...textareaStyle, minHeight: '60px', padding: '8px' }} 
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
          </div>

          <input 
            type="file" 
            id="portfolio-add-file" 
            style={{ display: 'none' }} 
            onChange={async (e) => {
              const url = await onUpload(e);
              if (url) setNewProject({ ...newProject, url });
            }}
          />
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => document.getElementById('portfolio-add-file')?.click()}
            disabled={uploading}
            style={{ width: '100%', borderStyle: 'dashed' }}
          >
            {uploading ? t('setup.uploading') : newProject.url ? t('setup.fileReady') : t('setup.uploadFile')}
          </Button>

          <Button 
            size="sm" 
            onClick={handleAddProject}
            disabled={!newProject.url || !newProject.title}
            style={{ width: '100%' }}
          >
            {t('setup.addToPortfolio')}
          </Button>
        </Card>
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>{t('setup.externalPortfolio')}</label>
        <input 
          type="url" 
          placeholder="https://yourportfolio.com" 
          style={inputStyle} 
          value={data.portfolio_url}
          onChange={(e) => update('portfolio_url', e.target.value)}
        />
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
};

const headerStyle: React.CSSProperties = {
  padding: '16px 0',
  marginBottom: '24px',
  borderBottom: '1px solid var(--border-color)',
};

const stepperStyle: React.CSSProperties = {
  maxWidth: '1000px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const stepItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const stepCircleStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.875rem',
  fontWeight: 700,
  transition: 'all 0.3s ease',
};

const stepLabelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
};

const stepLineStyle: React.CSSProperties = {
  flex: 1,
  height: '2px',
  backgroundColor: 'var(--border-color)',
  borderRadius: '1px',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  padding: '0',
};

const contentWrapperStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
};

const formGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  outline: 'none',
  minHeight: '120px',
  resize: 'vertical',
  transition: 'border-color 0.2s',
};

const goalsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '12px',
};

const goalOptionStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const listItemStyle: React.CSSProperties = {
  padding: '24px',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
};

const listHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const removeBtnStyle: React.CSSProperties = {
  padding: '4px',
  backgroundColor: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  transition: 'color 0.2s',
};

const addBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  backgroundColor: 'var(--bg-tertiary)',
  border: '1px dashed var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '40px',
  paddingTop: '32px',
  borderTop: '1px solid var(--border-color)',
};
