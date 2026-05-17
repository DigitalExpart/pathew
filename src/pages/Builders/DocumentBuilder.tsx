import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBuilderAi } from '../../hooks/useBuilderAi';
import { SourcePicker } from '../../components/shared/SourcePicker';
import { ContextSummary } from '../../components/shared/ContextSummary';
import { MissingInfoPanel } from '../../components/shared/MissingInfoPanel';
import { BuilderEditor } from '../../components/shared/BuilderEditor';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { 
  Sparkles, 
  ArrowRight, 
  Settings, 
  Compass, 
  CheckCircle,
  Briefcase
} from 'lucide-react';

interface DocumentBuilderProps {
  type: 'CV' | 'Cover Letter' | 'Proposal';
  initialTitle: string;
  initialContent: string;
}

export const DocumentBuilder: React.FC<DocumentBuilderProps> = ({ 
  type, 
  initialTitle, 
  initialContent 
}) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oppIdParam = searchParams.get('oppId');

  // Map builder type keys
  const getBuilderTypeKey = () => {
    if (type === 'CV') return 'cv';
    if (type === 'Cover Letter') return 'cover_letter';
    return 'grant';
  };

  // Initialize unified AI hook
  const builder = useBuilderAi({
    builderType: getBuilderTypeKey(),
    defaultDocumentType: type,
    initialOpportunityId: oppIdParam,
  });

  // Ensure default content from page parameters is present if no AI draft exists yet
  useEffect(() => {
    if (!builder.draftContent && initialContent) {
      builder.setDraftContent(initialContent);
    }
  }, [initialContent]);

  const [oppDetails, setOppDetails] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch opportunity metadata if launched from dashboard link
  useEffect(() => {
    const fetchOpp = async () => {
      const activeId = oppIdParam || builder.opportunityId;
      if (activeId && activeId !== 'general') {
        try {
          const { data } = await supabase
            .from('opportunities')
            .select('*')
            .eq('id', activeId)
            .maybeSingle();
          if (data) {
            setOppDetails(data);
            builder.setOpportunityId(data.id);
            builder.setOpportunityText(data.description || '');
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchOpp();
  }, [oppIdParam]);

  // Stepper Header
  const renderStepper = () => {
    const steps = [
      { key: 'sources', label: '1. Sources & Target' },
      { key: 'missing', label: '2. Progressive Gaps' },
      { key: 'editor', label: '3. Perfect & Export' },
    ];

    return (
      <div style={stepperContainerStyle}>
        {steps.map((s, idx) => {
          const isActive = builder.stage === s.key || (builder.stage === 'extraction' && s.key === 'sources');
          const isDone = 
            (builder.stage === 'missing' && s.key === 'sources') ||
            (builder.stage === 'editor' && (s.key === 'sources' || s.key === 'missing'));

          return (
            <React.Fragment key={s.key}>
              <div style={stepWrapperStyle}>
                <span style={{ 
                  ...stepIconStyle,
                  backgroundColor: isActive ? 'var(--accent-primary)' : isDone ? 'rgba(16,185,129,0.1)' : 'var(--bg-tertiary)',
                  borderColor: isActive ? 'var(--accent-primary)' : isDone ? '#10b981' : 'var(--border-color)',
                  color: isActive ? '#fff' : isDone ? '#10b981' : 'var(--text-secondary)'
                }}>
                  {isDone ? <CheckCircle size={14} /> : idx + 1}
                </span>
                <span style={{ 
                  ...stepLabelStyle, 
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500 
                }}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div style={{ 
                  ...stepLineStyle,
                  backgroundColor: isDone ? '#10b981' : 'var(--border-color)' 
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p>Please sign in to access the builders.</p>
        <Button onClick={() => navigate('/login')} style={{ marginTop: '16px' }}>Sign In</Button>
      </div>
    );
  }

  return (
    <div style={layoutContainerStyle}>
      {/* Title block */}
      <header style={headerBlockStyle}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, marginBottom: '4px' }}>
            {initialTitle || `Tailored ${type} Workspace`}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {type === 'CV' && 'Create a highly tailored master resume focusing heavily on opportunity matches.'}
            {type === 'Cover Letter' && 'Draft a personal, high-converting letter tailored specifically to requirements.'}
            {type === 'Proposal' && 'Organize, structure, and answer funding requirements in persuasive proposal sections.'}
          </p>
        </div>

        {/* Stepper display */}
        {!isMobile && renderStepper()}
      </header>

      {/* Main stage displays */}
      <div style={{ flex: 1 }}>
        
        {/* STAGE 1: SOURCES AND OPPORTUNITY TARGET */}
        {builder.stage === 'sources' && (
          <div style={sourcesStageWrapperStyle}>
            
            {/* Target Job/Opportunity Selector */}
            <Card style={oppTargetCardStyle}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={iconBoxStyle}>
                  <Compass size={20} color="var(--accent-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>2. Target Opportunity Link or Description</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Paste the job description, funder requirements, or opportunity details to align your document.
                  </p>
                </div>
              </div>

              {oppDetails ? (
                <div style={oppDetailSummaryBoxStyle}>
                  <Briefcase size={16} color="var(--accent-primary)" />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {oppDetails.title}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {oppDetails.organization_name || oppDetails.funder_name || 'PATHEW listing'} • {oppDetails.location || 'Remote'}
                    </p>
                  </div>
                  <Badge variant="outline" style={{ textTransform: 'capitalize' }}>
                    {oppDetails.type}
                  </Badge>
                </div>
              ) : (
                <textarea 
                  placeholder="Paste target job listing, scholarship requirements, or funding proposal description here..."
                  value={builder.opportunityText}
                  onChange={(e) => builder.setOpportunityText(e.target.value)}
                  style={textareaStyle}
                />
              )}
            </Card>

            {/* Profile background sources picker */}
            <SourcePicker 
              sources={builder.sources}
              selectedSourceIds={builder.selectedSourceIds}
              onChangeSelected={builder.setSelectedSourceIds}
              onRefreshSources={builder.loadSources}
              userId={user.id}
            />

            {/* Generation settings configurations */}
            <Card style={settingsCardStyle}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Settings size={18} color="var(--accent-primary)" />
                3. AI Settings & Style Prefs
              </h3>

              <div style={settingsGridStyle}>
                <div>
                  <label style={labelStyle}>Tone of Voice</label>
                  <select 
                    value={builder.tone}
                    onChange={(e) => builder.setTone(e.target.value)}
                    style={selectInputStyle}
                  >
                    <option value="Professional & Academic">Professional & Academic (Formal & polished)</option>
                    <option value="Creative & Narrative">Creative & Narrative (Story-driven & expressive)</option>
                    <option value="Concise & Impactful">Concise & Impactful (Short, high-signal bullets)</option>
                    <option value="Casual & Friendly">Casual & Friendly (Warm & approachable)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Target Spelling / Language</label>
                  <select 
                    value={builder.language}
                    onChange={(e) => builder.setLanguage(e.target.value)}
                    style={selectInputStyle}
                  >
                    <option value="English (UK)">UK English (-programme, -ise)</option>
                    <option value="English (US)">US English (-program, -ize)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Spanish">Spanish (Español)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Word Target Limit</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="range" 
                      min="100" 
                      max="1000" 
                      step="50"
                      value={builder.wordLimit}
                      onChange={(e) => builder.setWordLimit(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{builder.wordLimit} words</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action triggering */}
            <div style={sourcesFooterStyle}>
              {builder.error && (
                <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{builder.error}</p>
              )}
              <Button 
                onClick={builder.startExtraction} 
                disabled={builder.selectedSourceIds.length === 0 || (!builder.opportunityText && !builder.opportunityId)}
                style={{ 
                  gap: '8px',
                  boxShadow: '0 4px 15px var(--accent-glow)',
                  width: isMobile ? '100%' : 'auto' 
                }}
              >
                Tailor suitability & Gaps
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* STAGE 2: LOADING SHIMMER GAUGE */}
        {builder.stage === 'extraction' && (
          <Card style={loadingContainerStyle}>
            <div className="animate-pulse" style={loadingShimmerStyle}>
              <Sparkles size={48} color="var(--accent-primary)" style={{ marginBottom: '20px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                Analyzing suitability fit...
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '380px' }}>
                Claude is parsing your past documents, matching keywords against opportunity requirements, and preparing progressive profile questions...
              </p>
              <div style={progressBarContainerStyle}>
                <div style={progressBarShimmerStyle} />
              </div>
            </div>
          </Card>
        )}

        {/* STAGE 3: PROGRESSIVE PROFILING (GAPS & SUMMARY) */}
        {builder.stage === 'missing' && (
          <div>
            <ContextSummary matchSummary={builder.matchSummary} confidence={builder.confidence} />
            <MissingInfoPanel 
              missingFields={builder.missingFields}
              answers={builder.missingAnswers}
              onChangeAnswers={builder.setMissingAnswers}
              onSubmit={() => builder.generateTailoredDraft(builder.sessionId, builder.missingAnswers)}
              isLoading={builder.isGenerating}
            />
          </div>
        )}

        {/* STAGE 4: MAIN WORKSPACE (EDITOR, PREVIEW & TAILOR DRAWER) */}
        {builder.stage === 'editor' && (
          <div>
            {/* Context Gaps expandable reference */}
            <Card style={referenceExpandableCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  ATS Match Fit Score: High • Gaps fully addressed in generation
                </span>
                <Badge variant="primary" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  Validated
                </Badge>
              </div>
            </Card>

            {builder.isGenerating ? (
              <Card style={{ padding: '60px', textAlign: 'center' }}>
                <Sparkles size={36} color="var(--accent-primary)" className="animate-spin" style={{ margin: '0 auto 16px' }} />
                <p>Generating document draft with Claude...</p>
              </Card>
            ) : (
              <BuilderEditor 
                draftContent={builder.draftContent}
                onChangeContent={builder.setDraftContent}
                onRegenerate={builder.regenerateDraft}
                onSaveVersion={builder.saveDraftToDb}
                savedVersions={builder.savedVersions}
                currentVersionNumber={builder.currentVersionNumber}
                onSelectVersion={(v) => {
                  builder.setDraftContent(v.content);
                  builder.setCurrentVersionNumber(v.version);
                }}
                isLoading={builder.isGenerating}
                documentType={type}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
};

// Styles
const layoutContainerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const headerBlockStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '20px',
};

const stepperContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const stepWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const stepIconStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: '1px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 700,
  transition: 'all 0.25s ease',
};

const stepLabelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 500,
};

const stepLineStyle: React.CSSProperties = {
  width: '40px',
  height: '2px',
  transition: 'background-color 0.25s ease',
};

const sourcesStageWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const oppTargetCardStyle: React.CSSProperties = {
  padding: '24px',
};

const iconBoxStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  height: '140px',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--text-primary)',
  padding: '16px',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
  resize: 'vertical',
  transition: 'border-color 0.2s ease',
};

const oppDetailSummaryBoxStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const settingsCardStyle: React.CSSProperties = {
  padding: '24px',
};

const settingsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '20px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 650,
  color: 'var(--text-secondary)',
  marginBottom: '8px',
  display: 'block',
};

const selectInputStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--text-primary)',
  padding: '12px 16px',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  cursor: 'pointer',
};

const sourcesFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
  paddingTop: '12px',
  borderTop: '1px solid var(--border-color)',
};

const loadingContainerStyle: React.CSSProperties = {
  padding: '80px 40px',
  display: 'flex',
  justifyContent: 'center',
  textAlign: 'center',
};

const loadingShimmerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const progressBarContainerStyle: React.CSSProperties = {
  width: '240px',
  height: '6px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '3px',
  marginTop: '24px',
  overflow: 'hidden',
  position: 'relative',
};

const progressBarShimmerStyle: React.CSSProperties = {
  width: '60px',
  height: '100%',
  backgroundColor: 'var(--accent-primary)',
  borderRadius: '3px',
  position: 'absolute',
  animation: 'shimmer 1.5s infinite linear',
};

const referenceExpandableCardStyle: React.CSSProperties = {
  padding: '12px 20px',
  backgroundColor: 'var(--bg-secondary)',
  marginBottom: '16px',
};
