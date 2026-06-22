import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Briefcase, MapPin, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../context/AuthContext';
import { calculateMatchScore } from '../../utils/matchScorer';

export const JobsPage: React.FC = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  const isMobile = window.innerWidth <= 768;

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'published')
        .eq('type', 'job')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });
      
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
  }, []);

  const handlePrepareClick = async (job: any) => {
    navigate(`/opportunities/${job.id}`);
    try {
      const { data } = await supabase.from('opportunities').select('click_count').eq('id', job.id).single();
      const currentClicks = data?.click_count || 0;
      await supabase.from('opportunities').update({ click_count: currentClicks + 1 }).eq('id', job.id);
    } catch (e) {
      console.error('Failed to update click count:', e);
    }
  };

  return (
    <div style={{ ...containerStyle, padding: isMobile ? '0' : '0' }}>
      <header style={{ ...headerStyle, textAlign: isMobile ? 'center' : 'left' }}>
        <h1 style={{ ...titleStyle, fontSize: isMobile ? '1.75rem' : '2.5rem' }}>{t('jobs.title')}</h1>
        <p style={subtitleStyle}>{t('jobs.foundRoles', { count: jobs.length })}</p>
      </header>

      <div className="grid-responsive" style={{
        ...gridStyle,
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
      }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p>{t('jobs.loading')}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div style={emptyStateStyle}>
            <Briefcase size={48} color="var(--text-muted)" />
            <h2>{t('jobs.noApplications')}</h2>
            <p>{t('jobs.noApplicationsSubtitle')}</p>
            <Button style={{ marginTop: '16px' }} onClick={() => navigate('/opportunities')}>
              {t('jobs.browseOpps')}
            </Button>
          </div>
        ) : (
          jobs.map(job => (
            <Card key={job.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={cardHeaderStyle}>
                <div style={matchBadgeStyle}>
                  <span style={matchScoreStyle}>{calculateMatchScore(profile, job)}%</span>
                  <span style={matchTextStyle}>{t('savedItems.match')}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {job.featured && (
                    <Badge variant="primary" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}>
                      {t('opportunities.featured')}
                    </Badge>
                  )}
                  <Badge variant="outline">{job.work_mode || t('opportunities.remote')}</Badge>
                </div>
              </div>

              <div style={{ flex: 1, marginTop: '20px' }}>
                <h3 style={jobTitleStyle}>{job.title}</h3>
                <p style={companyNameStyle}>{job.organization_name}</p>
                {job.source_name && (
                  <a href={job.original_url || job.source_url} target="_blank" rel="noopener noreferrer" style={{ ...companyNameStyle, display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px', fontWeight: 400 }}>
                    Source: {job.source_name} <ExternalLink size={12} />
                  </a>
                )}
                
                <div style={metaItemStyle}>
                  <MapPin size={14} color="var(--text-muted)" />
                  <span>{job.location}</span>
                </div>
                {job.salary && (
                  <div style={{ ...metaItemStyle, marginTop: '8px' }}>
                    <Briefcase size={14} color="var(--text-muted)" />
                    <span>{job.salary}</span>
                  </div>
                )}
              </div>

              <div style={cardFooterStyle}>
                <Button 
                  variant="outline" 
                  style={{ flex: 1 }}
                  onClick={() => window.open(job.apply_link, '_blank')}
                >
                  {t('opportunities.apply')} <ExternalLink size={14} style={{ marginLeft: '4px' }} />
                </Button>
                <Button 
                  style={{ flex: 1, gap: '4px' }}
                  onClick={() => handlePrepareClick(job)}
                >
                  {t('opportunities.prepare')}
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

const matchBadgeStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  padding: '8px 12px',
  borderRadius: '12px',
  border: '1px solid var(--accent-glow)',
};

const matchScoreStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 800,
  color: 'var(--accent-primary)',
};

const matchTextStyle: React.CSSProperties = {
  fontSize: '0.625rem',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: 'var(--accent-secondary)',
};

const jobTitleStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 700,
  lineHeight: 1.4,
  marginBottom: '6px',
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
