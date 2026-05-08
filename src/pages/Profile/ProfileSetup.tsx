import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Sparkles, User, BookOpen, Briefcase, Target, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const steps = [
  { id: 'story', title: 'Your Story', icon: User },
  { id: 'education', title: 'Education', icon: BookOpen },
  { id: 'experience', title: 'Experience', icon: Briefcase },
  { id: 'goals', title: 'Goals', icon: Target },
];

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
          <Sparkles size={24} color="var(--accent-primary)" />
          <span>Herpath</span>
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
              Tell us more about yourself to help our AI find the best matches.
            </p>
          </div>

          <Card style={{ padding: '32px' }}>
            {currentStep === 0 && <StoryStep />}
            {currentStep === 1 && <EducationStep />}
            {currentStep === 2 && <ExperienceStep />}
            {currentStep === 3 && <GoalsStep />}

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
const StoryStep = () => (
  <div style={formGridStyle}>
    <div style={inputGroupStyle}>
      <label style={labelStyle}>Bio / Personal Story</label>
      <textarea 
        placeholder="Share your background, passions, and what drives you professionally..." 
        style={textareaStyle}
      />
    </div>
    <div style={inputGroupStyle}>
      <label style={labelStyle}>Skills (Comma separated)</label>
      <input type="text" placeholder="React, TypeScript, Project Management..." style={inputStyle} />
    </div>
  </div>
);

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

const ExperienceStep = () => (
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
      <label style={labelStyle}>Description</label>
      <textarea placeholder="What were your key responsibilities?" style={textareaStyle} />
    </div>
  </div>
);

const GoalsStep = () => (
  <div style={formGridStyle}>
    <div style={inputGroupStyle}>
      <label style={labelStyle}>What are you looking for?</label>
      <div style={goalsGridStyle}>
        <GoalOption label="Full-time Roles" />
        <GoalOption label="Contract Work" />
        <GoalOption label="Freelance Projects" />
        <GoalOption label="Leadership Positions" />
      </div>
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
