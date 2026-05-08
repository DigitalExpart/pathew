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
  Zap
} from 'lucide-react';
import { mockOpportunities, mockUser } from '../../data/mockData';

export const Dashboard: React.FC = () => {
  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Good morning, {mockUser.name.split(' ')[0]}! 👋</h1>
          <p style={subtitleStyle}>Here is what's happening with your opportunities today.</p>
        </div>
        <Button style={{ gap: '10px' }}>
          <Zap size={18} fill="currentColor" />
          Quick Scan
        </Button>
      </header>

      {/* Stats Grid */}
      <div style={statsGridStyle}>
        <StatCard icon={TrendingUp} label="Match Score" value="92%" trend="+5%" />
        <StatCard icon={Users} label="Opportunities" value="128" trend="+12" />
        <StatCard icon={FileCheck} label="Docs Generated" value="14" trend="+2" />
        <StatCard icon={Clock} label="Pending Reviews" value="3" />
      </div>

      <div style={mainGridStyle}>
        {/* Recent Matches */}
        <section style={{ flex: 2 }}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Top Matches</h2>
            <Button variant="ghost" size="sm">View all <ArrowRight size={14} /></Button>
          </div>
          <div style={matchesListStyle}>
            {mockOpportunities.map(opp => (
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
                      <span style={matchValueStyle}>{opp.matchScore}%</span>
                    </div>
                    <span style={matchLabelStyle}>Match</span>
                  </div>
                </div>
              </Card>
            ))}
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
              <ActivityItem text="CV exported as PDF" time="2h ago" />
              <ActivityItem text="Applied to InnovateX" time="5h ago" />
              <ActivityItem text="Profile score updated" time="1d ago" />
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
  alignItems: 'flex-end',
  marginBottom: '32px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
};

const statsGridStyle: React.CSSProperties = {
  display: 'flex',
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
