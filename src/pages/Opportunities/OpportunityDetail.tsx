import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileEdit,
  Send,
  XCircle,
  Target
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAssistant } from '../../context/AssistantContext';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const OpportunityDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { openAssistant } = useAssistant();
  
  const [opp, setOpp] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [applying, setApplying] = React.useState(false);

  React.useEffect(() => {
    const fetchOpp = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setOpp(data);
      } catch (error) {
        console.error('Error fetching opportunity:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOpp();
  }, [id]);

  const handleFitAnalysis = () => {
    if (!opp) return;
    (window as any).currentOpportunityId = opp.id;
    openAssistant('Pathew Assistant', [
      'Explain my compatibility',
      'Generate a readiness plan',
      'Identify my strengths and gaps',
      'Suggest next steps'
    ], undefined, {
      opportunityId: opp.id,
      opportunityDescription: opp.description,
      title: opp.title,
      company: opp.company
    });
  };

  const handleSave = async () => {
    if (!user || !opp) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ status: 'Saved' })
        .eq('id', opp.id);
      
      if (error) throw error;
      setOpp({ ...opp, status: 'Saved' });
      
      await supabase.from('activities').insert({
        user_id: user.id,
        content: `Saved opportunity: ${opp.title}`
      });
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    if (!user || !opp) return;
    setApplying(true);
    try {
      // 1. Record in Jobs table
      await supabase.from('jobs').insert({
        user_id: user.id,
        title: opp.title,
        company: opp.company,
        status: 'Applied'
      });

      // 2. Record Activity
      await supabase.from('activities').insert({
        user_id: user.id,
        content: `Applied for ${opp.title} at ${opp.company}`
      });

      // 3. Redirect (Mocking external link for now, but recording the action)
      window.open('https://linkedin.com', '_blank');
      
    } catch (error) {
      console.error('Error applying:', error);
    } finally {
      setApplying(false);
    }
  };

  const handleCreatePlan = (duration: string) => {
    setIsModalOpen(false);
    navigate(`/preparation?type=${duration.toLowerCase()}&oppId=${id}`);
  };

  return (
    <div style={containerStyle}>
      <Link to="/opportunities" style={backLinkStyle}>
        <ArrowLeft size={18} /> Back to list
      </Link>

      {loading && (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p>Loading details...</p>
        </div>
      )}

      {!loading && !opp && (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p>Opportunity not found.</p>
        </div>
      )}

      {!loading && opp && (
        <>

      <div style={headerStyle}>
        <div style={headerMainStyle}>
          <div style={companyLogoStyle}>{opp.company.charAt(0)}</div>
          <div>
            <h1 style={titleStyle}>{opp.title}</h1>
            <p style={companyNameStyle}>{opp.company}</p>
          </div>
        </div>
        <div style={headerActionsStyle}>
          <Button 
            variant={opp?.status === 'Saved' ? 'secondary' : 'outline'}
            onClick={handleSave}
            disabled={saving || opp?.status === 'Saved'}
          >
            {saving ? 'Saving...' : opp?.status === 'Saved' ? 'Saved' : 'Save'}
          </Button>
          <Button 
            style={{ gap: '8px' }}
            onClick={handleApply}
            disabled={applying}
          >
            {applying ? 'Processing...' : `Apply on ${opp?.source || 'Portal'}`} <ExternalLink size={16} />
          </Button>
        </div>
      </div>

      <div style={layoutGridStyle}>
        <div style={contentColStyle}>
          <Card style={{ marginBottom: '24px' }}>
            <h2 style={sectionTitleStyle}>Description</h2>
            <p style={descriptionStyle}>{opp.description}</p>
            
            <h2 style={{ ...sectionTitleStyle, marginTop: '32px' }}>Requirement Comparison</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {(opp.requirements || []).map((req: string, i: number) => {
                const searchReq = req?.toLowerCase() || '';
                const hasSkill = profile?.skills?.some(s => s.toLowerCase().includes(searchReq)) || 
                                 profile?.experience?.some(e => e.description?.toLowerCase().includes(searchReq)) ||
                                 profile?.story?.toLowerCase().includes(searchReq);
                return (
                  <div key={i} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '12px 16px', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${hasSkill ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {hasSkill ? (
                        <CheckCircle2 size={18} color="#22c55e" />
                      ) : (
                        <XCircle size={18} color="#ef4444" />
                      )}
                      <span style={{ 
                        fontWeight: 500,
                        color: hasSkill ? 'var(--text-primary)' : 'var(--text-secondary)' 
                      }}>
                        {req}
                      </span>
                    </div>
                    {!hasSkill && <Badge variant="outline" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.7rem' }}>Skill Gap</Badge>}
                  </div>
                );
              })}
            </div>

            <Card title="Get Preparation Plan" icon={Target} style={{ backgroundColor: 'rgba(245, 158, 11, 0.03)', borderColor: 'var(--accent-glow)', marginTop: '32px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Based on the comparison above, our Assistant can generate a roadmap to help you bridge your identified gaps.
              </p>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px' 
              }}>
                {['Quick', '90-Day', '180-Day', '365-Day'].map(duration => (
                  <Button 
                    key={duration} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCreatePlan(duration)}
                    style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      flex: '1 1 calc(25% - 12px)',
                      minWidth: '100px'
                    }}
                  >
                    {duration}
                  </Button>
                ))}
              </div>
            </Card>
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

          {opp.missingRequirements?.length > 0 && (
            <Card style={{ marginTop: '24px', borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <AlertCircle size={20} color="#ef4444" />
                <h3 style={{ fontSize: '1rem', color: '#ef4444', fontWeight: 700 }}>Priority Gaps</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Our Assistant suggests focusing on these areas first:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(opp.missingRequirements || []).map((req: any, i: number) => (
                   <Badge key={i} variant="outline" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>{req}</Badge>
                ))}
              </div>
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
        </>
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
