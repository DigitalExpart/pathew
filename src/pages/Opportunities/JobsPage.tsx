import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Briefcase, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  const fetchJobs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false });
      
      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchJobs();
  }, [user]);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Applied Jobs</h1>
        <p style={subtitleStyle}>You have applied for {jobs.length} roles.</p>
      </header>

      <div style={gridStyle}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p>Loading your applications...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div style={emptyStateStyle}>
            <Briefcase size={48} color="var(--text-muted)" />
            <h2>No applications yet</h2>
            <p>Start applying to opportunities to track them here.</p>
            <Button style={{ marginTop: '16px' }} onClick={() => navigate('/opportunities')}>
              Browse Opportunities
            </Button>
          </div>
        ) : (
          jobs.map(job => (
            <Card key={job.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={cardHeaderStyle}>
                <div style={companyLogoStyle}>
                  {job.company?.charAt(0)}
                </div>
                <Badge variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {job.status}
                </Badge>
              </div>

              <div style={{ flex: 1, marginTop: '20px' }}>
                <h3 style={jobTitleStyle}>{job.title}</h3>
                <p style={companyNameStyle}>{job.company}</p>
                
                <div style={metaItemStyle}>
                  <Calendar size={14} color="var(--text-muted)" />
                  <span>Applied on {new Date(job.applied_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={cardFooterStyle}>
                <Button variant="outline" style={{ flex: 1 }}>View Details</Button>
                <Button 
                  style={{ flex: 1, gap: '4px' }}
                  onClick={() => navigate('/cv-builder')}
                >
                  Manage Docs
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '1.125rem',
};

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '64px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-xl)',
  color: 'var(--text-secondary)',
  gridColumn: '1 / -1',
  border: '1px dashed var(--border-color)',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
  gap: '24px',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const companyLogoStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.25rem',
  fontWeight: 800,
  color: 'var(--accent-primary)',
};

const jobTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  marginBottom: '4px',
};

const companyNameStyle: React.CSSProperties = {
  color: 'var(--accent-primary)',
  fontWeight: 600,
  fontSize: '0.875rem',
  marginBottom: '16px',
};

const metaItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
};

const cardFooterStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginTop: 'auto',
  paddingTop: '20px',
  borderTop: '1px solid var(--border-color)',
};
