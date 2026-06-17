import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, Calendar, MapPin, ChevronRight, Star, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

import { calculateMatchScore } from '../../utils/matchScorer';

export const OpportunityList: React.FC = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // Filter & Sort State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Newest');
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  
  const navigate = useNavigate();

  const isMobile = window.innerWidth <= 768;

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'published')
        .neq('type', 'job')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleSave = async (opp: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setSavingId(opp.id);
    try {
      // Check if already saved by this user
      const { data: existing } = await supabase
        .from('opportunities')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'Saved')
        .eq('title', opp.title)
        .maybeSingle();
      
      if (existing) {
        setOpportunities(prev => prev.map(o => o.id === opp.id ? { ...o, status: 'Saved' } : o));
        return;
      }

      const { error } = await supabase
        .from('opportunities')
        .insert({
          user_id: user.id,
          title: opp.title,
          description: opp.description,
          type: opp.type,
          status: 'Saved',
          organization_name: opp.organization_name,
          funder_name: opp.funder_name,
          location: opp.location,
          deadline: opp.deadline,
          requirements: opp.requirements,
          apply_link: opp.apply_link,
          amount: opp.amount,
          salary: opp.salary,
          work_mode: opp.work_mode,
          source_name: opp.source_name,
          featured: false,
        });
      
      if (error) throw error;
      
      setOpportunities(prev => prev.map(o => o.id === opp.id ? { ...o, status: 'Saved' } : o));
      
      await supabase.from('activities').insert({
        user_id: user.id,
        content: `Saved opportunity: ${opp.title}`
      });

    } catch (error: any) {
      console.error('Error saving opportunity:', error);
      alert(`Could not save: ${error.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const processedOpps = React.useMemo(() => {
    return opportunities.map(opp => ({
      ...opp,
      matchScore: calculateMatchScore(profile, opp)
    }));
  }, [opportunities, profile]);

  const filteredOpps = React.useMemo(() => {
    let result = processedOpps.filter(opp => 
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opp.organization_name || opp.funder_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (minMatchScore > 0) {
      result = result.filter(opp => opp.matchScore >= minMatchScore);
    }
    
    if (locationFilter) {
      result = result.filter(opp => (opp.location || '').toLowerCase().includes(locationFilter.toLowerCase()));
    }

    if (typeFilter !== 'All') {
      result = result.filter(opp => opp.type.toLowerCase() === typeFilter.toLowerCase());
    }

    if (sortBy === 'Newest') {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sortBy === 'Deadline') {
      const parseDeadline = (d: string | null | undefined): number | null => {
        if (!d || d.toLowerCase().includes('unspecified') || d.toLowerCase().includes('rolling') || d.toLowerCase().includes('open')) return null;
        
        const months = "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";
        
        // Pattern 1: Day Month Year (e.g. 30 June, 2026)
        const regex1 = new RegExp(`(\\d{1,2})\\s+(${months}),?\\s+(\\d{4})`, 'i');
        const match1 = d.match(regex1);
        if (match1) {
          const ts = Date.parse(`${match1[2]} ${match1[1]}, ${match1[3]}`);
          if (!isNaN(ts)) return ts;
        }

        // Pattern 2: Month Day, Year (e.g. August 5, 2026)
        const regex2 = new RegExp(`(${months})\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i');
        const match2 = d.match(regex2);
        if (match2) {
          const ts = Date.parse(`${match2[1]} ${match2[2]}, ${match2[3]}`);
          if (!isNaN(ts)) return ts;
        }

        // Fallback
        const cleaned = d.replace(/^due\s*/i, '').trim();
        const tsFallback = Date.parse(cleaned);
        if (!isNaN(tsFallback)) return tsFallback;
        
        return null;
      };
      result.sort((a, b) => {
        const aTime = parseDeadline(a.deadline);
        const bTime = parseDeadline(b.deadline);
        // Unspecified deadlines come first
        if (aTime === null && bTime === null) return 0;
        if (aTime === null) return -1;
        if (bTime === null) return 1;
        // Nearest deadline first
        return aTime - bTime;
      });
    } else if (sortBy === 'Highest Match') {
      result.sort((a, b) => b.matchScore - a.matchScore);
    }

    // Keep featured opportunities at the top
    result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    return result;
  }, [processedOpps, searchTerm, minMatchScore, locationFilter, typeFilter, sortBy]);

  return (
    <div style={{ ...containerStyle, padding: isMobile ? '0' : '0' }}>
      <header style={{ ...headerStyle, textAlign: isMobile ? 'center' : 'left' }}>
        <h1 style={{ ...titleStyle, fontSize: isMobile ? '1.75rem' : '2.5rem' }}>{t('opportunities.title')}</h1>
        <p style={subtitleStyle}>{t('opportunities.subtitle', { count: filteredOpps.length })}</p>
      </header>

      {/* Filters Bar */}
      <div className="stack-on-mobile" style={{ ...filtersBarStyle, flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={searchWrapperStyle}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder={t('opportunities.search')}
            style={searchInputStyle}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ ...filterButtonsStyle, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          <Button 
            variant={isFilterOpen ? "primary" : "outline"} 
            size="sm" 
            style={{ gap: '8px', flex: isMobile ? 1 : 'none' }}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={16} /> {t('opportunities.filters')}
          </Button>
          {!isMobile && <div style={dividerStyle}></div>}
          <select 
            style={{ ...selectStyle, flex: isMobile ? 1 : 'none' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Newest" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>{t('opportunities.sortBy.newest')}</option>
            <option value="Deadline" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>{t('opportunities.sortBy.deadline')}</option>
            <option value="Highest Match" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Highest Match</option>
          </select>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isFilterOpen && (
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Minimum Match %</label>
            <select style={{ ...searchInputStyle, backgroundColor: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} value={minMatchScore} onChange={(e) => setMinMatchScore(Number(e.target.value))}>
              <option value={0}>Any Match Score</option>
              <option value={20}>&gt; 20% Match</option>
              <option value={50}>&gt; 50% Match</option>
              <option value={80}>&gt; 80% Match</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Opportunity Type</label>
            <select style={{ ...searchInputStyle, backgroundColor: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', textTransform: 'capitalize' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option value="grant">Grant</option>
              <option value="fellowship">Fellowship</option>
              <option value="scholarship">Scholarship</option>
              <option value="bursary">Bursary</option>
              <option value="internship">Internship</option>
              <option value="accelerator">Accelerator</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Location Keyword</label>
            <input 
              type="text" 
              placeholder="e.g. Nigeria, Remote..." 
              style={{ ...searchInputStyle, backgroundColor: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Opportunity Cards */}
      <div className="grid-responsive" style={{
        ...gridStyle,
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
      }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p>{t('opportunities.loading')}</p>
          </div>
        ) : filteredOpps.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p>{t('opportunities.noResults')}</p>
          </div>
        ) : (
          filteredOpps.map(opp => (
            <Card key={opp.id} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={cardHeaderStyle}>
              <div style={matchBadgeStyle}>
                <span style={matchScoreStyle}>{opp.matchScore}%</span>
                <span style={matchTextStyle}>{t('savedItems.match')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {opp.featured && (
                    <Badge variant="primary" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}>
                      <Star size={12} fill="currentColor" /> {t('opportunities.featured')}
                    </Badge>
                  )}
                  <Badge variant="outline" style={{ textTransform: 'capitalize' }}>{opp.type}</Badge>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, marginTop: '20px' }}>
              <h3 style={oppTitleStyle}>{opp.title}</h3>
              <p style={companyStyle}>{opp.organization_name || opp.funder_name || t('opportunities.variousSources')}</p>
              {opp.source_name && (
                  <a href={opp.original_url || opp.source_url} target="_blank" rel="noopener noreferrer" style={{ ...companyStyle, display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px', fontWeight: 400 }}>
                    Source: {opp.source_name} <ExternalLink size={12} />
                  </a>
              )}
              
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
                {opp.requirements?.length > 3 && <span style={tagStyle}>{t('opportunities.more', { count: opp.requirements.length - 3 })}</span>}
              </div>
            </div>

             <div style={cardFooterStyle}>
              <Button 
                variant={opp.status === 'Saved' ? 'secondary' : 'outline'} 
                style={{ flex: 1, gap: '4px' }}
                onClick={() => handleSave(opp)}
                disabled={savingId === opp.id || opp.status === 'Saved'}
              >
                {savingId === opp.id ? t('opportunities.saving') : opp.status === 'Saved' ? t('opportunities.saved') : t('opportunities.save')}
              </Button>
              <Button 
                style={{ flex: 1, gap: '4px' }}
                onClick={() => navigate(`/opportunities/${opp.id}`)}
              >
                {opp.type === 'grant' ? 'Build Grant' : t('opportunities.prepare')} <ChevronRight size={16} />
              </Button>
            </div>
          </Card>
          ))
        )}
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
  fontSize: '1.05rem',
  fontWeight: 700,
  lineHeight: 1.4,
  marginBottom: '6px',
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
