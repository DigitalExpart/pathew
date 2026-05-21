import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MapPin, Calendar, ChevronRight, Activity, Bookmark, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { calculateMatchScore } from '../../utils/matchScorer';

export const SavedOpportunities: React.FC = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [savedOpps, setSavedOpps] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSavedOpps = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Saved');
      
      if (error) throw error;
      setSavedOpps(data || []);
    } catch (error) {
      console.error('Error fetching saved opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSavedOpps();
  }, [user]);

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ status: 'Reviewing' })
        .eq('id', id);
      
      if (error) throw error;
      setSavedOpps(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Error removing opportunity:', error);
    }
  };

  // Dynamic Responsive Styles
  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '16px' : '0',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: isMobile ? '20px' : '32px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '1.75rem' : '2.5rem',
    fontWeight: 700,
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    color: 'var(--text-secondary)',
    fontSize: isMobile ? '0.9375rem' : '1.125rem',
  };

  const emptyStateStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '32px 16px' : '64px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-xl)',
    color: 'var(--text-secondary)',
    gridColumn: '1 / -1',
    border: '1px dashed var(--border-color)',
    textAlign: 'center',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: isMobile ? '16px' : '24px',
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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

  const oppTitleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '4px',
  };

  const companyStyle: React.CSSProperties = {
    color: 'var(--accent-primary)',
    fontWeight: 600,
    fontSize: '0.875rem',
    marginBottom: '16px',
  };

  const metaGridStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '20px',
  };

  const metaItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  };

  const tagsStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '24px',
  };

  const tagStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    backgroundColor: 'var(--bg-tertiary)',
    padding: '4px 8px',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
  };

  const cardFooterStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: 'auto',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-color)',
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>{t('savedItems.title')}</h1>
        <p style={subtitleStyle}>{t('savedItems.subtitle', { count: savedOpps.length })}</p>
      </header>

      <div style={gridStyle}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p>{t('common.loading')}</p>
          </div>
        ) : savedOpps.length === 0 ? (
          <div style={emptyStateStyle}>
            <Bookmark size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, marginBottom: '8px' }}>{t('savedItems.empty')}</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('savedItems.emptySubtitle')}</p>
            <Button 
              style={{ marginTop: '8px' }}
              onClick={() => navigate('/opportunities')}
            >
              {t('savedItems.explore')}
            </Button>
          </div>
        ) : (
          savedOpps.map(opp => (
            <Card key={opp.id} style={{ display: 'flex', flexDirection: 'column', padding: isMobile ? '16px' : '24px' }}>
              <div style={cardHeaderStyle}>
                <div style={matchBadgeStyle}>
                  <span style={matchScoreStyle}>{opp.match_score || calculateMatchScore(profile, opp)}%</span>
                  <span style={matchTextStyle}>{t('savedItems.match')}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Badge variant="outline" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={12} /> {opp.status}
                  </Badge>
                  <Badge variant="primary">{opp.source}</Badge>
                </div>
              </div>

              <div style={{ flex: 1, marginTop: '20px' }}>
                <h3 style={oppTitleStyle}>{opp.title}</h3>
                <p style={companyStyle}>{opp.company}</p>
                
                <div style={metaGridStyle}>
                  <div style={metaItemStyle}>
                    <MapPin size={14} color="var(--text-muted)" />
                    <span>{opp.location}</span>
                  </div>
                  <div style={metaItemStyle}>
                    <Calendar size={14} color="var(--text-muted)" />
                    <span>{t('opportunities.due', { date: opp.deadline })}</span>
                  </div>
                </div>

                 <div style={tagsStyle}>
                  {opp.requirements?.slice(0, 3).map((req: string, i: number) => (
                    <span key={i} style={tagStyle}>{req}</span>
                  ))}
                  {(opp.requirements?.length > 3) && (
                    <span style={tagStyle}>{t('opportunities.more', { count: opp.requirements.length - 3 })}</span>
                  )}
                </div>
              </div>

               <div style={cardFooterStyle}>
                <Button 
                  variant="outline" 
                  style={{ flex: 1, gap: '4px', fontSize: isMobile ? '0.8125rem' : '0.875rem' }}
                  onClick={() => handleRemove(opp.id)}
                >
                  <Trash2 size={16} /> {t('savedItems.remove')}
                </Button>
                <Button 
                  style={{ flex: 1, gap: '4px', fontSize: isMobile ? '0.8125rem' : '0.875rem' }}
                  onClick={() => navigate(`/opportunities/${opp.id}`)}
                >
                  {t('opportunities.prepare')} <ChevronRight size={16} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
