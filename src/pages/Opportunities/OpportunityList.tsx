import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, Calendar, MapPin, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const OpportunityList: React.FC = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
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
      const { error } = await supabase
        .from('opportunities')
        .update({ status: 'Saved' })
        .eq('id', opp.id);
      
      if (error) throw error;
      
      // Update local state
      setOpportunities(prev => prev.map(o => o.id === opp.id ? { ...o, status: 'Saved' } : o));
      
      // Record activity
      await supabase.from('activities').insert({
        user_id: user.id,
        content: `Saved opportunity: ${opp.title} at ${opp.company}`
      });

    } catch (error) {
      console.error('Error saving opportunity:', error);
    } finally {
      setSavingId(null);
    }
  };

  const filteredOpps = opportunities.filter(opp => 
    opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ ...containerStyle, padding: isMobile ? '0' : '0' }}>
      <header style={{ ...headerStyle, textAlign: isMobile ? 'center' : 'left' }}>
        <h1 style={{ ...titleStyle, fontSize: isMobile ? '1.75rem' : '2.5rem' }}>Explore Opportunities</h1>
        <p style={subtitleStyle}>Found {filteredOpps.length} opportunities matching your profile.</p>
      </header>

      {/* Filters Bar */}
      <div className="stack-on-mobile" style={{ ...filtersBarStyle, flexDirection: isMobile ? 'column' : 'row' }}>
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
        
        <div style={{ ...filterButtonsStyle, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          <Button variant="outline" size="sm" style={{ gap: '8px', flex: isMobile ? 1 : 'none' }}>
            <Filter size={16} /> Filters
          </Button>
          {!isMobile && <div style={dividerStyle}></div>}
          <select style={{ ...selectStyle, flex: isMobile ? 1 : 'none' }}>
            <option>Sort by: Newest</option>
            <option>Sort by: Deadline</option>
          </select>
        </div>
      </div>

      {/* Opportunity Cards */}
      <div className="grid-responsive" style={{
        ...gridStyle,
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
      }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p>Loading opportunities...</p>
          </div>
        ) : filteredOpps.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p>No opportunities found. Try a different search term.</p>
          </div>
        ) : (
          filteredOpps.map(opp => (
            <Card key={opp.id} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={cardHeaderStyle}>
              <div style={companyShortLogoStyle}>
                {(opp.organization_name || opp.funder_name || 'O').charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {opp.featured && (
                    <Badge variant="primary" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}>
                      <Star size={12} fill="currentColor" /> Featured
                    </Badge>
                  )}
                  <Badge variant="outline" style={{ textTransform: 'capitalize' }}>{opp.type}</Badge>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, marginTop: '20px' }}>
              <h3 style={oppTitleStyle}>{opp.title}</h3>
              <p style={companyStyle}>{opp.organization_name || opp.funder_name || 'Various Sources'}</p>
              
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
                {opp.requirements?.slice(0, 3).map((req: string, i: number) => (
                  <span key={i} style={tagStyle}>{req}</span>
                ))}
                {opp.requirements?.length > 3 && <span style={tagStyle}>+{opp.requirements.length - 3} more</span>}
              </div>
            </div>

             <div style={cardFooterStyle}>
              <Button 
                variant={opp.status === 'Saved' ? 'secondary' : 'outline'} 
                style={{ flex: 1, gap: '4px' }}
                onClick={() => handleSave(opp)}
                disabled={savingId === opp.id || opp.status === 'Saved'}
              >
                {savingId === opp.id ? 'Saving...' : opp.status === 'Saved' ? 'Saved' : 'Save'}
              </Button>
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

const companyShortLogoStyle: React.CSSProperties = {
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
