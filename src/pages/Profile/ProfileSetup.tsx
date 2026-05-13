import React, { useState } from 'react';
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
  Upload,
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
  { id: 'goals', title: 'Goals', icon: Target },
  { id: 'achievements', title: 'Achievements', icon: Award },
  { id: 'projects', title: 'Projects', icon: Layers },
  { id: 'organisation', title: 'Organisation', icon: Building },
  { id: 'portfolio', title: 'Portfolio', icon: FileUp },
];



export const ProfileSetup: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

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

      updateData('portfolio_url', publicUrl);
      alert('Portfolio uploaded successfully!');
    } catch (error) {
      console.error('Error uploading portfolio:', error);
      alert('Error uploading portfolio. Make sure the bucket is created.');
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
      <header style={headerStyle}>
        <div style={stepperStyle}>
          <AnimatePresence mode="popLayout">
            {steps.map((step, idx) => {
              const isFirst = idx === 0;
              const isCurrent = idx === currentStep;
              const isPast = idx < currentStep;
              
              // Define a window of 5 steps around the current step
              // We want to show a few before and a few after
              const windowSize = 5;
              const startWindow = Math.max(0, Math.min(currentStep - 1, steps.length - windowSize));
              const endWindow = startWindow + windowSize;
              
              const isInWindow = idx >= startWindow && idx < endWindow;

              // Logic: Always show Step 1. Show the window of 5 steps.
              const shouldRender = isFirst || isInWindow;
              if (!shouldRender) return null;

              return (
                <React.Fragment key={step.id}>
                  {/* Line before step if it's the first one rendered in this view and it's not the actual first step */}
                  {idx === startWindow && idx > 0 && !isFirst && (
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 40, opacity: 0.3 }}
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
                      backgroundColor: idx <= currentStep ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: idx <= currentStep ? '#000' : 'var(--text-muted)',
                      boxShadow: isCurrent ? '0 0 20px var(--accent-glow)' : 'none',
                    }}>
                      {isPast ? '✓' : idx + 1}
                    </div>
                    
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
                      {step.title}
                    </motion.span>
                  </motion.div>

                  {/* Standard Line between consecutive rendered steps */}
                  {idx < steps.length - 1 && ( (idx >= startWindow && idx < endWindow - 1) || (isFirst && startWindow === 1) ) && (
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 32, opacity: idx < currentStep ? 0.6 : 0.2 }}
                      style={stepLineStyle}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        </div>
      </header>

      <main style={mainStyle}>
        <div style={contentWrapperStyle}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{steps[currentStep].title}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Tell us more about yourself to help our Assistant find the best matches.
            </p>
          </div>

          <Card style={{ padding: '32px' }}>
            {currentStep === 0 && <StoryStep data={profileData} update={updateData} />}
            {currentStep === 1 && <EducationStep data={profileData} update={updateData} />}
            {currentStep === 2 && <ExperienceStep data={profileData} update={updateData} />}
            {currentStep === 3 && <GoalsStep data={profileData} update={updateData} />}
            {currentStep === 4 && <AchievementStep data={profileData} update={updateData} />}
            {currentStep === 5 && <ProjectsStep data={profileData} update={updateData} />}
            {currentStep === 6 && <OrganisationStep data={profileData} update={updateData} />}
            {currentStep === 7 && (
              <PortfolioStep 
                data={profileData} 
                update={updateData} 
                onUpload={handleFileUpload}
                uploading={uploading}
              />
            )}

            <div style={actionsStyle}>
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={loading}
                style={{ visibility: currentStep === 0 ? 'hidden' : 'visible', gap: '8px' }}
              >
                <ChevronLeft size={18} /> Back
              </Button>
              <Button onClick={handleNext} disabled={loading} style={{ gap: '8px' }}>
                {loading ? 'Saving...' : currentStep === steps.length - 1 ? 'Save and Complete' : 'Save and Continue'} 
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
const StoryStep = ({ data, update }: any) => {
  const { openAssistant } = useAssistant();

  return (
    <div style={formGridStyle}>
      <div style={inputGroupStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={labelStyle}>Bio / Personal Story</label>
          <button 
            style={AssistantLinkButtonStyle}
            onClick={() => openAssistant('Personal Story', ['Rewrite this to be more professional', 'Turn my notes into a story', 'Polish this summary'], (text) => update('story', text), { bio: data.story })}
          >
            <Sparkles size={14} /> Polish with Assistant
          </button>
        </div>
        <textarea 
          placeholder="Share your background, passions, and what drives you professionally..." 
          style={textareaStyle}
          value={data.story}
          onChange={(e) => update('story', e.target.value)}
        />
      </div>
      <div style={inputGroupStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={labelStyle}>Skills (Comma separated)</label>
          <button 
            style={AssistantLinkButtonStyle}
            onClick={() => openAssistant('Skills Assistant', ['Suggest skills based on my bio', 'Group my skills by category', 'Improve this list'], (text) => {
              // Extract skills from text or append
              update('goals', [...data.goals, text]);
            }, { bio: data.story })}
          >
            <Sparkles size={14} /> Suggest Skills
          </button>
        </div>
        <input 
          type="text" 
          placeholder="React, TypeScript, Project Management..." 
          style={inputStyle} 
          value={data.skills.join(', ')}
          onChange={(e) => update('skills', e.target.value.split(',').map(s => s.trim()))}
        />
      </div>
    </div>
  );
};

const EducationStep = ({ data, update }: any) => {
  const edu = data.education[0] || { school: '', degree: '', field: '' };

  const handleChange = (field: string, value: string) => {
    const newEdu = [{ ...edu, [field]: value }];
    update('education', newEdu);
  };

  return (
    <div style={formGridStyle}>
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Institution</label>
        <input 
          type="text" 
          placeholder="Stanford University" 
          style={inputStyle} 
          value={edu.school}
          onChange={(e) => handleChange('school', e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ ...inputGroupStyle, flex: 1 }}>
          <label style={labelStyle}>Degree</label>
          <input 
            type="text" 
            placeholder="Master of Science" 
            style={inputStyle} 
            value={edu.degree}
            onChange={(e) => handleChange('degree', e.target.value)}
          />
        </div>
        <div style={{ ...inputGroupStyle, flex: 1 }}>
          <label style={labelStyle}>Field of Study</label>
          <input 
            type="text" 
            placeholder="Computer Science" 
            style={inputStyle} 
            value={edu.field}
            onChange={(e) => handleChange('field', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

const ExperienceStep = ({ data, update }: any) => {
  const { openAssistant } = useAssistant();
  const exp = data.experience[0] || { company: '', title: '', description: '' };

  const handleChange = (field: string, value: string) => {
    const newExp = [{ ...exp, [field]: value }];
    update('experience', newExp);
  };

  return (
    <div style={formGridStyle}>
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Most Recent Company</label>
        <input 
          type="text" 
          placeholder="TechFlow Inc." 
          style={inputStyle} 
          value={exp.company}
          onChange={(e) => handleChange('company', e.target.value)}
        />
      </div>
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Job Title</label>
        <input 
          type="text" 
          placeholder="Senior Frontend Engineer" 
          style={inputStyle} 
          value={exp.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>
      <div style={inputGroupStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={labelStyle}>Description</label>
          <button 
            style={AssistantLinkButtonStyle}
            onClick={() => openAssistant('Experience Assistant', ['Improve this description', 'Turn into bullet points', 'Make it more achievement-oriented'], (text) => handleChange('description', text), { description: exp.description })}
          >
            <Sparkles size={14} /> Rewrite with Assistant
          </button>
        </div>
        <textarea 
          placeholder="What were your key responsibilities?" 
          style={textareaStyle} 
          value={exp.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>
    </div>
  );
};

const GoalsStep = ({ data, update }: any) => {
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
        <label style={labelStyle}>What are you looking for?</label>
        <div style={goalsGridStyle}>
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
              <label style={{ flex: 1, cursor: 'pointer' }}>{label}</label>
            </div>
          ))}
          <div 
            style={{ ...goalOptionStyle, gridColumn: 'span 2' }}
            onClick={() => setShowManual(!showManual)}
          >
            <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--border-color)', backgroundColor: showManual ? 'var(--bg-tertiary)' : 'transparent' }} />
            <label style={{ flex: 1, cursor: 'pointer' }}>Others (Add manually)</label>
          </div>
        </div>
      </div>
      
      {showManual && (
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Specify your custom goal</label>
          <input 
            type="text" 
            placeholder="e.g. Academic Research, Mentorship..." 
            style={inputStyle}
            onBlur={(e) => e.target.value && toggleGoal(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

const AchievementStep = ({ data, update }: any) => {
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={labelStyle}>Achievement #{index + 1}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                style={AssistantLinkButtonStyle}
                onClick={() => openAssistant('Achievement Assistant', ['Make this more impactful', 'Quantify this accomplishment'], (text) => updateAchievement(index, text), { achievement: ach })}
              >
                <Sparkles size={14} /> Assistant Polish
              </button>
              {achievements.length > 1 && (
                <button 
                  style={{ ...AssistantLinkButtonStyle, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                  onClick={() => removeAchievement(index)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <textarea 
            placeholder="e.g. Awarded 'Employee of the Year' for consistently exceeding sales targets by 25%..." 
            style={{ ...textareaStyle, minHeight: '80px' }}
            value={ach}
            onChange={(e) => updateAchievement(index, e.target.value)}
          />
        </div>
      ))}
      
      <Button 
        variant="outline" 
        onClick={addAchievement}
        style={{ width: '100%', borderStyle: 'dashed', marginTop: '8px' }}
      >
        + Add another achievement
      </Button>
    </div>
  );
};

const ProjectsStep = ({ data, update }: any) => {
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
    <div style={{ ...formGridStyle, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', maxWidth: '1000px', width: '100%' }}>
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
          <div style={{ ...listHeaderStyle, marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ ...labelStyle, color: proj.isSaved ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                Project #{index + 1}
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
                {proj.isSaved ? 'Saved' : 'Save'}
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
              placeholder="Project Title" 
              style={inputStyle}
              disabled={proj.isSaved}
              value={proj.title}
              onChange={(e) => updateProject(proj.id, 'title', e.target.value)}
            />
            <textarea 
              placeholder="Brief description of the project and your role..." 
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
        style={{ ...addBtnStyle, height: '100%', minHeight: '180px', borderStyle: 'dashed', gridColumn: 'span 1' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Plus size={24} />
          <span>Add Project</span>
        </div>
      </Button>
    </div>
  );
};

const OrganisationStep = ({ data, update }: any) => {
  return (
    <div style={formGridStyle}>
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Primary Organisation</label>
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

const PortfolioStep = ({ data, update, onUpload, uploading }: any) => (
  <div style={formGridStyle}>
    <div style={uploadContainerStyle}>
      <div style={uploadIconStyle}>
        <Upload size={32} color="var(--accent-primary)" />
      </div>
      <h3 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>
        {data.portfolio_url ? 'Portfolio Uploaded ✓' : 'Upload your Portfolio'}
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px', textAlign: 'center' }}>
        {data.portfolio_url 
          ? `File: ${data.portfolio_url.split('/').pop()?.substring(0, 30)}...`
          : 'Support for PDF, DOCX, and high-quality images. Max file size 10MB.'}
      </p>
      <input 
        type="file" 
        id="portfolio-upload" 
        style={{ display: 'none' }} 
        onChange={onUpload}
        accept=".pdf,.doc,.docx,image/*"
      />
      <Button 
        onClick={() => document.getElementById('portfolio-upload')?.click()}
        disabled={uploading}
      >
        <FileUp size={18} style={{ marginRight: '8px' }} />
        {uploading ? 'Uploading...' : data.portfolio_url ? 'Change File' : 'Select Files'}
      </Button>
    </div>
    
    <div style={inputGroupStyle}>
      <label style={labelStyle}>Portfolio Link (Optional)</label>
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



// Styles
const containerStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  padding: '24px 40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderBottom: '1px solid var(--border-color)',
};



const stepperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
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
};

const stepLabelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
};

const stepLineStyle: React.CSSProperties = {
  width: '32px',
  height: '1px',
  backgroundColor: 'var(--border-color)',
  margin: '0 8px',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '80px 20px',
};

const contentWrapperStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '800px',
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
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 16px',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: '0.875rem',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '120px',
  resize: 'vertical',
  fontFamily: 'inherit',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '40px',
  paddingTop: '24px',
  borderTop: '1px solid var(--border-color)',
};

const goalsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};

const goalOptionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '16px',
  backgroundColor: 'var(--bg-primary)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  cursor: 'pointer',
};

const listItemStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-color)',
};

const listHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
};

const removeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#ef4444',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
};

const addBtnStyle: React.CSSProperties = {
  width: '100%',
  borderStyle: 'dashed',
  marginTop: '8px',
  gap: '8px',
};

const uploadContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '40px',
  backgroundColor: 'rgba(245, 158, 11, 0.02)',
  border: '2px dashed var(--border-color)',
  borderRadius: 'var(--radius-xl)',
  marginBottom: '24px',
};

const uploadIconStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '16px',
};
