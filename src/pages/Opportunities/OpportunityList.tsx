import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, Calendar, MapPin, ChevronRight, Activity, Wifi } from 'lucide-react';
import { mockOpportunities } from '../../data/mockData';

export const OpportunityList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Explore Opportunities</h1>
        <p style={subtitleStyle}>Found {mockOpportunities.length} opportunities matching your profile.</p>
      </header>

      {/* Filters Bar */}
      <div style={filtersBarStyle}>
        <div style={searchWrapperStyle}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by role, company, or keywords..." 
            style={searchInputStyle}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={filterButtonsStyle}>
          <Button variant="outline" size="sm" style={{ gap: '8px' }}>
            <Filter size={16} /> Filters
          </Button>
          <div style={dividerStyle}></div>
          <select style={selectStyle}>
            <option>Sort by: Match Score</option>
            <option>Sort by: Newest</option>
            <option>Sort by: Deadline</option>
          </select>
        </div>
      </div>

      {/* Opportunity Cards */}
      <div style={gridStyle}>
        {mockOpportunities.map(opp => (
          <Card key={opp.id} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={cardHeaderStyle}>
              <div style={matchBadgeStyle}>
                <span style={matchScoreStyle}>{opp.matchScore}%</span>
                <span style={matchTextStyle}>Match</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {opp.status && (
                    <Badge variant="outline" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Activity size={12} /> {opp.status}
                    </Badge>
                  )}
                  <Badge variant="primary">{opp.source}</Badge>
                </div>
                {opp.rssStatus && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: opp.rssStatus === 'Live' ? '#22c55e' : (opp.rssStatus === 'Error' ? '#ef4444' : '#f59e0b') }}>
                    <Wifi size={12} /> {opp.rssStatus}
                  </div>
                )}
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
              <Button variant="outline" style={{ flex: 1 }}>Save</Button>
              <Button style={{ flex: 1, gap: '4px' }}>
                Prepare <ChevronRight size={16} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Styles
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

const filtersBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  gap: '24px',
};

const searchWrapperStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  backgroundColor: 'var(--bg-secondary)',
  padding: '12px 20px',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border-color)',
};

const searchInputStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-primary)',
  width: '100%',
  outline: 'none',
  fontSize: '1rem',
};

const filterButtonsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const dividerStyle: React.CSSProperties = {
  width: '1px',
  height: '24px',
  backgroundColor: 'var(--border-color)',
};

const selectStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
  cursor: 'pointer',
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
