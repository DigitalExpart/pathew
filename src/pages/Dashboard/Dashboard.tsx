import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Users, 
  FileCheck, 
  Clock, 
  ArrowRight,
  Zap,
  Target,
  Briefcase,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { calculateMatchScore } from '../../utils/matchScorer';

export const Dashboard: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  const [isEditingGoals, setIsEditingGoals] = React.useState(false);
  const [tempGoals, setTempGoals] = React.useState<string[]>([]);
  const [savingGoals, setSavingGoals] = React.useState(false);
  const predefinedGoals = ['Full-time Roles', 'Contract Work', 'Freelance Projects', 'Fellowships', 'Grants', 'Leadership Positions'];

  const handleEditGoalsClick = () => {
    setTempGoals(profile?.goals || []);
    setIsEditingGoals(true);
  };

  const handleSaveGoals = async () => {
    if (!user) return;
    setSavingGoals(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ goals: tempGoals })
        .eq('id', user.id);
      if (error) throw error;
      if (refreshProfile) await refreshProfile();
      setIsEditingGoals(false);
    } catch (error) {
      console.error('Error saving goals:', error);
    } finally {
      setSavingGoals(false);
    }
  };

  const toggleTempGoal = (goal: string) => {
    setTempGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [prepHorizon, setPrepHorizon] = React.useState('90-day');
  const [goalsExpanded, setGoalsExpanded] = React.useState(false);
  const [achievementsExpanded, setAchievementsExpanded] = React.useState(false);
  const [stats, setStats] = React.useState({
    opps: 0,
    jobs: 0,
    docs: 0,
    reviews: 0
  });
  const [recentOpps, setRecentOpps] = React.useState<any[]>([]);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [scanning, setScanning] = React.useState(false);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      // Fetch Counts
      const [oppsCount, jobsCount, docsCount] = await Promise.all([
        supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('generated_documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);

      setStats({
        opps: oppsCount.count || 0,
        jobs: jobsCount.count || 0,
        docs: docsCount.count || 0,
        reviews: 0 
      });

      // Fetch Recent Opportunities
      const { data: opps } = await supabase
        .from('opportunities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      setRecentOpps(opps || []);

      // Fetch Recent Activity
      const { data: activity } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentActivity(activity || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      // Data fetched
    }
  };
  React.useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleQuickScan = async () => {
    setScanning(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await fetchDashboardData();
    setScanning(false);
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  // Calculate Readiness Score (Simple logic based on profile completeness)
  const calculateReadiness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.story) score += 20;
    if (profile.education?.length) score += 20;
    if (profile.experience?.length) score += 20;
    if (profile.goals?.length) score += 20;
    if (profile.projects?.length) score += 20;
    return score;
  };

  const readinessScore = calculateReadiness();

  return (
    <div style={{ ...containerStyle, padding: isMobile ? '20px' : '0' }}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ ...titleStyle, fontSize: isMobile ? '1.5rem' : '2rem' }}>{t('dashboard.greeting', { name: firstName })}</h1>
          <p style={subtitleStyle}>{t('dashboard.subtitle')}</p>
        </div>
        <Button 
          onClick={handleQuickScan} 
          disabled={scanning}
          style={{ 
            gap: '10px', 
            width: isMobile ? '100%' : 'auto',
            minWidth: '140px',
            boxShadow: scanning ? 'none' : '0 4px 15px var(--accent-glow)' 
          }}
        >
          <Zap size={18} fill="currentColor" className={scanning ? 'animate-pulse' : ''} />
          {scanning ? t('dashboard.scanning') : t('dashboard.quickScan')}
        </Button>
      </header>      {/* Stats Grid */}
      <div className="grid-responsive" style={{ marginBottom: '32px' }}>
        <StatCard icon={Users} label={t('nav.opportunities')} value={stats.opps.toString()} trend="+0" onClick={() => navigate('/opportunities')} />
        <StatCard icon={Briefcase} label={t('nav.jobs')} value={stats.jobs.toString()} trend="+0" onClick={() => navigate('/jobs')} />
        <StatCard icon={FileCheck} label={t('dashboard.docsGenerated')} value={stats.docs.toString()} trend="+0" onClick={() => navigate('/documents')} />
        <StatCard icon={Clock} label={t('dashboard.pendingReviews')} value={stats.reviews.toString()} />
      </div>

      <div className="flex-responsive" style={{ gap: '32px' }}>
        {/* Main Content Area */}
        <section style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '32px', minWidth: 0 }}>
          
          {/* Preparation Plan */}
          <div>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>{(profile?.role === 'admin' || profile?.role === 'sub_admin') ? t('dashboard.prepPlan') : t('dashboard.profileOverview', 'Profile Overview')}</h2>
              {(profile?.role === 'admin' || profile?.role === 'sub_admin') && (
                <div className="desktop-only" style={horizonSelectorStyle}>
                  {['Quick', '90-day', '180-day', '365-day'].map(horizon => (
                     <button 
                      key={horizon} 
                      style={{
                        ...horizonButtonStyle,
                        ...(prepHorizon === horizon ? horizonButtonActiveStyle : {})
                      }}
                      onClick={() => {
                        setPrepHorizon(horizon);
                        navigate(`/preparation?type=${horizon.toLowerCase()}`);
                      }}
                    >
                      {t(`dashboard.horizons.${horizon.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="stack-on-mobile" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <Card style={{ flex: 1, backgroundColor: 'var(--bg-tertiary)' }}>
                <p style={statLabelStyle}>{t('dashboard.readinessScore')}</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <h3 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{readinessScore}%</h3>
                  <span style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>/ 100</span>
                </div>
              </Card>
              <Card style={{ flex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={statLabelStyle}>{t('dashboard.topGoals')}</p>
                  {!isEditingGoals ? (
                    <button onClick={handleEditGoalsClick} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                      <Edit2 size={14} />
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setIsEditingGoals(false)} disabled={savingGoals} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                        <X size={16} />
                      </button>
                      <button onClick={handleSaveGoals} disabled={savingGoals} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '4px' }}>
                        <Check size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {isEditingGoals ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {predefinedGoals.map(goal => {
                      const isSelected = tempGoals.includes(goal);
                      return (
                        <div key={goal} onClick={() => !savingGoals && toggleTempGoal(goal)}>
                          <Badge 
                            variant={isSelected ? "primary" : "outline"} 
                            style={{ cursor: 'pointer', opacity: savingGoals ? 0.5 : 1 }}
                          >
                            {t(`setup.goalsList.${goal}`, goal) as string}
                          </Badge>
                        </div>
                      );
                    })}
                    {/* Render any custom goals that the user might have added previously */}
                    {tempGoals.filter(g => !predefinedGoals.includes(g)).map(customGoal => (
                      <div key={customGoal} onClick={() => !savingGoals && toggleTempGoal(customGoal)}>
                        <Badge 
                          variant="primary" 
                          style={{ cursor: 'pointer', opacity: savingGoals ? 0.5 : 1 }}
                        >
                          {customGoal} <X size={12} style={{ marginLeft: '4px', display: 'inline', verticalAlign: 'middle' }} />
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      {profile?.goals?.length ? (
                        <>
                          {(goalsExpanded ? (profile.goals || []) : (profile.goals || []).slice(0, 3)).map((g: any, i: number) => (
                            <Badge key={i} variant="primary">{t(`setup.goalsList.${g}`, g) as string}</Badge>
                          ))}
                        </>
                      ) : (
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('dashboard.noGoals')}</p>
                      )}
                    </div>
                    {(profile?.goals?.length || 0) > 3 && (
                      <button
                        onClick={() => setGoalsExpanded(prev => !prev)}
                        style={{
                          marginTop: '10px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          color: 'var(--accent-primary)',
                          fontWeight: 600,
                          padding: '2px 0',
                          letterSpacing: '0.01em',
                        }}
                      >
                        {goalsExpanded ? t('common.viewLess', 'View less') : t('common.viewMore', `+${(profile?.goals?.length || 0) - 3} more`)}
                      </button>
                    )}
                  </>
                )}
              </Card>
              <Card style={{ flex: 2 }}>
                <p style={statLabelStyle}>{t('dashboard.achievements')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {profile?.achievements?.length ? (
                    <>
                      {(achievementsExpanded ? (profile.achievements || []) : (profile.achievements || []).slice(0, 3)).map((a: any, i: number) => (
                        <Badge key={i} variant="secondary">{a}</Badge>
                      ))}
                    </>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('dashboard.noAchievements')}</p>
                  )}
                </div>
                {(profile?.achievements?.length || 0) > 3 && (
                  <button
                    onClick={() => setAchievementsExpanded(prev => !prev)}
                    style={{
                      marginTop: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                      padding: '2px 0',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {achievementsExpanded ? t('common.viewLess', 'View less') : t('common.viewMore', `+${(profile?.achievements?.length || 0) - 3} more`)}
                  </button>
                )}
              </Card>
            </div>

            {(profile?.role === 'admin' || profile?.role === 'sub_admin') && (
              <Card title={t('dashboard.nextSteps')} icon={Target}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profile?.projects?.slice(0, 3).map((proj: any) => (
                    <div key={proj.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--accent-primary)', flexShrink: 0 }} />
                        <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{t('dashboard.refine', { title: proj.title })}</span>
                      </div>
                      <Badge variant="outline">{t('dashboard.nextUp')}</Badge>
                    </div>
                  ))}
                  {!profile?.projects?.length && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                      {t('dashboard.completeProfileToSeeSteps')}
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Recent Matches */}
          <div>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>{t('dashboard.exploreOpportunities')}</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')}>{t('dashboard.viewAll')} <ArrowRight size={14} /></Button>
            </div>
          <div style={matchesListStyle}>
            {recentOpps.map(opp => (
              <Card key={opp.id} style={{ marginBottom: '16px' }}>
                <div className="stack-on-mobile" style={oppCardContentStyle}>
                  <div style={oppInfoStyle}>
                    <h3 style={oppTitleStyle}>{opp.title}</h3>
                    <p style={oppCompanyStyle}>{opp.company} • {opp.location}</p>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Badge variant="primary">{opp.type}</Badge>
                      <Badge variant="info">{opp.source}</Badge>
                    </div>
                  </div>
                  <div className="desktop-only" style={oppMatchStyle}>
                    <div style={matchCircleStyle}>
                      <span style={matchValueStyle}>{calculateMatchScore(profile, opp)}%</span>
                    </div>
                    <span style={matchLabelStyle}>{t('dashboard.match')}</span>
                  </div>
                </div>
              </Card>
            ))}
            {!recentOpps.length && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                {t('dashboard.noOppsFound')}
              </p>
            )}
            </div>
          </div>
        </section>

        {/* Sidebar Panel */}
        <section style={{ flex: 1, minWidth: 0 }}>
          <Card title={t('dashboard.quickActions')} style={{ marginBottom: '24px' }}>
            <div style={actionListStyle}>
              <ActionButton label={t('dashboard.buildCV')} onClick={() => navigate('/cv-builder')} />
              <ActionButton label={t('nav.coverLetter')} onClick={() => navigate('/cover-letter')} />
              <ActionButton label={t('nav.grantBuilder')} onClick={() => navigate('/grant-builder')} />
              <ActionButton label={t('nav.editProfile')} variant="secondary" onClick={() => navigate('/profile')} />
            </div>
          </Card>

          <Card title={t('dashboard.recentActivity')}>
            <div style={activityListStyle}>
              {recentActivity.map(activity => (
                <ActivityItem 
                  key={activity.id} 
                  text={activity.content} 
                  time={new Date(activity.created_at).toLocaleDateString()} 
                />
              ))}
              {!recentActivity.length && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                  {t('dashboard.noRecentActivity')}
                </p>
              )}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

// Sub-components
const StatCard = ({ icon: Icon, label, value, trend, onClick }: any) => (
  <Card 
    style={{ 
      flex: 1, 
      padding: '20px', 
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s',
    }}
    onClick={onClick}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={statIconBoxStyle}>
        <Icon size={20} color="var(--accent-primary)" />
      </div>
      {trend && <span style={trendStyle}>{trend}</span>}
    </div>
    <div style={{ marginTop: '16px' }}>
      <p style={statLabelStyle}>{label}</p>
      <h3 style={statValueStyle}>{value}</h3>
    </div>
  </Card>
);

const ActionButton = ({ label, variant = 'primary', onClick }: any) => (
  <Button variant={variant} onClick={onClick} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '8px' }}>
    {label}
  </Button>
);

const ActivityItem = ({ text, time }: any) => (
  <div style={activityItemStyle}>
    <div style={activityDotStyle}></div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '0.875rem' }}>{text}</p>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{time}</span>
    </div>
  </div>
);

// Styles
const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  flexWrap: 'wrap',
  gap: '20px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
};



const statIconBoxStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  backgroundColor: 'var(--bg-primary)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
};

const trendStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#22c55e',
  fontWeight: 600,
};



const horizonSelectorStyle: React.CSSProperties = {
  display: 'flex',
  backgroundColor: 'var(--bg-secondary)',
  padding: '4px',
  borderRadius: 'var(--radius-lg)',
};

const horizonButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  transition: 'all 0.2s',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
};

const horizonButtonActiveStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  boxShadow: 'var(--shadow-sm)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
};

const matchesListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const oppCardContentStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const oppInfoStyle: React.CSSProperties = {
  flex: 1,
};

const oppTitleStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  marginBottom: '4px',
};

const oppCompanyStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
};

const oppMatchStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingLeft: '24px',
  borderLeft: '1px solid var(--border-color)',
};

const matchCircleStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  border: '3px solid var(--accent-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '4px',
};

const matchValueStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '1rem',
};

const matchLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const actionListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const activityListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const activityItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
};

const activityDotStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: 'var(--accent-primary)',
  marginTop: '6px',
};
