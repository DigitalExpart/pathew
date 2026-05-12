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
  Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAssistance } from '../../context/AssistanceContext';

const assistanceLinkButtonStyle: React.CSSProperties = {
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

import logo from '../../assets/images/logo.png';

export const ProfileSetup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
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
        <div style={logoStyle}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '32px', objectFit: 'contain' }} />
        </div>
        <div style={stepperStyle}>
          {steps.map((step, idx) => (
            <div key={step.id} style={stepItemStyle}>
              <div style={{
                ...stepCircleStyle,
                backgroundColor: idx <= currentStep ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: idx <= currentStep ? '#000' : 'var(--text-muted)',
              }}>
                {idx < currentStep ? '✓' : idx + 1}
              </div>
              <span style={{
                ...stepLabelStyle,
                color: idx <= currentStep ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>{step.title}</span>
              {idx < steps.length - 1 && <div style={stepLineStyle}></div>}
            </div>
          ))}
        </div>
      </header>

      <main style={mainStyle}>
        <div style={contentWrapperStyle}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{steps[currentStep].title}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Tell us more about yourself to help our Assistance find the best matches.
            </p>
          </div>

          <Card style={{ padding: '32px' }}>
            {currentStep === 0 && <StoryStep />}
            {currentStep === 1 && <EducationStep />}
            {currentStep === 2 && <ExperienceStep />}
            {currentStep === 3 && <GoalsStep />}
            {currentStep === 4 && <AchievementStep />}
            {currentStep === 5 && <ProjectsStep />}
            {currentStep === 6 && <OrganisationStep />}
            {currentStep === 7 && <PortfolioStep />}

            <div style={actionsStyle}>
              <Button 
                variant="outline" 
                onClick={handleBack}
                style={{ visibility: currentStep === 0 ? 'hidden' : 'visible', gap: '8px' }}
              >
                <ChevronLeft size={18} /> Back
              </Button>
              <Button onClick={handleNext} style={{ gap: '8px' }}>
                {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'} 
                <ChevronRight size={18} />
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Step Components
const StoryStep = () => {
  const { openAssistance } = useAssistance();
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');

  return (
    <div style={formGridStyle}>
      <div style={inputGroupStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={labelStyle}>Bio / Personal Story</label>
          <button 
            style={assistanceLinkButtonStyle}
            onClick={() => openAssistance('Personal Story', ['Rewrite this to be more professional', 'Turn my notes into a story', 'Polish this summary'], (text) => setBio(text), { bio })}
          >
            <Sparkles size={14} /> Polish with Assistance
          </button>
        </div>
        <textarea 
          placeholder="Share your background, passions, and what drives you professionally..." 
          style={textareaStyle}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>
      <div style={inputGroupStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={labelStyle}>Skills (Comma separated)</label>
          <button 
            style={assistanceLinkButtonStyle}
            onClick={() => openAssistance('Skills Assistant', ['Suggest skills based on my bio', 'Group my skills by category', 'Improve this list'], (text) => setSkills(text), { bio, skills })}
          >
            <Sparkles size={14} /> Suggest Skills
          </button>
        </div>
        <input 
          type="text" 
          placeholder="React, TypeScript, Project Management..." 
          style={inputStyle} 
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
      </div>
    </div>
  );
};

const EducationStep = () => (
  <div style={formGridStyle}>
    <div style={inputGroupStyle}>
      <label style={labelStyle}>Institution</label>
      <input type="text" placeholder="Stanford University" style={inputStyle} />
    </div>
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ ...inputGroupStyle, flex: 1 }}>
        <label style={labelStyle}>Degree</label>
        <input type="text" placeholder="Master of Science" style={inputStyle} />
      </div>
      <div style={{ ...inputGroupStyle, flex: 1 }}>
        <label style={labelStyle}>Field of Study</label>
        <input type="text" placeholder="Computer Science" style={inputStyle} />
      </div>
    </div>
  </div>
);

const ExperienceStep = () => {
  const { openAssistance } = useAssistance();
  const [desc, setDesc] = useState('');
  return (
    <div style={formGridStyle}>
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Most Recent Company</label>
        <input type="text" placeholder="TechFlow Inc." style={inputStyle} />
      </div>
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Job Title</label>
        <input type="text" placeholder="Senior Frontend Engineer" style={inputStyle} />
      </div>
      <div style={inputGroupStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={labelStyle}>Description</label>
          <button 
            style={assistanceLinkButtonStyle}
            onClick={() => openAssistance('Experience Assistant', ['Improve this description', 'Turn into bullet points', 'Make it more achievement-oriented'], (text) => setDesc(text), { description: desc })}
          >
            <Sparkles size={14} /> Rewrite with Assistance
          </button>
        </div>
        <textarea 
          placeholder="What were your key responsibilities?" 
          style={textareaStyle} 
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>
    </div>
  );
};

const GoalsStep = () => {
  const [showManual, setShowManual] = useState(false);
  const [manualGoal, setManualGoal] = useState('');

  return (
    <div style={formGridStyle}>
      <div style={inputGroupStyle}>
        <label style={labelStyle}>What are you looking for?</label>
        <div style={goalsGridStyle}>
          <GoalOption label="Full-time Roles" />
          <GoalOption label="Contract Work" />
          <GoalOption label="Freelance Projects" />
          <GoalOption label="Fellowships" />
          <GoalOption label="Grants" />
          <GoalOption label="Leadership Positions" />
          <div style={{ ...goalOptionStyle, gridColumn: 'span 2' }}>
             <input 
              type="checkbox" 
              id="manual" 
              checked={showManual} 
              onChange={(e) => setShowManual(e.target.checked)} 
            />
            <label htmlFor="manual" style={{ flex: 1 }}>Others (Add manually)</label>
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
            value={manualGoal}
            onChange={(e) => setManualGoal(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

const AchievementStep = () => {
  const { openAssistance } = useAssistance();
  const [achievements, setAchievements] = useState<string[]>(['']);

  const addAchievement = () => setAchievements([...achievements, '']);
  const removeAchievement = (index: number) => {
    const newAchievements = [...achievements];
    newAchievements.splice(index, 1);
    setAchievements(newAchievements);
  };
  const updateAchievement = (index: number, value: string) => {
    const newAchievements = [...achievements];
    newAchievements[index] = value;
    setAchievements(newAchievements);
  };

  return (
    <div style={formGridStyle}>
      {achievements.map((ach, index) => (
        <div key={index} style={{ ...inputGroupStyle, padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={labelStyle}>Achievement #{index + 1}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                style={assistanceLinkButtonStyle}
                onClick={() => openAssistance('Achievement Assistant', ['Make this more impactful', 'Quantify this accomplishment'], (text) => updateAchievement(index, text), { achievement: ach })}
              >
                <Sparkles size={14} /> Assistance Polish
              </button>
              {achievements.length > 1 && (
                <button 
                  style={{ ...assistanceLinkButtonStyle, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
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

const ProjectsStep = () => {
  const [projects, setProjects] = useState<string[]>(['']);
  const addProject = () => setProjects([...projects, '']);
  const removeProject = (index: number) => {
    const newProjects = [...projects];
    newProjects.splice(index, 1);
    setProjects(newProjects);
  };
  const updateProject = (index: number, value: string) => {
    const newProjects = [...projects];
    newProjects[index] = value;
    setProjects(newProjects);
  };

  return (
    <div style={formGridStyle}>
      {projects.map((proj, index) => (
        <div key={index} style={listItemStyle}>
          <div style={listHeaderStyle}>
            <label style={labelStyle}>Project #{index + 1}</label>
            {projects.length > 1 && (
              <button style={removeBtnStyle} onClick={() => removeProject(index)}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <input 
            type="text" 
            placeholder="Project Title" 
            style={{ ...inputStyle, marginBottom: '8px' }}
          />
          <textarea 
            placeholder="Brief description of the project and your role..." 
            style={{ ...textareaStyle, minHeight: '80px' }}
            value={proj}
            onChange={(e) => updateProject(index, e.target.value)}
          />
        </div>
      ))}
      <Button variant="outline" onClick={addProject} style={addBtnStyle}>
        <Plus size={16} /> Add Another Project
      </Button>
    </div>
  );
};

const OrganisationStep = () => {
  const [orgs, setOrgs] = useState<string[]>(['']);
  const addOrg = () => setOrgs([...orgs, '']);
  const removeOrg = (index: number) => {
    const newOrgs = [...orgs];
    newOrgs.splice(index, 1);
    setOrgs(newOrgs);
  };

  return (
    <div style={formGridStyle}>
      <div style={inputGroupStyle}>
        <label style={labelStyle}>Primary Organisation</label>
        <input type="text" placeholder="Current Company or Institution" style={inputStyle} />
      </div>
      
      <div style={{ marginTop: '16px' }}>
        <label style={labelStyle}>Affiliated Organisations</label>
        {orgs.map((org, index) => (
          <div key={index} style={{ ...listItemStyle, marginTop: '12px' }}>
            <div style={listHeaderStyle}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Affiliation #{index + 1}</span>
              {orgs.length > 1 && (
                <button style={removeBtnStyle} onClick={() => removeOrg(index)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <input 
              type="text" 
              placeholder="Organisation Name" 
              style={inputStyle}
            />
          </div>
        ))}
        <Button variant="outline" onClick={addOrg} style={{ ...addBtnStyle, marginTop: '12px' }}>
          <Plus size={16} /> Add Affiliation
        </Button>
      </div>
    </div>
  );
};

const PortfolioStep = () => (
  <div style={formGridStyle}>
    <div style={uploadContainerStyle}>
      <div style={uploadIconStyle}>
        <Upload size={32} color="var(--accent-primary)" />
      </div>
      <h3 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>Upload your Portfolio</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px', textAlign: 'center' }}>
        Support for PDF, DOCX, and high-quality images. Max file size 10MB.
      </p>
      <input type="file" id="portfolio-upload" style={{ display: 'none' }} />
      <Button onClick={() => document.getElementById('portfolio-upload')?.click()}>
        <FileUp size={18} style={{ marginRight: '8px' }} />
        Select Files
      </Button>
    </div>
    
    <div style={inputGroupStyle}>
      <label style={labelStyle}>Portfolio Link (Optional)</label>
      <input type="url" placeholder="https://yourportfolio.com" style={inputStyle} />
    </div>
  </div>
);

const GoalOption = ({ label }: { label: string }) => (
  <div style={goalOptionStyle}>
    <input type="checkbox" id={label} />
    <label htmlFor={label}>{label}</label>
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
  padding: '24px 80px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--border-color)',
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '1.25rem',
  fontWeight: 800,
};

const stepperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '40px',
};

const stepItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  position: 'relative',
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
  position: 'absolute',
  right: '-30px',
  width: '20px',
  height: '1px',
  backgroundColor: 'var(--border-color)',
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
  maxWidth: '640px',
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
