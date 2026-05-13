import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  TrendingUp, 
  Users, 
  FileCheck, 
  Clock, 
  ArrowRight,
  Zap,
  Target,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [prepHorizon, setPrepHorizon] = React.useState('90-day');
  const [stats, setStats] = React.useState({
    opps: 0,
    jobs: 0,
    docs: 0,
    reviews: 0
  });
  const [recentOpps, setRecentOpps] = React.useState<any[]>([]);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [scanning, setScanning] = React.useState(false);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      // Fetch Counts
      const [oppsCount, jobsCount, docsCount] = await Promise.all([
        supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
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
      setLoading(false);
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
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Good morning, {firstName}! 👋</h1>
          <p style={subtitleStyle}>Here is what's happening with your opportunities today.</p>
        </div>
        <Button 
          onClick={handleQuickScan} 
          disabled={scanning}
          style={{ 
            gap: '10px', 
            minWidth: '140px',
            boxShadow: scanning ? 'none' : '0 4px 15px var(--accent-glow)' 
          }}
        >
          <Zap size={18} fill="currentColor" className={scanning ? 'animate-pulse' : ''} />
          {scanning ? 'Scanning...' : 'Quick Scan'}
        </Button>
      </header>

      {/* Stats Grid */}
      <div style={statsGridStyle}>
        <StatCard icon={Users} label="Opportunities" value={stats.opps.toString()} trend="+0" />
        <StatCard icon={Briefcase} label="Jobs" value={stats.jobs.toString()} trend="+0" />
        <StatCard icon={FileCheck} label="Docs Generated" value={stats.docs.toString()} trend="+0" />
        <StatCard icon={Clock} label="Pending Reviews" value={stats.reviews.toString()} />
      </div>

      <div style={mainGridStyle}>
        {/* Main Content Area */}
        <section style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Preparation Plan */}
          <div>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Preparation Plan</h2>
              <div style={horizonSelectorStyle}>
                {['Quick', '90-day', '180-day', '365-day'].map(horizon => (
                  <button 
                    key={horizon} 
                    style={{
                      ...horizonButtonStyle,
                      ...(prepHorizon === horizon ? horizonButtonActiveStyle : {})
                    }}
                    onClick={() => setPrepHorizon(horizon)}
                  >
                    {horizon}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <Card style={{ flex: 1, backgroundColor: 'var(--bg-tertiary)' }}>
                <p style={statLabelStyle}>Readiness Score</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{readinessScore}%</h3>
                  <span style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>/ 100</span>
                </div>
              </Card>
              <Card style={{ flex: 2 }}>
                <p style={statLabelStyle}>Top Goals</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {profile?.goals?.length ? (
                    profile.goals.map((g, i) => <Badge key={i} variant="primary">{g}</Badge>)
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No goals set yet.</p>
                  )}
                </div>
              </Card>
              <Card style={{ flex: 2 }}>
                <p style={statLabelStyle}>Achievements</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {profile?.achievements?.length ? (
                    profile.achievements.map((a, i) => <Badge key={i} variant="secondary">{a}</Badge>)
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No achievements listed.</p>
                  )}
                </div>
              </Card>
            </div>

            <Card title="Next Steps" icon={Target}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {profile?.projects?.slice(0, 3).map((proj: any) => (
                  <div key={proj.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--accent-primary)' }} />
                      <span style={{ fontWeight: 500 }}>Refine {proj.title}</span>
                    </div>
                    <Badge variant="outline">Next Up</Badge>
                  </div>
                ))}
                {!profile?.projects?.length && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                    Complete your profile to see your next steps.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Recent Matches */}
          <div>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Recent Opportunities</h2>
              <Button variant="ghost" size="sm">View all <ArrowRight size={14} /></Button>
            </div>
          <div style={matchesListStyle}>
            {recentOpps.map(opp => (
              <Card key={opp.id} style={{ marginBottom: '16px' }}>
                <div style={oppCardContentStyle}>
                  <div style={oppInfoStyle}>
                    <h3 style={oppTitleStyle}>{opp.title}</h3>
                    <p style={oppCompanyStyle}>{opp.company} • {opp.location}</p>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <Badge variant="primary">{opp.type}</Badge>
                      <Badge variant="info">{opp.source}</Badge>
                    </div>
                  </div>
                  <div style={oppMatchStyle}>
                    <div style={matchCircleStyle}>
                      <span style={matchValueStyle}>{opp.match_score}%</span>
                    </div>
                    <span style={matchLabelStyle}>Match</span>
                  </div>
                </div>
              </Card>
            ))}
            {!recentOpps.length && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                No opportunities found yet. Try a Quick Scan!
              </p>
            )}
            </div>
          </div>
        </section>

        {/* Sidebar Panel */}
        <section style={{ flex: 1 }}>
          <Card title="Quick Actions" style={{ marginBottom: '24px' }}>
            <div style={actionListStyle}>
              <ActionButton label="Generate New CV" />
              <ActionButton label="Write Cover Letter" />
              <ActionButton label="Create Proposal" />
              <ActionButton label="Update Profile" variant="secondary" />
            </div>
          </Card>

          <Card title="Recent Activity">
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
                  No recent activity to show.
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
const StatCard = ({ icon: Icon, label, value, trend }: any) => (
  <Card style={{ flex: 1, padding: '20px' }}>
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

const ActionButton = ({ label, variant = 'primary' }: any) => (
  <Button variant={variant} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '8px' }}>
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

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '24px',
  marginBottom: '32px',
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

const mainGridStyle: React.CSSProperties = {
  display: 'flex',
  gap: '32px',
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
