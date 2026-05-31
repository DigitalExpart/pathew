import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
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
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface DocumentBuilderProps {
  type: 'CV' | 'Cover Letter' | 'Proposal';
  initialTitle?: string;
  initialContent?: string;
}

export const DocumentBuilder: React.FC<DocumentBuilderProps> = ({ 
  type, 
  initialTitle, 
  initialContent 
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
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

  const isFormInvalid = () => {
    if (builder.selectedSourceIds.length === 0) return true;
    if (!builder.opportunityText && !builder.opportunityId) return true;
    
    if (type === 'CV' && builder.careerGap && !builder.careerGapExplanation?.trim()) {
      return true;
    }
    if (type === 'Cover Letter' && !builder.projectAnchor?.trim()) {
      return true;
    }
    if (type === 'Proposal') {
      if (builder.hasPartner && (!builder.partnerName?.trim() || !builder.partnerRole?.trim())) {
        return true;
      }
      if (builder.previousAppHistory && !builder.previousAppFeedback?.trim()) {
        return true;
      }
    }
    return false;
  };

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
              <div 
                style={{ 
                  ...stepWrapperStyle, 
                  cursor: isDone ? 'pointer' : 'default',
                  opacity: isDone || isActive ? 1 : 0.6
                }}
                onClick={() => {
                  if (isDone) {
                    builder.setStage(s.key as any);
                  }
                }}
              >
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
        <p>{t('builders.common.signInRequired', 'Please sign in to access the builders.')}</p>
        <Button onClick={() => navigate('/login')} style={{ marginTop: '16px' }}>{t('common.signIn', 'Sign In')}</Button>
      </div>
    );
  }

  return (
    <div style={layoutContainerStyle}>
      {/* Title block */}
      <header style={headerBlockStyle}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, marginBottom: '4px' }}>
            {oppDetails ? t('builders.common.tailoredOppTitle', 'Tailored {{type}} - {{title}}', { type, title: oppDetails.title }) : (initialTitle || t('builders.common.tailoredTitle', 'Tailored {{type}} Workspace', { type }))}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {type === 'CV' && t('builders.cv.subtitle', 'Create a highly tailored master resume focusing heavily on opportunity matches.')}
            {type === 'Cover Letter' && t('builders.coverLetter.subtitle', 'Draft a personal, high-converting letter tailored specifically to requirements.')}
            {type === 'Proposal' && t('builders.proposal.subtitle', 'Organize, structure, and answer funding requirements in persuasive proposal sections.')}
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
            
            {/* Profile background sources picker */}
            <SourcePicker 
              sources={builder.sources}
              selectedSourceIds={builder.selectedSourceIds}
              onChangeSelected={builder.setSelectedSourceIds}
              onRefreshSources={builder.loadSources}
              userId={user.id}
            />

            {/* Target Job/Opportunity Selector */}
            <Card style={oppTargetCardStyle}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={iconBoxStyle}>
                  <Compass size={20} color="var(--accent-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t('builders.sources.step2Title', '2. Target Opportunity Description')}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {t('builders.sources.step2Desc', 'Paste the job description, funder requirements, or opportunity details to align your document.')}
                  </p>
                </div>
              </div>

              {oppDetails && (
                <div style={{ ...oppDetailSummaryBoxStyle, marginBottom: '16px' }}>
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
              )}
              
              <textarea 
                placeholder={t('builders.sources.textareaPlaceholder', 'Paste target job listing, scholarship requirements, or funding proposal description here...')}
                value={builder.opportunityText}
                onChange={(e) => builder.setOpportunityText(e.target.value)}
                style={textareaStyle}
              />
            </Card>

            {/* Generation settings configurations */}
            <Card style={{ ...settingsCardStyle, padding: isMobile ? '20px' : '32px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', gap: '10px', alignItems: 'center', margin: 0 }}>
                  <Settings size={22} color="var(--accent-primary)" />
                  3. Style Preference
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', marginLeft: isMobile ? '0' : '32px' }}>
                  Fine-tune the assistant's output to match your professional brand and target requirements.
                </p>
              </div>

              <div style={settingsGridStyle}>

                {/* CV BUILDER CONDITIONAL INPUTS */}
                {type === 'CV' && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '8px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <label style={{ ...labelStyle, color: 'var(--accent-primary)' }}>CV Type</label>
                        <select 
                          value={builder.cvType}
                          onChange={(e) => builder.setCvType(e.target.value)}
                          style={{ ...selectInputStyle, border: 'none', backgroundColor: 'var(--bg-tertiary)', marginTop: '8px' }}
                        >
                          <option value="Work CV">Work CV (Standard corporate layout)</option>
                          <option value="Teaching / Academic CV">Teaching / Academic CV (Rigid academic sections)</option>
                        </select>
                      </div>

                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <label style={{ ...labelStyle, color: 'var(--accent-primary)' }}>Experience Level</label>
                        <select 
                          value={builder.experienceLevel}
                          onChange={(e) => builder.setExperienceLevel(e.target.value)}
                          style={{ ...selectInputStyle, border: 'none', backgroundColor: 'var(--bg-tertiary)', marginTop: '8px' }}
                        >
                          <option value="Graduate">Graduate (Academic highlights & entry roles)</option>
                          <option value="Early Career">Early Career (1-3 years experience)</option>
                          <option value="Mid Career">Mid Career (3-8 years experience)</option>
                          <option value="Senior">Senior (8+ years experience & leadership)</option>
                          <option value="Executive">Executive (Director/C-level corporate governance)</option>
                        </select>
                      </div>

                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <label style={{ ...labelStyle, color: 'var(--accent-primary)' }}>Number of Pages</label>
                        <select
                          value={builder.pageCount}
                          onChange={(e) => builder.setPageCount(Number(e.target.value))}
                          style={{ ...selectInputStyle, border: 'none', backgroundColor: 'var(--bg-tertiary)', marginTop: '8px' }}
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* COVER LETTER BUILDER CONDITIONAL INPUTS */}
                {type === 'Cover Letter' && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <label style={{ ...labelStyle, color: 'var(--accent-primary)' }}>Target Word Count</label>
                        <select 
                          value={builder.wordLimit}
                          onChange={(e) => builder.setWordLimit(Number(e.target.value))}
                          style={{ ...selectInputStyle, border: 'none', backgroundColor: 'var(--bg-tertiary)', marginTop: '8px' }}
                        >
                          <option value={250}>250 Words (Concise & direct)</option>
                          <option value={350}>350 Words (Ideal, default cover letter)</option>
                          <option value={500}>500 Words (Detailed fellowship or proposal letter)</option>
                        </select>
                      </div>

                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <label style={{ ...labelStyle, color: 'var(--accent-primary)' }}>Application Stage</label>
                        <select 
                          value={builder.applicationStage}
                          onChange={(e) => builder.setApplicationStage(e.target.value)}
                          style={{ ...selectInputStyle, border: 'none', backgroundColor: 'var(--bg-tertiary)', marginTop: '8px' }}
                        >
                          <option value="Applying for an advertised role">Advertised role (Standard match)</option>
                          <option value="Speculative application">Speculative (Cold outreach)</option>
                          <option value="Following a referral">Following a referral (Warm lead)</option>
                          <option value="Responding to a recruiter">Responding to a recruiter</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px 20px 20px', borderRadius: '12px', border: '1px solid var(--accent-primary)', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '-12px', left: '20px', backgroundColor: 'var(--bg-primary)', padding: '2px 12px', borderRadius: '12px', border: '1px solid var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} color="var(--accent-primary)" />
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>CRITICAL ANCHOR</span>
                      </div>
                      <label style={{ ...labelStyle, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '4px' }}>Core Project or Achievement to Highlight *</label>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                        This will be the central anchor of your cover letter. Pathew Assistant will build the entire narrative around this priority to ensure it connects deeply with the reader.
                      </p>
                      <textarea
                        placeholder="e.g. Led a 5-person engineering team to rebuild the core checkout flow using Next.js and Tailwind, increasing conversion by 28% and performance by 40%."
                        value={builder.projectAnchor}
                        onChange={(e) => builder.setProjectAnchor(e.target.value)}
                        style={{ ...textareaStyle, height: '90px', minHeight: '90px', border: '1px solid var(--accent-primary)', backgroundColor: 'var(--bg-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* GRANT BUILDER CONDITIONAL INPUTS */}
                {type === 'Proposal' && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '8px' }}>
                    
                    {/* General Setup */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: '20px' }}>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <label style={{ ...labelStyle, color: 'var(--accent-primary)' }}>Target Page Count</label>
                        <select
                          value={builder.pageCount}
                          onChange={(e) => builder.setPageCount(Number(e.target.value))}
                          style={{ ...selectInputStyle, border: 'none', backgroundColor: 'var(--bg-tertiary)', marginTop: '8px' }}
                        >
                          {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num} Page{num > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <label style={{ ...labelStyle, color: 'var(--accent-primary)' }}>Funder's Mission & Values Alignment</label>
                        <textarea
                          placeholder="e.g. Empowering underrepresented youth through technical education..."
                          value={builder.funderValues}
                          onChange={(e) => builder.setFunderValues(e.target.value)}
                          style={{ ...textareaStyle, height: '42px', minHeight: '42px', padding: '10px 12px', marginTop: '8px', border: 'none', backgroundColor: 'var(--bg-tertiary)' }}
                        />
                      </div>
                    </div>

                    {/* Partnership & History */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                          <label style={{ ...labelStyle, margin: 0, color: 'var(--text-primary)' }}>Application Structure</label>
                          <div style={{ display: 'flex', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', padding: '4px' }}>
                            <button 
                              type="button"
                              onClick={() => { builder.setHasPartner(false); builder.setPartnerName(''); builder.setPartnerRole(''); }}
                              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: !builder.hasPartner ? 'var(--bg-primary)' : 'transparent', color: !builder.hasPartner ? 'var(--accent-primary)' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: !builder.hasPartner ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                            >
                              Solo
                            </button>
                            <button 
                              type="button"
                              onClick={() => builder.setHasPartner(true)}
                              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: builder.hasPartner ? 'var(--bg-primary)' : 'transparent', color: builder.hasPartner ? 'var(--accent-primary)' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: builder.hasPartner ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                            >
                              Partnership
                            </button>
                          </div>
                        </div>
                        {builder.hasPartner && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.3s ease' }}>
                            <input
                              type="text"
                              placeholder="Partner Organization Name"
                              value={builder.partnerName}
                              onChange={(e) => builder.setPartnerName(e.target.value)}
                              style={{ ...selectInputStyle, backgroundColor: 'var(--bg-tertiary)', border: 'none' }}
                            />
                            <input
                              type="text"
                              placeholder="Partner Role / Contribution"
                              value={builder.partnerRole}
                              onChange={(e) => builder.setPartnerRole(e.target.value)}
                              style={{ ...selectInputStyle, backgroundColor: 'var(--bg-tertiary)', border: 'none' }}
                            />
                          </div>
                        )}
                      </div>

                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                          <label style={{ ...labelStyle, margin: 0, color: 'var(--text-primary)' }}>Applied Before?</label>
                          <div style={{ display: 'flex', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', padding: '4px' }}>
                            <button 
                              type="button"
                              onClick={() => builder.setPreviousAppHistory(true)}
                              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: builder.previousAppHistory ? 'var(--bg-primary)' : 'transparent', color: builder.previousAppHistory ? '#f59e0b' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: builder.previousAppHistory ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                            >
                              Yes
                            </button>
                            <button 
                              type="button"
                              onClick={() => { builder.setPreviousAppHistory(false); builder.setPreviousAppFeedback(''); }}
                              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: !builder.previousAppHistory ? 'var(--bg-primary)' : 'transparent', color: !builder.previousAppHistory ? 'var(--accent-primary)' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: !builder.previousAppHistory ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                            >
                              No
                            </button>
                          </div>
                        </div>
                        {builder.previousAppHistory && (
                          <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <textarea
                              placeholder="Feedback received from previous application..."
                              value={builder.previousAppFeedback}
                              onChange={(e) => builder.setPreviousAppFeedback(e.target.value)}
                              style={{ ...textareaStyle, height: '82px', minHeight: '82px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid rgba(245,158,11,0.2)' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reporting Methods */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <label style={{ ...labelStyle, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Reporting & Accountability Methods</label>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Select or add performance indicators Pathew Assistant will weave into the Theory of Change & Sustainability narrative.
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        {['Monthly User Data', 'Cohort Completion Rates', 'Employment Outcomes', 'Financial Audits'].map(m => {
                          const isSelected = builder.reportingMethods.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  builder.setReportingMethods(builder.reportingMethods.filter(x => x !== m));
                                } else {
                                  builder.setReportingMethods([...builder.reportingMethods, m]);
                                }
                              }}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '24px',
                                fontSize: '0.8rem',
                                border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                                color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontWeight: 700,
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {isSelected && <CheckCircle size={14} />}
                              {m}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          placeholder="Type and press Enter to add a custom reporting indicator..."
                          style={{ ...selectInputStyle, backgroundColor: 'var(--bg-tertiary)', border: '1px dashed var(--border-color)', flex: 1 }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val && !builder.reportingMethods.includes(val)) {
                                builder.setReportingMethods([...builder.reportingMethods, val]);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Custom Questions Manager */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px 20px 20px', borderRadius: '12px', border: '1px solid var(--accent-primary)', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '-12px', left: '20px', backgroundColor: 'var(--bg-primary)', padding: '2px 12px', borderRadius: '12px', border: '1px solid var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} color="var(--accent-primary)" />
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>DYNAMIC QUESTIONS ({builder.customQuestions.length})</span>
                      </div>
                      <label style={{ ...labelStyle, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '4px' }}>Funder Specific Questions</label>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
                        Add specific questions from the funder proposal guidelines. Pathew Assistant will generate compliant, precisely tailored responses for each of them.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                        {builder.customQuestions.map((q: any, index: number) => (
                          <div key={q.id || index} style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Badge variant="outline" style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', backgroundColor: 'transparent', fontWeight: 800 }}>
                                Question {index + 1}
                              </Badge>
                              <button
                                type="button"
                                onClick={() => builder.setCustomQuestions(builder.customQuestions.filter((_, idx) => idx !== index))}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700, opacity: 0.8, transition: 'opacity 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="e.g. Describe your organization's capacity to deliver this program."
                              value={q.question}
                              onChange={(e) => {
                                const updated = [...builder.customQuestions];
                                updated[index].question = e.target.value;
                                builder.setCustomQuestions(updated);
                              }}
                              style={{ ...selectInputStyle, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                              required
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', alignSelf: 'flex-start', backgroundColor: 'var(--bg-primary)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Word limit:</span>
                              <input
                                type="number"
                                min="50"
                                max="2000"
                                value={q.wordLimit || 300}
                                onChange={(e) => {
                                  const updated = [...builder.customQuestions];
                                  updated[index].wordLimit = Number(e.target.value);
                                  builder.setCustomQuestions(updated);
                                }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '60px', fontWeight: 700, fontSize: '0.9rem' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => builder.setCustomQuestions([...builder.customQuestions, { id: Math.random().toString(), question: '', wordLimit: 300 }])}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px dashed var(--accent-primary)',
                          color: 'var(--accent-primary)',
                          borderRadius: '8px',
                          padding: '12px 20px',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Sparkles size={16} />
                        Add Custom Funder Question
                      </button>
                    </div>
                  </div>
                )}

                {/* General Settings Box */}
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', backgroundColor: 'var(--bg-tertiary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <label style={labelStyle}>Tone of Voice</label>
                    <select 
                      value={builder.tone}
                      onChange={(e) => builder.setTone(e.target.value)}
                      style={{ ...selectInputStyle, backgroundColor: 'var(--bg-secondary)', border: 'none' }}
                    >
                      <option value="N/A">N/A</option>
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
                      style={{ ...selectInputStyle, backgroundColor: 'var(--bg-secondary)', border: 'none' }}
                    >
                      <option value="English (UK)">UK English (-programme, -ise)</option>
                      <option value="English (US)">US English (-program, -ize)</option>
                      <option value="French">French (Français)</option>
                      <option value="German">German (Deutsch)</option>
                      <option value="Spanish">Spanish (Español)</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* 4. DYNAMIC MANUAL NOTES & PROPOSAL CONTEXT */}
            {type === 'Proposal' && (
              <Card style={settingsCardStyle}>
                <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Sparkles size={18} color="var(--accent-primary)" />
                  4. Dynamic Manual Notes & Proposal Context
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Provide specific background details below to enrich Pathew Assistant's context and ensure maximum alignment.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Custom Question Notes</label>
                    <textarea 
                      placeholder="Specific prompts, requirements, or funder questions you need answered..."
                      value={builder.manualNotes.customQuestionNotes}
                      onChange={(e) => builder.setManualNotes({ ...builder.manualNotes, customQuestionNotes: e.target.value })}
                      style={{ ...textareaStyle, height: '80px', minHeight: '80px' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Leadership Achievements</label>
                    <textarea 
                      placeholder="Describe specific team leadership, public engagements, or core awards..."
                      value={builder.manualNotes.leadershipAchievements}
                      onChange={(e) => builder.setManualNotes({ ...builder.manualNotes, leadershipAchievements: e.target.value })}
                      style={{ ...textareaStyle, height: '80px', minHeight: '80px' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Project Notes & Objectives</label>
                    <textarea 
                      placeholder="Outline your project scope, targets, community impact, or research methodology..."
                      value={builder.manualNotes.projectNotes}
                      onChange={(e) => builder.setManualNotes({ ...builder.manualNotes, projectNotes: e.target.value })}
                      style={{ ...textareaStyle, height: '80px', minHeight: '80px' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Additional Context</label>
                    <textarea 
                      placeholder="Any other personal credentials, unique skills, or details..."
                      value={builder.manualNotes.additionalContext}
                      onChange={(e) => builder.setManualNotes({ ...builder.manualNotes, additionalContext: e.target.value })}
                      style={{ ...textareaStyle, height: '80px', minHeight: '80px' }}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Action triggering */}
            <div style={sourcesFooterStyle}>
              {builder.error && (
                <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{builder.error}</p>
              )}
              <Button 
                onClick={builder.startExtraction} 
                disabled={isFormInvalid()}
                style={{ 
                  gap: '8px',
                  boxShadow: '0 4px 15px var(--accent-glow)',
                  width: isMobile ? '100%' : 'auto',
                  padding: isMobile ? '14px 20px' : '12px 24px',
                  fontSize: isMobile ? '0.9rem' : '0.875rem',
                  justifyContent: 'center'
                }}
              >
                Analyse Suitability & Gaps
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
                Pathew Assistant is parsing your documents, matching keywords against opportunity requirements, and preparing progressive profile questions...
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
            {builder.error && (
              <Card style={{ marginBottom: '16px', borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                <div style={{ display: 'flex', gap: '8px', color: '#ef4444', alignItems: 'center' }}>
                  <AlertCircle size={20} />
                  <span style={{ fontWeight: 600 }}>Error:</span>
                  <span>{builder.error}</span>
                </div>
              </Card>
            )}
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
                <p>Pathew Assistant is generating your tailored draft...</p>
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
                documentType={builder.documentType}
                estimatedPages={builder.estimatedPages}
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
  padding: '60px 20px',
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
