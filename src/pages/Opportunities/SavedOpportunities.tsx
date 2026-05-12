import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MapPin, Calendar, ChevronRight, Activity, Bookmark } from 'lucide-react';
import { mockOpportunities } from '../../data/mockData';

export const SavedOpportunities: React.FC = () => {
  const savedOpps = mockOpportunities.filter(o => o.status === 'Saved');
  const navigate = useNavigate();

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Saved Items</h1>
        <p style={subtitleStyle}>You have {savedOpps.length} saved opportunities to review.</p>
      </header>

      <div style={gridStyle}>
        {savedOpps.length === 0 ? (
          <div style={emptyStateStyle}>
            <Bookmark size={48} color="var(--text-muted)" />
            <h2>No saved items yet</h2>
            <p>Explore opportunities and save the ones you're interested in.</p>
            <Button style={{ marginTop: '16px' }}>Explore Opportunities</Button>
          </div>
        ) : (
          savedOpps.map(opp => (
            <Card key={opp.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={cardHeaderStyle}>
                <div style={matchBadgeStyle}>
                  <span style={matchScoreStyle}>{opp.matchScore}%</span>
                  <span style={matchTextStyle}>Match</span>
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
                    <span>Due {opp.deadline}</span>
                  </div>
                </div>

                <div style={tagsStyle}>
                  {opp.requirements.slice(0, 3).map((req, i) => (
                    <span key={i} style={tagStyle}>{req}</span>
                  ))}
                  {opp.requirements.length > 3 && <span style={tagStyle}>+{opp.requirements.length - 3} more</span>}
                </div>
              </div>

              <div style={cardFooterStyle}>
                <Button variant="outline" style={{ flex: 1 }}>Remove</Button>
                <Button 
                  style={{ flex: 1, gap: '4px' }}
                  onClick={() => navigate(`/opportunities/${opp.id}`)}
                >
                  Prepare <ChevronRight size={16} />
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
