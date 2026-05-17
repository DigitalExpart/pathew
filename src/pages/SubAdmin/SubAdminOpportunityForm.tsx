import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Globe, 
  Briefcase, 
  Gift, 
  Info,
  CheckCircle,
  ExternalLink,
  MapPin,
  Calendar,
  X,
  Edit3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const INITIAL_FORM = {
  title: '',
  description: '',
  requirements: [],
  skills: [],
  location: '',
  apply_link: '',
  type: 'job',
  status: 'draft',
  source_name: 'PATHEW',
  source_url: 'https://pathew.com',
  original_url: '',
  deadline: '',
  featured: false,
  tags: [],
  // Job fields
  work_mode: 'remote',
  salary: '',
  salary_currency: 'GBP',
  salary_period: 'yearly',
  employment_type: 'permanent',
  experience_level: '',
  organization_name: '',
  // Grant/Fellowship fields
  amount: '',
  amount_currency: 'GBP',
  duration: '',
  eligibility_criteria: '',
  funder_name: '',
  target_region: ''
};

export const SubAdminOpportunityForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState<any>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [preview, setPreview] = useState(false);
  const [reqInput, setReqInput] = useState('');
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (id && profile?.role === 'sub_admin') {
      const fetch = async () => {
        setFetching(true);
        const { data } = await supabase.from('opportunities').select('*').eq('id', id).single();
        if (data) setFormData(data);
        setFetching(false);
      };
      fetch();
    }
  }, [id, profile]);

  // Route security guard
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: 'var(--text-secondary)' }}>
        Loading permissions...
      </div>
    );
  }

  if (!profile || profile.role !== 'sub_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        const { error } = await supabase.from('opportunities').update(formData).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('opportunities').insert([formData]);
        if (error) throw error;
      }
      navigate('/sub-admin');
    } catch (error) {
      console.error('Error saving opportunity:', error);
      alert('Failed to save opportunity');
    } finally {
      setLoading(false);
    }
  };

  const handleListAdd = (field: 'requirements' | 'skills' | 'tags', value: string, setter: any) => {
    if (!value.trim()) return;
    setFormData({ ...formData, [field]: [...(formData[field] || []), value.trim()] });
    setter('');
  };

  const handleListRemove = (field: 'requirements' | 'skills' | 'tags', index: number) => {
    const list = [...formData[field]];
    list.splice(index, 1);
    setFormData({ ...formData, [field]: list });
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: 'var(--text-secondary)' }}>
        Loading opportunity details...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <button onClick={() => navigate('/sub-admin')} style={backBtnStyle}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="outline" onClick={() => setPreview(!preview)} style={{ gap: '8px' }}>
            {preview ? <Edit3 size={18} /> : <Eye size={18} />}
            {preview ? 'Edit Form' : 'Preview Post'}
          </Button>
          <Button onClick={handleSubmit} disabled={loading} style={{ gap: '8px' }}>
            <Save size={18} /> {loading ? 'Saving...' : 'Save Opportunity'}
          </Button>
        </div>
      </div>

      {preview ? (
        <OpportunityPreview data={formData} />
      ) : (
        <form onSubmit={handleSubmit} style={formGridStyle}>
          {/* Left Column: Form Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card style={formSectionStyle}>
              <h3 style={sectionTitleStyle}>General Information</h3>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Opportunity Title *</label>
                <input 
                  required
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Software Engineer" 
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Type *</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="job">Job</option>
                    <option value="grant">Grant</option>
                    <option value="fellowship">Fellowship</option>
                    <option value="scholarship">Scholarship</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Full Description *</label>
                <textarea 
                  required
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the opportunity in detail..." 
                  style={{ ...inputStyle, minHeight: '200px', resize: 'vertical' }} 
                />
              </div>
            </Card>

            {/* Conditional Fields: JOB */}
            {formData.type === 'job' && (
              <Card style={formSectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Briefcase size={20} color="#3b82f6" />
                  <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Job Details</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Organization Name</label>
                    <input 
                      value={formData.organization_name} 
                      onChange={e => setFormData({ ...formData, organization_name: e.target.value })}
                      placeholder="Company name" style={inputStyle} 
                    />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Work Mode</label>
                    <select value={formData.work_mode} onChange={e => setFormData({ ...formData, work_mode: e.target.value })} style={inputStyle}>
                      <option value="remote">Remote</option>
                      <option value="onsite">On-site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Salary Range / Amount</label>
                    <input value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} placeholder="e.g. £50k - £70k" style={inputStyle} />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Employment Type</label>
                    <select value={formData.employment_type} onChange={e => setFormData({ ...formData, employment_type: e.target.value })} style={inputStyle}>
                      <option value="permanent">Permanent</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* Conditional Fields: GRANT / FELLOWSHIP */}
            {(formData.type === 'grant' || formData.type === 'fellowship') && (
              <Card style={formSectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Gift size={20} color="#f59e0b" />
                  <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Funding Details</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Funder Name</label>
                    <input value={formData.funder_name} onChange={e => setFormData({ ...formData, funder_name: e.target.value })} placeholder="Organization providing funds" style={inputStyle} />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Funding Amount</label>
                    <input value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="e.g. £10,000" style={inputStyle} />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Duration</label>
                    <input value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g. 6 months" style={inputStyle} />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>Target Region</label>
                    <input value={formData.target_region} onChange={e => setFormData({ ...formData, target_region: e.target.value })} placeholder="e.g. Worldwide / UK" style={inputStyle} />
                  </div>
                </div>
                <div style={{ ...inputGroupStyle, marginTop: '20px' }}>
                  <label style={labelStyle}>Eligibility Criteria</label>
                  <textarea value={formData.eligibility_criteria} onChange={e => setFormData({ ...formData, eligibility_criteria: e.target.value })} placeholder="Who can apply?" style={{ ...inputStyle, minHeight: '100px' }} />
                </div>
              </Card>
            )}

            {/* Requirements & Skills */}
            <Card style={formSectionStyle}>
              <h3 style={sectionTitleStyle}>Requirements & Skills</h3>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Requirements</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input value={reqInput} onChange={e => setReqInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleListAdd('requirements', reqInput, setReqInput))} placeholder="Add requirement..." style={inputStyle} />
                  <Button type="button" variant="outline" onClick={() => handleListAdd('requirements', reqInput, setReqInput)}>Add</Button>
                </div>
                <div style={listContainerStyle}>
                  {formData.requirements?.map((item: string, i: number) => (
                    <div key={i} style={listItemStyle}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{item}</span>
                      <button type="button" onClick={() => handleListRemove('requirements', i)} style={removeBtnStyle}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...inputGroupStyle, marginTop: '20px' }}>
                <label style={labelStyle}>Skills (Tags)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleListAdd('skills', skillInput, setSkillInput))} placeholder="Add skill..." style={inputStyle} />
                  <Button type="button" variant="outline" onClick={() => handleListAdd('skills', skillInput, setSkillInput)}>Add</Button>
                </div>
                <div style={listContainerStyle}>
                  {formData.skills?.map((item: string, i: number) => (
                    <Badge key={i} variant="primary" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {item}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleListRemove('skills', i)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Sidebar settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card style={formSectionStyle}>
              <h3 style={sectionTitleStyle}>Application Links</h3>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Apply Link (External) *</label>
                <input 
                  required
                  value={formData.apply_link} 
                  onChange={e => setFormData({ ...formData, apply_link: e.target.value })}
                  placeholder="https://original-post.com/apply" 
                  style={inputStyle} 
                />
              </div>
              <div style={{ ...inputGroupStyle, marginTop: '16px' }}>
                <label style={labelStyle}>Original Post URL</label>
                <input value={formData.original_url} onChange={e => setFormData({ ...formData, original_url: e.target.value })} placeholder="https://linkedin.com/jobs/..." style={inputStyle} />
              </div>
            </Card>

            <Card style={formSectionStyle}>
              <h3 style={sectionTitleStyle}>Logistics</h3>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Location</label>
                <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. London, UK / Remote" style={inputStyle} />
              </div>
              <div style={{ ...inputGroupStyle, marginTop: '16px' }}>
                <label style={labelStyle}>Deadline</label>
                <input value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} placeholder="e.g. 30 May 2024" style={inputStyle} />
              </div>
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="featured" checked={formData.featured} onChange={e => setFormData({ ...formData, featured: e.target.checked })} style={{ cursor: 'pointer' }} />
                <label htmlFor="featured" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>Mark as Featured</label>
              </div>
            </Card>

            <Card style={formSectionStyle}>
              <h3 style={sectionTitleStyle}>Source Info</h3>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Source Name</label>
                <input value={formData.source_name} onChange={e => setFormData({ ...formData, source_name: e.target.value })} placeholder="e.g. LinkedIn, CharityJob" style={inputStyle} />
              </div>
              <div style={{ ...inputGroupStyle, marginTop: '16px' }}>
                <label style={labelStyle}>Source Website URL</label>
                <input value={formData.source_url} onChange={e => setFormData({ ...formData, source_url: e.target.value })} placeholder="https://..." style={inputStyle} />
              </div>
            </Card>

            <div style={helpCardStyle}>
              <Info size={18} color="#3b82f6" />
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Pro Tip</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jobs appear on the Jobs page. All other types appear on the Opportunities page.</p>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

const OpportunityPreview = ({ data }: { data: any }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
      <p style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.875rem' }}>POST PREVIEW MODE</p>
    </div>
    
    <Card style={{ padding: '40px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={previewLogoStyle}>{data.organization_name?.[0] || data.funder_name?.[0] || 'O'}</div>
          <div>
            <h1 style={{ fontSize: '2.25rem', marginBottom: '4px', color: 'var(--text-primary)' }}>{data.title || 'Post Title'}</h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{data.organization_name || data.funder_name || 'Organization Name'}</p>
          </div>
        </div>
        <Button style={{ gap: '8px' }}>Apply on {data.source_name} <ExternalLink size={16} /></Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }} className="grid-mobile-1">
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Description</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{data.description || 'No description provided.'}</p>
          
          <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '16px', color: 'var(--text-primary)' }}>Requirements</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.requirements?.map((req: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <CheckCircle size={18} color="#22c55e" />
                <span style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{req}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Card title="At a Glance" style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={previewMetaItemStyle}><MapPin size={18} color="var(--text-muted)" /> <div><p style={previewMetaLabel}>Location</p><p style={{ color: 'var(--text-primary)' }}>{data.location}</p></div></div>
              <div style={previewMetaItemStyle}><Calendar size={18} color="var(--text-muted)" /> <div><p style={previewMetaLabel}>Deadline</p><p style={{ color: 'var(--text-primary)' }}>{data.deadline}</p></div></div>
              <div style={previewMetaItemStyle}><Globe size={18} color="var(--text-muted)" /> <div><p style={previewMetaLabel}>Type</p><p style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{data.type}</p></div></div>
              {data.salary && <div style={previewMetaItemStyle}><Briefcase size={18} color="var(--text-muted)" /> <div><p style={previewMetaLabel}>Salary</p><p style={{ color: 'var(--text-primary)' }}>{data.salary}</p></div></div>}
              {data.amount && <div style={previewMetaItemStyle}><Gift size={18} color="var(--text-muted)" /> <div><p style={previewMetaLabel}>Funding</p><p style={{ color: 'var(--text-primary)' }}>{data.amount}</p></div></div>}
            </div>
          </Card>
        </div>
      </div>
    </Card>
  </div>
);

// Inline styles mirroring the rest of the workspace variables
const backBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem' };
const formGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' };
const formSectionStyle: React.CSSProperties = { padding: '32px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' };
const inputGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: React.CSSProperties = { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' };
const listContainerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' };
const listItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' };
const removeBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 };
const helpCardStyle: React.CSSProperties = { display: 'flex', gap: '12px', padding: '16px', backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: '12px' };
const previewLogoStyle: React.CSSProperties = { width: '64px', height: '64px', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' };
const previewMetaItemStyle: React.CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start' };
const previewMetaLabel: React.CSSProperties = { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' };
