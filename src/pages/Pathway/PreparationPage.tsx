import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
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
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAssistant } from '../../context/AssistantContext';
import { supabase } from '../../lib/supabase';

export const PreparationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAssistant } = useAssistant();
  
  const planType = searchParams.get('type') || '90-day';
  const oppId = searchParams.get('oppId');
  const [plan, setPlan] = useState<any>(null);
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [allOpportunities, setAllOpportunities] = useState<any[]>([]);
  const [allRoadmaps, setAllRoadmaps] = useState<any[]>([]);
  const [viewingSpecific, setViewingSpecific] = useState(false);

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
      // 1. Fetch all roadmap documents for this user
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

      // 2. Extract unique opportunity IDs from roadmaps
      const roadmapOppIds = parsedRoadmaps
        .map(r => r.opportunity_id)
        .filter((id): id is string => id !== null && id !== undefined && id !== 'general');

      // 3. Fetch opportunities using two separate reliable queries, then merge
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

      // Merge and deduplicate by id
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
        planType
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
        setPlan(parsedPlan);
        setCompletedWeeks(parsedPlan.completedWeeks || []);
        
        // If the plan is empty/broken (from previous bug), automatically open assistant
        if (!parsedPlan.weeks || parsedPlan.weeks.length === 0) {
          openAssistant('Pathew Assistant', [
            `Generate a ${planType} plan`,
            'How does this work?'
          ], (text) => handleInsertPlan(text), { 
            type: 'Roadmap', 
            duration: planType, 
            opportunity: opportunity?.title,
            requestId: Date.now() 
          });
        }
      } else {
        openAssistant('Pathew Assistant', [
          `Generate a ${planType} plan`,
          'How does this work?'
        ], (text) => handleInsertPlan(text), { 
          type: 'Roadmap', 
          duration: planType, 
          opportunity: opportunity?.title,
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
      `Regenerate my ${planType} plan`,
      `Adjust my ${planType} plan to be more aggressive`,
      'How does this work?'
    ], (text) => handleInsertPlan(text), { 
      type: 'Roadmap', 
      duration: planType, 
      opportunity: opportunity?.title,
      requestId: Date.now()
    });
  };

  const parsePlanToJSON = (text: string) => {
    // First, try to see if we can split the text into chunks by "Week X"
    const weekRegex = /Week\s*(\d+)/gi;
    const weeks: any[] = [];
    
    // Split text by "Week X" occurrences
    const parts = text.split(/Week\s*\d+[:\s-]*/i);
    const matches = text.match(weekRegex);
    
    if (!matches || parts.length <= 1) {
      console.warn('Regex split failed to find weeks');
      return [];
    }

    // The first part is usually the intro/header, skip it
    for (let i = 0; i < matches.length; i++) {
      const weekMatch = matches[i].match(/Week\s*(\d+)/i);
      if (!weekMatch) continue;
      
      const weekNum = parseInt(weekMatch[1]);
      const content = parts[i + 1] || '';
      
      // Split content into lines or by bullet points
      const subParts = content.split(/\n|(?=\s*[\-*•])|(?=\s*\d+\.\s+)/);
      
      let title = 'Focus Area';
      const tasks: string[] = [];
      
      subParts.forEach((part, idx) => {
        const trimmed = part.trim().replace(/^[:\-*•\d.\s]+/, '').trim();
        if (!trimmed || trimmed.length < 3) return;
        
        if (idx === 0 && !part.startsWith('-') && !part.startsWith('*') && !part.includes('•')) {
          title = trimmed.split('\n')[0].substring(0, 50);
        } else {
          // If it's a long string with internal bullets like "Task 1 - Task 2", split it
          if (trimmed.includes(' - ')) {
            const multiTasks = trimmed.split(' - ');
            multiTasks.forEach(t => {
              const cleaned = t.trim();
              if (cleaned.length > 3) tasks.push(cleaned);
            });
          } else {
            tasks.push(trimmed);
          }
        }
      });

      if (tasks.length > 0) {
        weeks.push({
          number: weekNum,
          title: title,
          tasks: tasks.slice(0, 10) // Limit to 10 tasks per week
        });
      }
    }
    
    return weeks.sort((a, b) => a.number - b.number);
  };

  const toggleWeek = async (weekNumber: number) => {
    if (!user || !plan) return;
    
    const newCompleted = completedWeeks.includes(weekNumber)
      ? completedWeeks.filter(w => w !== weekNumber)
      : [...completedWeeks, weekNumber];
    
    setCompletedWeeks(newCompleted);
    
    try {
      const updatedPlan = { ...plan, completedWeeks: newCompleted };
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
      
      setPlan(updatedPlan);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const progress = plan?.weeks && plan.weeks.length > 0 ? Math.round((completedWeeks.length / plan.weeks.length) * 100) : 0;

  if (!viewingSpecific) {
    const activeProjects = allOpportunities.filter(opp => 
      allRoadmaps.some(r => r.opportunity_id === opp.id)
    );
    const generalRoadmap = allRoadmaps.find(r => r.opportunity_id === null);
    
    // Catch roadmaps whose opportunity couldn't be fetched (RLS, deleted, etc.)
    const orphanedRoadmaps = allRoadmaps.filter(r => 
      r.opportunity_id !== null && 
      r.opportunity_id !== undefined &&
      !allOpportunities.some(opp => opp.id === r.opportunity_id)
    );

    return (
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>Preparation Projects</h1>
          <p style={subtitleStyle}>Active preparation roadmaps for your career opportunities.</p>
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
                  <div style={{ flex: 1 }}>
                    <h3 style={projectTitleStyle}>{opp.title}</h3>
                    <p style={projectCompanyStyle}>{opp.organization_name || opp.funder_name || opp.company || ''}</p>
                    <div style={projectMetaStyle}>
                      <Badge variant="success">{roadmapProgress}% Complete</Badge>
                      <span style={weekCountStyle}>{roadmap?.weeks?.length} Weeks</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <ChevronRight size={20} color="var(--text-muted)" />
                    <button 
                      onClick={(e) => handleDeletePlan(e, roadmap!.dbId)}
                      style={deleteButtonStyle}
                      title="Delete Roadmap"
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

          {/* Show roadmaps whose opportunity couldn't be fetched */}
          {orphanedRoadmaps.map(roadmap => {
            const roadmapProgress = Math.round(((roadmap.completedWeeks?.length || 0) / (roadmap.weeks?.length || 1)) * 100);
            const displayTitle = roadmap.title?.replace('Roadmap: ', '').replace(/^\d+-day\s*/i, '').trim() || 'Preparation Plan';
            
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
                  <div style={{ flex: 1 }}>
                    <h3 style={projectTitleStyle}>{displayTitle}</h3>
                    <p style={projectCompanyStyle}>{roadmap.planType?.toUpperCase() || '90-Day'} Roadmap</p>
                    <div style={projectMetaStyle}>
                      <Badge variant="success">{roadmapProgress}% Complete</Badge>
                      <span style={weekCountStyle}>{roadmap.weeks?.length} Weeks</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <ChevronRight size={20} color="var(--text-muted)" />
                    <button 
                      onClick={(e) => handleDeletePlan(e, roadmap.dbId)}
                      style={deleteButtonStyle}
                      title="Delete Roadmap"
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
                <div style={{ flex: 1 }}>
                  <h3 style={projectTitleStyle}>General Career Growth</h3>
                  <p style={projectCompanyStyle}>Overall Readiness</p>
                  <div style={projectMetaStyle}>
                    <Badge variant="outline">Personal Roadmap</Badge>
                    <span style={weekCountStyle}>{generalRoadmap.weeks?.length} Weeks</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <ChevronRight size={20} color="var(--text-muted)" />
                  <button 
                    onClick={(e) => handleDeletePlan(e, generalRoadmap.dbId)}
                    style={deleteButtonStyle}
                    title="Delete Roadmap"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {!loading && activeProjects.length === 0 && orphanedRoadmaps.length === 0 && !generalRoadmap && (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)' }}>
            <Zap size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h3>No active roadmaps</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Generate a preparation plan from any opportunity detail page to see it here.</p>
            <Button onClick={() => navigate('/opportunities')}>Browse Opportunities</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/preparation')} style={{ marginBottom: '16px', padding: 0 }}>
          <ArrowLeft size={16} /> Back to Projects
        </Button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={titleStyle}>
              {opportunity ? `Roadmap: ${opportunity.title}` : 'General Growth Roadmap'}
            </h1>
            <p style={subtitleStyle}>
              {opportunity 
                ? `Specifically tailored for ${opportunity.organization_name || opportunity.funder_name || opportunity.company || 'this opportunity'}. Track your progress weekly.` 
                : 'Track your weekly progress and stay on target for your career goals.'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
             <Badge variant="primary" style={{ marginBottom: '8px' }}>{planType.toUpperCase()} ROADMAP</Badge>
             <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{progress}% Complete</h3>
          </div>
        </div>
        
        <div style={progressBarContainerStyle}>
          <div style={{ ...progressBarFillStyle, width: `${progress}%` }} />
        </div>
      </header>

      <div style={mainGridStyle}>
        <section style={{ flex: 2 }}>
          <div style={sectionHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Layout size={20} color="var(--accent-primary)" />
              <h2 style={sectionTitleStyle}>Weekly Roadmap</h2>
            </div>
            <Button variant="outline" size="sm" onClick={generateNewPlan} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} 
              Regenerate Plan
            </Button>
          </div>

          <div style={weeksListStyle}>
            {loading && !plan ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 24px' }}>
                  <Loader2 size={60} color="var(--accent-primary)" className="animate-spin" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.2 }} />
                  <Sparkles size={30} color="var(--accent-primary)" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Pathew Assistant is working...</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Tailoring your roadmap based on the {opportunity ? `requirements for ${opportunity.title}` : 'job description'} and your current skills.
                </p>
              </div>
            ) : plan?.weeks?.map((week: any) => (
              <Card 
                key={week.number} 
                style={{ 
                  ...weekCardStyle, 
                  opacity: completedWeeks.includes(week.number) ? 0.7 : 1,
                  borderLeft: completedWeeks.includes(week.number) ? '4px solid #22c55e' : '4px solid var(--accent-primary)'
                }}
              >
                <div style={weekHeaderStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div 
                      onClick={() => toggleWeek(week.number)}
                      style={{ cursor: 'pointer' }}
                    >
                      {completedWeeks.includes(week.number) ? (
                        <CheckCircle2 size={24} color="#22c55e" />
                      ) : (
                        <Circle size={24} color="var(--text-muted)" />
                      )}
                    </div>
                    <div>
                      <h4 style={weekTitleStyle}>Week {week.number}: {week.title}</h4>
                      <p style={{ ...weekDescStyle, color: 'var(--accent-primary)', marginBottom: '4px', fontWeight: 600 }}>
                        {(() => {
                          const startDateStr = plan.startDate || plan.created_at || new Date().toISOString();
                          const start = new Date(startDateStr);
                          start.setDate(start.getDate() + (week.number - 1) * 7);
                          const end = new Date(start);
                          end.setDate(end.getDate() + 6);
                          return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                        })()}
                      </p>
                      <p style={weekDescStyle}>{week.tasks[0]}</p>
                    </div>
                  </div>
                  <Badge variant={completedWeeks.includes(week.number) ? "success" : "outline"}>
                    {completedWeeks.includes(week.number) ? "Completed" : "Pending"}
                  </Badge>
                </div>
              </Card>
            )) || (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <Target size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p>No roadmap generated yet for this project.</p>
                <Button style={{ marginTop: '16px' }} onClick={generateNewPlan}>Generate Roadmap</Button>
              </div>
            )}
          </div>
        </section>

        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="Plan Calendar" icon={CalendarIcon}>
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

          <Card title="Preparation Stats" icon={Trophy}>
            <div style={statsListStyle}>
               <div style={statItemStyle}>
                  <Target size={18} color="var(--accent-primary)" />
                  <div style={{ flex: 1 }}>
                     <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Streak</p>
                     <p style={{ fontWeight: 700 }}>{completedWeeks.length} Weeks</p>
                  </div>
               </div>
               <div style={statItemStyle}>
                  <Clock size={18} color="var(--accent-primary)" />
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

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '40px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 800,
  marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '1.125rem',
};

const projectGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
  gap: '24px',
};

const projectCardStyle: React.CSSProperties = {
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
};

const projectCardContentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
};

const projectIconWrapperStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const projectTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
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
  gap: '32px',
  alignItems: 'flex-start',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
};

const weeksListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const weekCardStyle: React.CSSProperties = {
  padding: '20px',
  transition: 'all 0.3s ease',
};

const weekHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const weekTitleStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 700,
  marginBottom: '4px',
};

const weekDescStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--text-muted)',
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
