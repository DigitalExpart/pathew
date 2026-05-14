import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  User,
  MapPin, 
  Heart, 
  Globe, 
  Calendar, 
  Save, 
  ArrowLeft,
  Briefcase,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  X,
  Search as SearchIcon,
  Award
} from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';

export const EditProfile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { openAssistant } = useAssistant();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    full_name: '',
    story: '',
    location: '',
    marital_status: '',
    date_of_birth: '',
    languages: [] as string[],
    gender: '',
    country: '',
    street_address: '',
    postal_code: '',
    city: '',
    skills: [] as string[],
    education: [] as any[],
    experience: [] as any[],
    certifications: [] as any[],
    organisation: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        story: profile.story || '',
        location: profile.location || '',
        marital_status: profile.marital_status || '',
        date_of_birth: profile.date_of_birth || '',
        languages: profile.languages || [],
        gender: profile.gender || '',
        country: profile.country || '',
        street_address: profile.street_address || '',
        postal_code: profile.postal_code || '',
        city: profile.location || '',
        skills: profile.skills || [],
        education: profile.education || [],
        experience: profile.experience || [],
        certifications: profile.certifications || [],
        organisation: profile.organisation || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Sanitize data: only send fields that exist in the profiles table
      const updateData = {
        full_name: formData.full_name,
        story: formData.story,
        location: formData.location, // This is the 'City' field
        marital_status: formData.marital_status,
        date_of_birth: formData.date_of_birth,
        languages: formData.languages,
        gender: formData.gender,
        country: formData.country,
        street_address: formData.street_address,
        postal_code: formData.postal_code,
        certifications: formData.certifications,
        organisation: formData.organisation
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      navigate('/career-profile');
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/career-profile')} style={backBtnStyle}>
          <ArrowLeft size={18} /> Back to Profile
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <h1 style={titleStyle}>Edit Professional Profile</h1>
          <Button onClick={handleSave} disabled={loading} style={{ gap: '8px' }}>
            <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      <div style={gridStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Basic Information */}
          <Card title="Basic Information" icon={User}>
            <div style={formGridStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Full Name</label>
                <input 
                  style={inputStyle} 
                  value={formData.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Primary Organisation</label>
                <input 
                  style={inputStyle} 
                  value={formData.organisation}
                  onChange={(e) => updateField('organisation', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Personal Details */}
          <Card title="Personal Details" icon={Heart}>
            <div style={formGridStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Date of Birth</label>
                <input 
                  type="date"
                  style={inputStyle} 
                  value={formData.date_of_birth}
                  onChange={(e) => updateField('date_of_birth', e.target.value)}
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Marital Status</label>
                <select 
                  style={inputStyle} 
                  value={formData.marital_status}
                  onChange={(e) => updateField('marital_status', e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Gender</label>
                <select 
                  style={inputStyle} 
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div style={{ ...inputGroupStyle, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Languages Spoken</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {formData.languages.map((lang: string) => (
                    <div key={lang} style={tagStyle}>
                      {lang}
                      <button onClick={() => updateField('languages', formData.languages.filter((l: string) => l !== lang))} style={tagCloseStyle}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={inputWithIconStyle}>
                    <SearchIcon size={16} />
                    <input 
                      placeholder="Search and add languages (e.g. English, French, Spanish...)"
                      style={bareInputStyle} 
                      onFocus={() => setIsLangDropdownOpen(true)}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsLangDropdownOpen(true);
                      }}
                    />
                  </div>
                  {isLangDropdownOpen && (
                    <div style={langDropdownStyle}>
                      {allLanguages
                        .filter(l => l.toLowerCase().includes(searchTerm.toLowerCase()) && !formData.languages.includes(l))
                        .slice(0, 50)
                        .map(lang => (
                          <div 
                            key={lang} 
                            style={langItemStyle}
                            onClick={() => {
                              updateField('languages', [...formData.languages, lang]);
                              setIsLangDropdownOpen(false);
                            }}
                          >
                            {lang}
                          </div>
                        ))
                      }
                      {searchTerm && !allLanguages.some(l => l.toLowerCase() === searchTerm.toLowerCase()) && (
                        <div 
                          style={langItemStyle}
                          onClick={() => {
                            updateField('languages', [...formData.languages, searchTerm]);
                            setIsLangDropdownOpen(false);
                          }}
                        >
                          Add "{searchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Address Details */}
          <Card title="Home Address" icon={MapPin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Street Address</label>
                <input 
                  placeholder="123 Career Avenue"
                  style={inputStyle} 
                  value={formData.street_address}
                  onChange={(e) => updateField('street_address', e.target.value)}
                />
              </div>
              <div style={formGridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Country</label>
                  <select 
                    style={inputStyle} 
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                  >
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>City</label>
                  <div style={inputWithIconStyle}>
                    <MapPin size={16} />
                    <input 
                      placeholder="e.g. London"
                      style={bareInputStyle} 
                      value={formData.location}
                      onChange={(e) => updateField('location', e.target.value)}
                    />
                  </div>
                </div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>Postal Code</label>
                  <input 
                    placeholder="100001"
                    style={inputStyle} 
                    value={formData.postal_code}
                    onChange={(e) => updateField('postal_code', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Certifications Management */}
          <Card title="Certifications" icon={Award}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {formData.certifications.map((cert: any, index: number) => (
                <div key={index} style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative' }}>
                  <button 
                    onClick={() => updateField('certifications', formData.certifications.filter((_: any, i: number) => i !== index))}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Title</label>
                      <input 
                        style={inputStyle} 
                        value={cert.title}
                        onChange={(e) => {
                          const newCerts = [...formData.certifications];
                          newCerts[index].title = e.target.value;
                          updateField('certifications', newCerts);
                        }}
                      />
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Organization</label>
                      <input 
                        style={inputStyle} 
                        value={cert.organization}
                        onChange={(e) => {
                          const newCerts = [...formData.certifications];
                          newCerts[index].organization = e.target.value;
                          updateField('certifications', newCerts);
                        }}
                      />
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Level</label>
                      <select 
                        style={inputStyle} 
                        value={cert.level}
                        onChange={(e) => {
                          const newCerts = [...formData.certifications];
                          newCerts[index].level = e.target.value;
                          updateField('certifications', newCerts);
                        }}
                      >
                        <option value="">Select Level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Pro">Pro</option>
                      </select>
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Year</label>
                      <input 
                        style={inputStyle} 
                        value={cert.year}
                        onChange={(e) => {
                          const newCerts = [...formData.certifications];
                          newCerts[index].year = e.target.value;
                          updateField('certifications', newCerts);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                style={{ borderStyle: 'dashed' }}
                onClick={() => updateField('certifications', [...formData.certifications, { title: '', organization: '', level: '', tutor: '', year: '' }])}
              >
                <Plus size={18} style={{ marginRight: '8px' }} /> Add Certification
              </Button>
            </div>
          </Card>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Action Card */}
          <Card title="Detailed Profile Management">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              To update your Bio, Skills, Education, or Work Experience, please use our interactive Profile Wizard.
            </p>
            <Button variant="outline" onClick={() => navigate('/profile-setup')} style={{ width: '100%' }}>
              Launch Profile Wizard
            </Button>
          </Card>

          <div style={infoCardStyle}>
            <h3>Privacy Note</h3>
            <p>Your personal details like Date of Birth and Marital Status are used to improve AI matching and are never shared publicly without your consent.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' };
const headerStyle: React.CSSProperties = { marginBottom: '32px' };
const backBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 };
const titleStyle: React.CSSProperties = { fontSize: '2rem', fontWeight: 800 };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' };
const formGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
const inputGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: React.CSSProperties = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' };
const inputStyle: React.CSSProperties = { padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)', outline: 'none' };
const inputWithIconStyle: React.CSSProperties = { ...inputStyle, display: 'flex', alignItems: 'center', gap: '12px' };
const bareInputStyle: React.CSSProperties = { background: 'none', border: 'none', color: 'inherit', width: '100%', outline: 'none', fontSize: 'inherit' };
const infoCardStyle: React.CSSProperties = { padding: '24px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.1)' };

const tagStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  backgroundColor: 'var(--accent-primary)',
  color: 'white',
  borderRadius: '20px',
  fontSize: '0.8125rem',
  fontWeight: 600,
};

const tagCloseStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  padding: 0,
};

const langDropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  maxHeight: '200px',
  overflowY: 'auto',
  zIndex: 100,
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
};

const langItemStyle: React.CSSProperties = {
  padding: '12px 16px',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  fontSize: '0.875rem',
  borderBottom: '1px solid var(--border-color)',
};

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", "Sao Tome and Prince", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const allLanguages = [
  "English", "French", "Spanish", "German", "Chinese", "Arabic", "Portuguese", "Russian", "Japanese", "Hindi", 
  "Yoruba", "Hausa", "Igbo", "Swahili", "Zulu", "Amharic", "Oromo", "Somali", "Twi", "Wolof", 
  "Italian", "Korean", "Turkish", "Dutch", "Polish", "Swedish", "Greek", "Hebrew", "Thai", "Vietnamese"
];
