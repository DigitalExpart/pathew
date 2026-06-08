import React from 'react';
import { PlanSelectionModal } from '../../components/shared/PlanSelectionModal';
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
  Target,
  Globe,
  Gift,
  Briefcase
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAssistant } from '../../context/AssistantContext';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

export const OpportunityDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { openAssistant } = useAssistant();
  const { t } = useTranslation();
  
  const [opp, setOpp] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isPlanModalOpen, setIsPlanModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [descExpanded, setDescExpanded] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    openAssistant('Pathew Assistant', t('opportunities.compatibilityPrompts', { returnObjects: true }) as string[], undefined, {
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
    if (!opp) return;
    setApplying(true);
    try {
      // 1. Increment click count
      await supabase.rpc('increment_click_count', { row_id: opp.id });

      // 2. Record Activity if logged in
      if (user) {
        await supabase.from('activities').insert({
          user_id: user.id,
          content: t('opportunities.activity.viewedApp', { title: opp.title, company: opp.organization_name || opp.funder_name })
        });
      }

      // 3. Open external link
      window.open(opp.apply_link, '_blank');
      
    } catch (error) {
      console.error('Error applying:', error);
    } finally {
      setApplying(false);
    }
  };

  const handleCreatePlan = (duration: string, pages: number) => {
    setIsPlanModalOpen(false);
    navigate(`/preparation?type=${duration.toLowerCase()}&oppId=${id}&pages=${pages}`);
  };

  return (
    <div style={containerStyle}>
      <Link to={opp?.type === 'job' ? "/jobs" : "/opportunities"} style={backLinkStyle}>
        <ArrowLeft size={18} /> {t('opportunities.backToOpportunities')}
      </Link>

      {loading && (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p>{t('common.loading')}</p>
        </div>
      )}

      {!loading && !opp && (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p>{t('opportunities.notFound')}</p>
        </div>
      )}

      {!loading && opp && (
        <>

      <div style={headerStyle}>
        <div style={headerMainStyle}>
          <div style={companyLogoStyle}>{(opp.organization_name || opp.funder_name || 'O').charAt(0)}</div>
          <div>
            <h1 style={titleStyle}>{opp.title}</h1>
            <p style={companyNameStyle}>{opp.organization_name || opp.funder_name || t('opportunities.variousSources')}</p>
          </div>
        </div>
        <div style={headerActionsStyle}>
          <Button 
            variant="outline"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t('common.saving') : t('common.save')}
          </Button>
          <Button 
            style={{ gap: '8px', whiteSpace: 'nowrap' }}
            onClick={handleApply}
            disabled={applying}
          >
            {applying ? t('common.loading') : t('opportunities.applyNow', 'Apply Now')} <ExternalLink size={16} />
          </Button>
        </div>
      </div>

      <div style={{ ...layoutGridStyle, gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr' }}>
        <div style={contentColStyle}>
          <Card style={{ marginBottom: '24px' }}>
            <h2 style={sectionTitleStyle}>{t('opportunities.description')}</h2>
            <div style={{ position: 'relative' }}>
              <p style={{
                ...descriptionStyle,
                display: '-webkit-box',
                WebkitLineClamp: descExpanded ? 'unset' : 5,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {opp.description}
              </p>
              {opp.description && (opp.description.length > 400 || opp.description.split('\n').length > 5) && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '8px 0',
                    fontSize: '0.875rem'
                  }}
                >
                  {descExpanded ? t('opportunities.readLess', 'Read Less') : t('opportunities.readMore', 'Read More')}
                </button>
              )}
            </div>
            
            <h2 style={{ ...sectionTitleStyle, marginTop: '32px' }}>{t('opportunities.requirementComparison')}</h2>
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
                    {!hasSkill && <Badge variant="outline" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.7rem' }}>{t('opportunities.skillGap')}</Badge>}
                  </div>
                );
              })}
            </div>

            <Card title={t('opportunities.getPreparationPlan')} icon={Target} style={{ backgroundColor: 'rgba(245, 158, 11, 0.03)', borderColor: 'var(--accent-glow)', marginTop: '32px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {t('opportunities.preparationPlanDesc')}
              </p>
              <Button 
                variant="outline" 
                onClick={() => setIsPlanModalOpen(true)}
                style={{ 
                  width: '100%',
                  justifyContent: 'center',
                  fontSize: '0.875rem', 
                  fontWeight: 600,
                  gap: '8px',
                  padding: '12px',
                  color: 'var(--accent-primary)',
                  borderColor: 'rgba(245, 158, 11, 0.3)'
                }}
              >
                <Target size={16} />
                {t('planSelection.title', 'Choose Your Preparation Plan')}
              </Button>
            </Card>
          </Card>

          <Card title={t('opportunities.prepareApplication')}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {t('opportunities.prepareApplicationDesc')}
            </p>
            <div style={docGenGridStyle}>
              {opp.type !== 'grant' && (
                <DocGenCard 
                  icon={FileText} 
                  title={t('builders.cv.title')}
                  desc={t('builders.cv.desc')}
                  path={`/cv-builder?oppId=${opp.id}`}
                />
              )}
              <DocGenCard 
                icon={FileEdit} 
                title={t('builders.coverLetter.title')}
                desc={t('builders.coverLetter.desc')}
                path={`/cover-letter?oppId=${opp.id}`}
              />
              {opp.type === 'grant' && (
                <DocGenCard 
                  icon={Target} 
                  title={t('builders.proposal.grantBuilderTitle', 'Grant Builder')}
                  desc={t('builders.proposal.grantBuilderDesc', 'Build your grant application proposal.')}
                  path={`/grant-builder?oppId=${opp.id}`}
                />
              )}
            </div>
          </Card>
        </div>

        <div style={sidebarColStyle}>
          <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
            <h3 style={matchScoreTitleStyle}>{t('assistant.title')}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
              {t('opportunities.analysisDesc')}
            </p>
            
            <Button 
              variant="outline" 
              size="sm" 
              style={{ marginTop: '20px', width: '100%', gap: '8px', color: 'var(--accent-primary)', borderColor: 'rgba(245, 158, 11, 0.2)' }}
              onClick={handleFitAnalysis}
            >
              <Sparkles size={14} />
              {t('opportunities.analyzeFit')}
            </Button>
          </Card>

          <Card title={t('opportunities.atAGlance')}>
            <div style={infoGridStyle}>
              <InfoItem icon={MapPin} label={t('opportunities.location')} value={opp.location || `${t('opportunities.remoteOnly')} / ${t('opportunities.variousSources')}`} />
              <InfoItem icon={Calendar} label={t('opportunities.deadline')} value={opp.deadline || t('opportunities.noDeadline')} />
              <InfoItem icon={Globe} label={t('opportunities.type')} value={opp.type} />
              {opp.salary && <InfoItem icon={Briefcase} label={t('opportunities.salary')} value={opp.salary} />}
              {opp.amount && <InfoItem icon={Gift} label={t('opportunities.funding')} value={opp.amount} />}
              {opp.work_mode && <InfoItem icon={Target} label={t('opportunities.mode')} value={opp.work_mode} />}
            </div>
          </Card>

          {opp.missingRequirements?.length > 0 && (
            <Card style={{ marginTop: '24px', borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <AlertCircle size={20} color="#ef4444" />
                <h3 style={{ fontSize: '1rem', color: '#ef4444', fontWeight: 700 }}>{t('opportunities.priorityGaps')}</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {t('opportunities.priorityGapsDesc')}
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

      <PlanSelectionModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSelect={handleCreatePlan}
        deadline={opp.deadline}
        opportunityTitle={opp.title}
      />
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
  whiteSpace: 'pre-wrap',
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

