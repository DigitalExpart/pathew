import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileEdit,
  Send
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { mockOpportunities } from '../../data/mockData';
import { useAI } from '../../context/AIContext';
import { Sparkles } from 'lucide-react';

export const OpportunityDetail: React.FC = () => {
  const { id } = useParams();
  const opp = mockOpportunities.find(o => o.id === id) || mockOpportunities[0];
  const { openAIAssistant } = useAI();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleFitAnalysis = () => {
    openAIAssistant('Pathew Assistance', [
      'Explain my compatibility',
      'Generate a readiness plan',
      'Identify my strengths and gaps',
      'Suggest next steps'
    ]);
  };

  const handleCreatePlan = (duration: string) => {
    setIsModalOpen(false);
    openAIAssistant('Pathew Assistance', [
      `Generate a ${duration} preparation plan`,
      `How to gain ${opp.missingRequirements[0]} in ${duration}`,
      'Suggest resources for this plan'
    ], undefined, {
      duration,
      opportunity: opp.title,
      gaps: opp.missingRequirements
    });
  };

  return (
    <div style={containerStyle}>
      <Link to="/opportunities" style={backLinkStyle}>
        <ArrowLeft size={18} /> Back to list
      </Link>

      <div style={headerStyle}>
        <div style={headerMainStyle}>
          <div style={companyLogoStyle}>{opp.company.charAt(0)}</div>
          <div>
            <h1 style={titleStyle}>{opp.title}</h1>
            <p style={companyNameStyle}>{opp.company}</p>
          </div>
        </div>
        <div style={headerActionsStyle}>
          <Button variant="outline">Save</Button>
          <Button style={{ gap: '8px' }}>
            Apply on {opp.source} <ExternalLink size={16} />
          </Button>
        </div>
      </div>

      <div style={layoutGridStyle}>
        <div style={contentColStyle}>
          <Card style={{ marginBottom: '24px' }}>
            <h2 style={sectionTitleStyle}>Description</h2>
            <p style={descriptionStyle}>{opp.description}</p>
            
            <h2 style={{ ...sectionTitleStyle, marginTop: '32px' }}>Key Requirements</h2>
            <ul style={requirementsListStyle}>
              {opp.requirements.map((req, i) => (
                <li key={i} style={requirementItemStyle}>
                  <CheckCircle2 size={18} color="#22c55e" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Prepare Your Application">
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Generate tailored documents specifically for this role based on your profile and the requirements above.
            </p>
            <div style={docGenGridStyle}>
              <DocGenCard 
                icon={FileText} 
                title="Tailored CV" 
                desc="Optimize your experience for this role." 
                path="/cv-builder"
              />
              <DocGenCard 
                icon={FileEdit} 
                title="Cover Letter" 
                desc="Write a compelling narrative." 
                path="/cover-letter"
              />
              <DocGenCard 
                icon={Send} 
                title="Proposal" 
                desc="Structure your pitch perfectly." 
                path="/proposal"
              />
            </div>
          </Card>
        </div>

        <div style={sidebarColStyle}>
          <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
            <h3 style={matchScoreTitleStyle}>Assistant Analysis</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
              Get a detailed analysis of your fit for this opportunity.
            </p>
            
            <Button 
              variant="outline" 
              size="sm" 
              style={{ marginTop: '20px', width: '100%', gap: '8px', color: 'var(--accent-primary)', borderColor: 'rgba(245, 158, 11, 0.2)' }}
              onClick={handleFitAnalysis}
            >
              <Sparkles size={14} />
              Analyze Fit
            </Button>
          </Card>

          <Card title="At a Glance">
            <div style={infoGridStyle}>
              <InfoItem icon={MapPin} label="Location" value={opp.location} />
              <InfoItem icon={Calendar} label="Deadline" value={opp.deadline} />
              <InfoItem icon={ArrowLeft} label="Type" value={opp.type} />
            </div>
          </Card>

          {opp.missingRequirements.length > 0 && (
            <Card style={{ marginTop: '24px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <AlertCircle size={20} color="#ef4444" />
                <h3 style={{ fontSize: '1rem', color: '#ef4444' }}>Improve Fit</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                You are missing these key requirements:
              </p>
              <ul style={{ paddingLeft: '20px', fontSize: '0.875rem' }}>
                {opp.missingRequirements.map((req, i) => (
                   <li key={i} style={{ marginBottom: '4px' }}>{req}</li>
                ))}
              </ul>
              <Button 
                variant="primary" 
                size="sm" 
                style={{ marginTop: '20px', width: '100%', gap: '8px' }}
                onClick={() => setIsModalOpen(true)}
              >
                Create a Plan
              </Button>
            </Card>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <Card style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Preparation Plan</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>✕</Button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Select a duration for your tailored preparation plan to bridge the identified gaps.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {['Quick', '90-day', '180-day', '365-day'].map(duration => (
                <Button key={duration} variant="outline" onClick={() => handleCreatePlan(duration)}>
                  {duration}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Sub-components
const DocGenCard = ({ icon: Icon, title, desc, path }: any) => (
  <Link to={path} style={{ textDecoration: 'none' }}>
    <div style={docGenCardStyle}>
      <div style={docIconWrapperStyle}>
        <Icon size={20} color="var(--accent-primary)" />
      </div>
      <div>
        <h4 style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{title}</h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{desc}</p>
      </div>
    </div>
  </Link>
);

const BreakdownItem = ({ label, value }: { label: string, value: number }) => (
  <div style={breakdownItemStyle}>
    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</span>
    <div style={progressContainerStyle}>
      <div style={{ ...progressFillStyle, width: `${value}%` }}></div>
    </div>
    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{value}%</span>
  </div>
);

const InfoItem = ({ icon: Icon, label, value }: any) => (
  <div style={infoItemStyle}>
    <Icon size={16} color="var(--text-muted)" />
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</p>
      <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value}</p>
    </div>
  </div>
);

// Styles
const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
};

const backLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: 'var(--text-secondary)',
  fontSize: '0.875rem',
  marginBottom: '32px',
  textDecoration: 'none',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '40px',
};

const headerMainStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
  alignItems: 'center',
};

const companyLogoStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  fontWeight: 800,
  color: 'var(--accent-primary)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2.25rem',
  marginBottom: '4px',
};

const companyNameStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  color: 'var(--accent-primary)',
  fontWeight: 600,
};

const headerActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
};

const layoutGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '32px',
};

const contentColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const sidebarColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  marginBottom: '16px',
};

const descriptionStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  lineHeight: 1.8,
};

const requirementsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const requirementItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  color: 'var(--text-secondary)',
};

const docGenGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const docGenCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  backgroundColor: 'var(--bg-primary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-color)',
  transition: 'all 0.2s ease',
};

const docIconWrapperStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const matchScoreTitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
  marginBottom: '20px',
};

const matchCircleLargeStyle: React.CSSProperties = {
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  border: '6px solid var(--accent-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  boxShadow: '0 0 20px var(--accent-glow)',
};

const matchValueLargeStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 800,
  color: 'var(--accent-primary)',
};

const breakdownGridStyle: React.CSSProperties = {
  marginTop: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const breakdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const progressContainerStyle: React.CSSProperties = {
  flex: 1,
  height: '6px',
  backgroundColor: 'var(--bg-primary)',
  borderRadius: '3px',
  overflow: 'hidden',
};

const progressFillStyle: React.CSSProperties = {
  height: '100%',
  backgroundColor: 'var(--accent-primary)',
};

const infoGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const infoItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  backdropFilter: 'blur(8px)',
};

const modalContentStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '450px',
  padding: '32px',
  animation: 'scaleIn 0.2s ease-out',
};
