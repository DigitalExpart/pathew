import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Target,
  Zap,
  Layout,
  Trophy,
  ArrowLeft,
  Loader2,
  Sparkles,
  Briefcase,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAssistant } from '../../context/AssistantContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

export const PreparationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAssistant } = useAssistant();
  const { t } = useTranslation();
  
  const planType = searchParams.get('type') || '90-day';
  const oppId = searchParams.get('oppId');
  const planPages = parseInt(searchParams.get('pages') || '1', 10) || 1;
  const [plan, setPlan] = useState<any>(null);
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [allOpportunities, setAllOpportunities] = useState<any[]>([]);
  const [allRoadmaps, setAllRoadmaps] = useState<any[]>([]);
  const [viewingSpecific, setViewingSpecific] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const init = async () => {
      if (oppId) {
        setViewingSpecific(true);
        if (oppId !== 'general') {
          const { data } = await supabase.from('opportunities').select('*').eq('id', oppId).single();
          if (data) setOpportunity(data);
        }
        await fetchPlan();
      } else {
        setViewingSpecific(false);
        await fetchAllProjects();
      }
    };
    init();
  }, [user, planType, oppId]);

  const fetchAllProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'Roadmap');

      const parsedRoadmaps = (docs || []).map(doc => {
        try {
          return { dbId: doc.id, title: doc.title, ...JSON.parse(doc.content) };
        } catch (e) {
          return null;
        }
      }).filter(r => r !== null);
      
      setAllRoadmaps(parsedRoadmaps);

      const roadmapOppIds = parsedRoadmaps
        .map(r => r.opportunity_id)
        .filter((id): id is string => id !== null && id !== undefined && id !== 'general');

      const { data: userOpps } = await supabase
        .from('opportunities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let roadmapOpps: any[] = [];
      if (roadmapOppIds.length > 0) {
        const { data } = await supabase
          .from('opportunities')
          .select('*')
          .in('id', roadmapOppIds);
        roadmapOpps = data || [];
      }

      const allOpps = [...(userOpps || [])];
      for (const opp of roadmapOpps) {
        if (!allOpps.find(o => o.id === opp.id)) {
          allOpps.push(opp);
        }
      }
      
      setAllOpportunities(allOpps);
      
    } catch (error) {
      console.error('Error fetching project selection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (e: React.MouseEvent, dbId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this preparation plan?')) return;
    
    try {
      const { error } = await supabase.from('documents').delete().eq('id', dbId);
      if (error) throw error;
      await fetchAllProjects();
    } catch (error: any) {
      alert(`Delete error: ${error.message}`);
    }
  };

  const handleInsertPlan = async (text: string) => {
    if (!user) return;
    setLoading(true);
    
    const cleanText = text.replace(/\[Assistant GENERATED SUCCESS\]/g, '').trim();
    const weeks = parsePlanToJSON(cleanText);
    
    if (weeks.length === 0) {
      console.warn('No weeks found in assistant text:', cleanText);
      alert('The AI response did not contain a valid weekly roadmap format (e.g. Week 1: ...). Please ask the assistant to format it as a weekly plan.');
      setLoading(false);
      return;
    }

    try {
      const now = new Date().toISOString();
      const planPayload = {
        weeks,
        startDate: now,
        completedWeeks: [],
        opportunity_id: oppId === 'general' ? null : (oppId || null),
        planType,
        planPages
      };

      const { data: existingDocs } = await supabase
        .from('documents')
        .select('id, content')
        .eq('user_id', user.id)
        .eq('type', 'Roadmap');

      const existingDoc = existingDocs?.find(doc => {
        try {
          const content = JSON.parse(doc.content);
          const targetId = oppId === 'general' ? null : (oppId || null);
          return content.opportunity_id === targetId;
        } catch (e) {
          return false;
        }
      });

      const docPayload = {
        user_id: user.id,
        type: 'Roadmap',
        title: `Roadmap: ${planType}${opportunity ? ` for ${opportunity.title}` : ''}`,
        content: JSON.stringify(planPayload)
      };

      let error;
      if (existingDoc) {
        const { error: updateError } = await supabase
          .from('documents')
          .update(docPayload)
          .eq('id', existingDoc.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('documents')
          .insert(docPayload);
        error = insertError;
      }

      if (error) throw error;
      
      setPlan(planPayload);
      setCompletedWeeks([]);
      
      if (!oppId) fetchAllProjects();
    } catch (error: any) {
      console.error('Error inserting plan:', error);
      alert(`Storage error: ${error.message || 'Unknown error'}`);
      setPlan({ weeks, startDate: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlan = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: docs, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'Roadmap');

      if (error) throw error;

      const matchingDoc = docs?.find(doc => {
        try {
          const content = JSON.parse(doc.content);
          const targetId = oppId === 'general' ? null : (oppId || null);
          return content.opportunity_id === targetId;
        } catch (e) {
          return false;
        }
      });

      if (matchingDoc) {
        const parsedPlan = JSON.parse(matchingDoc.content);
        
        // Migrate legacy formats (array of strings -> array of objects)
        const migratePlanToTrackerFormat = (rawPlan: any) => {
          if (!rawPlan || !rawPlan.weeks) return rawPlan;
          const migratedWeeks = rawPlan.weeks.map((week: any) => {
            const isLegacy = week.tasks && week.tasks.length > 0 && typeof week.tasks[0] === 'string';
            const isWeekCompleted = rawPlan.completedWeeks?.includes(week.number);
            
            const newTasks = isLegacy ? week.tasks.map((taskStr: string) => ({
              id: Math.random().toString(36).substr(2, 9),
              text: taskStr,
              status: isWeekCompleted ? 'Completed' : 'Not Started',
              notes: ''
            })) : week.tasks;
            
            return { ...week, tasks: newTasks || [] };
          });
          return { ...rawPlan, weeks: migratedWeeks };
        };

        const migratedPlan = migratePlanToTrackerFormat(parsedPlan);
        setPlan(migratedPlan);
        setCompletedWeeks(migratedPlan.completedWeeks || []);
        
        if (!migratedPlan.weeks || migratedPlan.weeks.length === 0) {
          openAssistant('Pathew Assistant', [
            `Generate a ${planType} plan${planPages === 3 ? ' with detailed 3-page level content' : ' with a concise 1-page overview'}`,
            'How does this work?',
            'Generate a detailed version of this plan as a downloadable Word document'
          ], (text) => handleInsertPlan(text), { 
            type: 'Roadmap', 
            duration: planType, 
            pages: planPages,
            opportunity: opportunity?.title,
            opportunityId: oppId !== 'general' ? oppId : undefined,
            deadline: opportunity?.deadline,
            requestId: Date.now() 
          });
        }
      } else {
        openAssistant('Pathew Assistant', [
          `Generate a ${planType} plan${planPages === 3 ? ' with detailed 3-page level content' : ' with a concise 1-page overview'}`,
          'How does this work?',
          'Generate a detailed version of this plan as a downloadable Word document'
        ], (text) => handleInsertPlan(text), { 
          type: 'Roadmap', 
          duration: planType, 
          pages: planPages,
          opportunity: opportunity?.title,
          opportunityId: oppId !== 'general' ? oppId : undefined,
          deadline: opportunity?.deadline,
          requestId: Date.now()
        });
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    openAssistant('Pathew Assistant', [
      `Regenerate my ${planType} plan${planPages === 3 ? ' with detailed 3-page level content' : ' with a concise 1-page overview'}`,
      `Adjust my ${planType} plan to be more aggressive`,
      'How does this work?',
      'Generate a detailed version of this plan as a downloadable Word document'
    ], (text) => handleInsertPlan(text), { 
      type: 'Roadmap', 
      duration: planType, 
      pages: planPages,
      opportunity: opportunity?.title,
      opportunityId: oppId !== 'general' ? oppId : undefined,
      deadline: opportunity?.deadline,
      requestId: Date.now()
    });
  };

  const parsePlanToJSON = (text: string) => {
    const weekRegex = /Week\s*(\d+)/gi;
    const weeks: any[] = [];
    const parts = text.split(/Week\s*\d+[:\s-]*/i);
    const matches = text.match(weekRegex);
    
    if (!matches || parts.length <= 1) {
      console.warn('Regex split failed to find weeks');
      return [];
    }

    for (let i = 0; i < matches.length; i++) {
      const weekMatch = matches[i].match(/Week\s*(\d+)/i);
      if (!weekMatch) continue;
      
      const weekNum = parseInt(weekMatch[1]);
      const content = parts[i + 1] || '';
      const subParts = content.split(/\n|(?=\s*[\-*•])|(?=\s*\d+\.\s+)/);
      
      let title = t('preparation.focusArea');
      const tasks: any[] = [];
      
      subParts.forEach((part, idx) => {
        const trimmed = part.trim().replace(/^[:\-*•\d.\s]+/, '').trim();
        if (!trimmed || trimmed.length < 3) return;
        
        if (idx === 0 && !part.startsWith('-') && !part.startsWith('*') && !part.includes('•')) {
          title = trimmed.split('\n')[0].substring(0, 50);
        } else {
          if (trimmed.includes(' - ')) {
            const multiTasks = trimmed.split(' - ');
            multiTasks.forEach(t => {
              const cleaned = t.trim();
              if (cleaned.length > 3) {
                tasks.push({
                  id: Math.random().toString(36).substr(2, 9),
                  text: cleaned,
                  status: 'Not Started',
                  notes: ''
                });
              }
            });
          } else {
            tasks.push({
              id: Math.random().toString(36).substr(2, 9),
              text: trimmed,
              status: 'Not Started',
              notes: ''
            });
          }
        }
      });

      if (tasks.length > 0) {
        weeks.push({
          number: weekNum,
          title: title,
          tasks: tasks.slice(0, 10)
        });
      }
    }
    
    return weeks.sort((a, b) => a.number - b.number);
  };

  const savePlanToDB = async (updatedPlan: any) => {
    if (!user) return;
    try {
      const { data: docs } = await supabase
        .from('documents')
        .select('id, content')
        .eq('user_id', user.id)
        .eq('type', 'Roadmap');

      const matchingDoc = docs?.find(doc => {
        try {
          const content = JSON.parse(doc.content);
          return content.opportunity_id === (oppId || null);
        } catch (e) {
          return false;
        }
      });

      if (matchingDoc) {
        await supabase
          .from('documents')
          .update({ content: JSON.stringify(updatedPlan) })
          .eq('id', matchingDoc.id);
      }
    } catch (error) {
      console.error('Error auto-saving plan:', error);
    }
  };

  const updateTask = (weekIndex: number, taskIndex: number, field: string, value: string) => {
    if (!plan) return;
    const updatedPlan = { ...plan };
    updatedPlan.weeks[weekIndex].tasks[taskIndex][field] = value;
    setPlan(updatedPlan);
  };

  const commitTaskUpdate = (updatedPlan: any) => {
    savePlanToDB(updatedPlan);
  };

  const addTask = (weekIndex: number) => {
    if (!plan) return;
    const updatedPlan = { ...plan };
    updatedPlan.weeks[weekIndex].tasks.push({
      id: Math.random().toString(36).substr(2, 9),
      text: 'New Task',
      status: 'Not Started',
      notes: ''
    });
    setPlan(updatedPlan);
    commitTaskUpdate(updatedPlan);
  };

  const deleteTask = (weekIndex: number, taskIndex: number) => {
    if (!plan) return;
    const updatedPlan = { ...plan };
    updatedPlan.weeks[weekIndex].tasks.splice(taskIndex, 1);
    setPlan(updatedPlan);
    commitTaskUpdate(updatedPlan);
  };

  const handleStatusChange = (weekIndex: number, taskIndex: number, newStatus: string) => {
    if (!plan) return;
    const updatedPlan = { ...plan };
    updatedPlan.weeks[weekIndex].tasks[taskIndex].status = newStatus;
    setPlan(updatedPlan);
    commitTaskUpdate(updatedPlan);
  };

  const calculateProgress = () => {
    if (!plan || !plan.weeks) return 0;
    let totalTasks = 0;
    let completedTasks = 0;
    plan.weeks.forEach((week: any) => {
      week.tasks?.forEach((task: any) => {
        totalTasks++;
        if (task.status === 'Completed') completedTasks++;
      });
    });
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };
  const progress = calculateProgress();

  // Responsive Styles
  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '16px' : '0',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: isMobile ? '24px' : '40px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '1.75rem' : '2.5rem',
    fontWeight: 800,
    marginBottom: '8px',
    lineHeight: 1.2
  };

  const subtitleStyle: React.CSSProperties = {
    color: 'var(--text-secondary)',
    fontSize: isMobile ? '0.9375rem' : '1.125rem',
  };

  const projectGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(450px, 1fr))',
    gap: '24px',
  };

  const projectCardStyle: React.CSSProperties = {
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    padding: isMobile ? '16px' : '24px',
    position: 'relative',
    overflow: 'hidden',
  };

  const projectCardContentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '12px' : '20px',
  };

  const projectIconWrapperStyle: React.CSSProperties = {
    width: '56px',
    height: '56px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  const projectTitleStyle: React.CSSProperties = {
    fontSize: isMobile ? '1.125rem' : '1.25rem',
    fontWeight: 700,
    marginBottom: '4px',
  };

  const projectCompanyStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '12px',
  };

  const projectMetaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const weekCountStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  };

  const deleteButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  };

  const miniProgressBarStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '4px',
    backgroundColor: 'var(--bg-tertiary)',
  };

  const miniProgressBarFillStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: 'var(--accent-primary)',
  };

  const progressBarContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '8px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '4px',
    marginTop: '24px',
    overflow: 'hidden',
  };

  const progressBarFillStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: 'var(--accent-primary)',
    transition: 'width 0.5s ease-out',
    boxShadow: '0 0 10px var(--accent-glow)',
  };

  const mainGridStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '32px',
    alignItems: 'flex-start',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    marginBottom: '24px',
    gap: isMobile ? '12px' : '0'
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 700,
  };

  const weeksListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%'
  };

  const calendarHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  };

  const calNavButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '4px',
  };

  const calendarGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
    textAlign: 'center',
  };

  const calDayHeaderStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    paddingBottom: '8px',
  };

  const calDayStyle: React.CSSProperties = {
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  };

  const statsListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const statItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
  };

  if (!viewingSpecific) {
    const activeProjects = allOpportunities.filter(opp => 
      allRoadmaps.some(r => r.opportunity_id === opp.id)
    );
    const generalRoadmap = allRoadmaps.find(r => r.opportunity_id === null);
    
    const orphanedRoadmaps = allRoadmaps.filter(r => 
      r.opportunity_id !== null && 
      r.opportunity_id !== undefined &&
      !allOpportunities.some(opp => opp.id === r.opportunity_id)
    );

    return (
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>{t('preparation.title')}</h1>
          <p style={subtitleStyle}>{t('preparation.subtitle')}</p>
        </header>

        <div style={projectGridStyle}>
          {activeProjects.map(opp => {
            const roadmap = allRoadmaps.find(r => r.opportunity_id === opp.id);
            const roadmapProgress = roadmap ? Math.round(((roadmap.completedWeeks?.length || 0) / (roadmap.weeks?.length || 1)) * 100) : 0;
            
            return (
              <Card 
                key={opp.id} 
                onClick={() => navigate(`/preparation?oppId=${opp.id}&type=${roadmap?.planType || '90-day'}`)}
                style={projectCardStyle}
              >
                <div style={projectCardContentStyle}>
                  <div style={projectIconWrapperStyle}>
                    <Briefcase size={24} color="var(--accent-primary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={projectTitleStyle} className="truncate">{opp.title}</h3>
                    <p style={projectCompanyStyle} className="truncate">{opp.organization_name || opp.funder_name || opp.company || ''}</p>
                    <div style={projectMetaStyle}>
                      <Badge variant="success">{roadmapProgress}% {t('preparation.complete')}</Badge>
                      <span style={weekCountStyle}>{roadmap?.weeks?.length} {t('preparation.weeks')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <ChevronRight size={20} color="var(--text-muted)" />
                    <button 
                      onClick={(e) => handleDeletePlan(e, roadmap!.dbId)}
                      style={deleteButtonStyle}
                      title={t('preparation.deleteRoadmap')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div style={miniProgressBarStyle}>
                  <div style={{ ...miniProgressBarFillStyle, width: `${roadmapProgress}%` }} />
                </div>
              </Card>
            );
          })}

          {orphanedRoadmaps.map(roadmap => {
            const roadmapProgress = Math.round(((roadmap.completedWeeks?.length || 0) / (roadmap.weeks?.length || 1)) * 100);
            const displayTitle = roadmap.title?.replace('Roadmap: ', '').replace(/^\d+-day\s*/i, '').trim() || t('preparation.title');
            
            return (
              <Card 
                key={roadmap.dbId} 
                onClick={() => navigate(`/preparation?oppId=${roadmap.opportunity_id}&type=${roadmap.planType || '90-day'}`)}
                style={projectCardStyle}
              >
                <div style={projectCardContentStyle}>
                  <div style={projectIconWrapperStyle}>
                    <Briefcase size={24} color="var(--accent-primary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={projectTitleStyle} className="truncate">{displayTitle}</h3>
                    <p style={projectCompanyStyle} className="truncate">{roadmap.planType?.toUpperCase() || '90-Day'} {t('preparation.title')}</p>
                    <div style={projectMetaStyle}>
                      <Badge variant="success">{roadmapProgress}% {t('preparation.complete')}</Badge>
                      <span style={weekCountStyle}>{roadmap.weeks?.length} {t('preparation.weeks')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <ChevronRight size={20} color="var(--text-muted)" />
                    <button 
                      onClick={(e) => handleDeletePlan(e, roadmap.dbId)}
                      style={deleteButtonStyle}
                      title={t('preparation.deleteRoadmap')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div style={miniProgressBarStyle}>
                  <div style={{ ...miniProgressBarFillStyle, width: `${roadmapProgress}%` }} />
                </div>
              </Card>
            );
          })}
          
          {generalRoadmap && (
            <Card 
              onClick={() => navigate('/preparation?oppId=general')}
              style={projectCardStyle}
            >
              <div style={projectCardContentStyle}>
                <div style={projectIconWrapperStyle}>
                  <Target size={24} color="var(--accent-primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={projectTitleStyle} className="truncate">{t('preparation.generalGrowth')}</h3>
                  <p style={projectCompanyStyle} className="truncate">{t('preparation.overallReadiness')}</p>
                  <div style={projectMetaStyle}>
                    <Badge variant="outline">{t('preparation.personalRoadmap')}</Badge>
                    <span style={weekCountStyle}>{generalRoadmap.weeks?.length} {t('preparation.weeks')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <ChevronRight size={20} color="var(--text-muted)" />
                  <button 
                    onClick={(e) => handleDeletePlan(e, generalRoadmap.dbId)}
                    style={deleteButtonStyle}
                    title={t('preparation.deleteRoadmap')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {!loading && activeProjects.length === 0 && orphanedRoadmaps.length === 0 && !generalRoadmap && (
          <div style={{ textAlign: 'center', padding: isMobile ? '40px 16px' : '60px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)' }}>
            <Zap size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h3>{t('preparation.noRoadmaps')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.875rem' }}>{t('preparation.noRoadmapsSubtitle')}</p>
            <Button onClick={() => navigate('/opportunities')} style={{ width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>{t('preparation.browseOpportunities')}</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/preparation')} style={{ marginBottom: '16px', padding: 0 }}>
          <ArrowLeft size={16} /> {t('preparation.backToProjects')}
        </Button>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', gap: isMobile ? '16px' : '0' }}>
          <div>
            <h1 style={titleStyle}>
              {opportunity ? t('preparation.roadmapTitle', { title: opportunity.title }) : t('preparation.generalGrowthRoadmap')}
            </h1>
            <p style={subtitleStyle}>
              {opportunity 
                ? t('preparation.tailoredFor', { company: opportunity.organization_name || opportunity.funder_name || opportunity.company || 'this opportunity' })
                : t('preparation.trackWeekly')}
            </p>
          </div>
          <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
             <Badge variant="primary" style={{ marginBottom: '8px' }}>{t('preparation.roadmapBadge', { type: planType.toUpperCase() })}</Badge>
             {planPages > 1 && (
               <Badge variant="info" style={{ marginBottom: '8px', marginLeft: '8px' }}>{t('planSelection.pagesBadge', { count: planPages })}</Badge>
             )}
             <h3 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 800 }}>{progress}% {t('preparation.complete')}</h3>
          </div>
        </div>
        
        <div style={progressBarContainerStyle}>
          <div style={{ ...progressBarFillStyle, width: `${progress}%` }} />
        </div>
      </header>

      <div style={mainGridStyle}>
        <section style={{ flex: 2, width: '100%' }}>
          <div style={sectionHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Layout size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              <h2 style={sectionTitleStyle}>{t('preparation.weeklyRoadmap')}</h2>
            </div>
            <Button variant="outline" size="sm" onClick={generateNewPlan} disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} 
              {t('preparation.regeneratePlan')}
            </Button>
          </div>

          <div style={weeksListStyle}>
            {loading && !plan ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 24px' }}>
                  <Loader2 size={60} color="var(--accent-primary)" className="animate-spin" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.2 }} />
                  <Sparkles size={30} color="var(--accent-primary)" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>{t('preparation.assistantWorking')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {t('preparation.tailoringRoadmap')}
                </p>
              </div>
            ) : plan?.weeks?.map((week: any, weekIndex: number) => (
              <div key={week.number} style={{ marginBottom: '32px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Week {week.number}: {week.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                      {(() => {
                        const startDateStr = plan.startDate || plan.created_at || new Date().toISOString();
                        const start = new Date(startDateStr);
                        start.setDate(start.getDate() + (week.number - 1) * 7);
                        const end = new Date(start);
                        end.setDate(end.getDate() + 6);
                        return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                      })()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => addTask(weekIndex)}>
                    <Plus size={16} style={{ marginRight: '4px' }} /> Add Task
                  </Button>
                </div>
                
                <div style={{ overflowX: 'auto', padding: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        <th style={{ padding: '0 12px 12px', width: '40%', fontWeight: 600 }}>Task</th>
                        <th style={{ padding: '0 12px 12px', width: '20%', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '0 12px 12px', width: '35%', fontWeight: 600 }}>Notes</th>
                        <th style={{ padding: '0 12px 12px', width: '5%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {week.tasks.map((task: any, taskIndex: number) => (
                        <tr key={task.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px' }}>
                            <input 
                              type="text" 
                              value={task.text || ''} 
                              onChange={(e) => updateTask(weekIndex, taskIndex, 'text', e.target.value)}
                              onBlur={() => commitTaskUpdate(plan)}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                            />
                          </td>
                          <td style={{ padding: '12px' }}>
                            <select 
                              value={task.status || 'Not Started'} 
                              onChange={(e) => handleStatusChange(weekIndex, taskIndex, e.target.value)}
                              style={{ 
                                width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', 
                                background: task.status === 'Completed' ? 'rgba(34, 197, 94, 0.1)' : 
                                            task.status === 'Ongoing' ? 'rgba(59, 130, 246, 0.1)' : 
                                            task.status === 'Pending' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-primary)', 
                                color: task.status === 'Completed' ? '#4ade80' : 
                                       task.status === 'Ongoing' ? '#60a5fa' : 
                                       task.status === 'Pending' ? '#fbbf24' : 'var(--text-primary)', 
                                fontSize: '0.9375rem', fontWeight: 600
                              }}
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="Pending">Pending</option>
                              <option value="Ongoing">Ongoing</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <input 
                              type="text"
                              value={task.notes || ''} 
                              onChange={(e) => updateTask(weekIndex, taskIndex, 'notes', e.target.value)}
                              onBlur={() => commitTaskUpdate(plan)}
                              placeholder="Add notes..."
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                            />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button 
                              onClick={() => deleteTask(weekIndex, taskIndex)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '4px' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!week.tasks || week.tasks.length === 0) && (
                        <tr>
                          <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No tasks for this week. Click 'Add Task' to create one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )) || (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <Target size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p>{t('preparation.noRoadmaps')}</p>
                <Button style={{ marginTop: '16px' }} onClick={generateNewPlan}>{t('preparation.generateRoadmap')}</Button>
              </div>
            )}
          </div>
        </section>

        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          <Card title={t('preparation.planCalendar')} icon={CalendarIcon} style={{ padding: isMobile ? '16px' : '24px' }}>
            <div style={calendarHeaderStyle}>
              <button style={calNavButtonStyle} onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: 600 }}>
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button style={calNavButtonStyle} onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div style={calendarGridStyle}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`${d}-${i}`} style={calDayHeaderStyle}>{d}</div>)}
              {Array.from({ length: 35 }).map((_, i) => {
                const day = i - (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()) + 1;
                const isToday = day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth();
                const isValid = day > 0 && day <= (new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate());
                
                let isWeekStart = false;
                if (plan) {
                  const startDateStr = plan.startDate || plan.created_at || new Date().toISOString();
                  const start = new Date(startDateStr);
                  for (let w = 0; w < (plan.weeks?.length || 0); w++) {
                    const wDate = new Date(start);
                    wDate.setDate(wDate.getDate() + w * 7);
                    if (wDate.getDate() === day && wDate.getMonth() === currentMonth.getMonth() && wDate.getFullYear() === currentMonth.getFullYear()) {
                      isWeekStart = true;
                      break;
                    }
                  }
                }

                return (
                  <div 
                    key={i} 
                    style={{ 
                      ...calDayStyle, 
                      backgroundColor: isWeekStart ? 'rgba(245, 158, 11, 0.2)' : (isToday ? 'var(--accent-primary)' : 'transparent'),
                      border: isWeekStart ? '1px solid var(--accent-primary)' : 'none',
                      color: isToday ? '#000' : (isValid ? 'var(--text-primary)' : 'transparent'),
                      opacity: isValid ? 1 : 0,
                      fontWeight: isWeekStart || isToday ? 700 : 400
                    }}
                  >
                    {isValid ? day : ''}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title={t('preparation.preparationStats')} icon={Trophy} style={{ padding: isMobile ? '16px' : '24px' }}>
            <div style={statsListStyle}>
               <div style={statItemStyle}>
                  <Target size={18} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                     <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('preparation.currentStreak')}</p>
                     <p style={{ fontWeight: 700 }}>{completedWeeks.length} {t('preparation.weeks')}</p>
                  </div>
               </div>
               <div style={statItemStyle}>
                  <Clock size={18} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                     <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est. Completion</p>
                     <p style={{ fontWeight: 700 }}>{plan?.weeks ? new Date(Date.now() + (plan.weeks.length - completedWeeks.length) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'N/A'}</p>
                  </div>
               </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};
