import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  User,
  MapPin, 
  Heart, 
  Save, 
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Search as SearchIcon,
  Award
} from 'lucide-react';


export const EditProfile: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState<any>({
    full_name: '',
    story: '',
    location: '',
    year_of_birth: '',
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
        year_of_birth: profile.year_of_birth || (profile as any).date_of_birth || '',
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
        year_of_birth: formData.year_of_birth,
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
    <div style={{ ...containerStyle, padding: isMobile ? '20px 16px' : '40px 20px' }}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/career-profile')} style={backBtnStyle}>
          <ArrowLeft size={18} /> {t('editProfile.backToProfile')}
        </button>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginTop: '16px', gap: isMobile ? '16px' : '0' }}>
          <h1 style={titleStyle}>{t('editProfile.title')}</h1>
          <Button onClick={handleSave} disabled={loading} style={{ gap: '8px', justifyContent: 'center' }}>
            <Save size={18} /> {loading ? t('common.saving') : t('editProfile.saveChanges')}
          </Button>
        </div>
      </header>

      <div style={{
        ...gridStyle,
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Basic Information */}
          <Card title={t('editProfile.basicInfo')} icon={User}>
            <div style={{ ...formGridStyle, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>{t('editProfile.fullName')}</label>
                <input 
                  style={inputStyle} 
                  value={formData.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>{t('editProfile.primaryOrg')}</label>
                <input 
                  style={inputStyle} 
                  value={formData.organisation}
                  onChange={(e) => updateField('organisation', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Personal Details */}
          <Card title={t('editProfile.personalDetails')} icon={Heart}>
            <div style={{ ...formGridStyle, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>{t('editProfile.dob')}</label>
                <input 
                  type="number"
                  placeholder="YYYY"
                  min="1900"
                  max={new Date().getFullYear()}
                  style={inputStyle} 
                  value={formData.year_of_birth}
                  onChange={(e) => updateField('year_of_birth', e.target.value)}
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>{t('editProfile.gender')}</label>
                <select 
                  style={inputStyle} 
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                >
                  <option value="">{t('editProfile.selectGender')}</option>
                  <option value="Male">{t('editProfile.male')}</option>
                  <option value="Female">{t('editProfile.female')}</option>
                  <option value="Other">{t('editProfile.other')}</option>
                  <option value="Prefer not to say">{t('editProfile.preferNotToSay')}</option>
                </select>
              </div>
              <div style={{ ...inputGroupStyle, gridColumn: isMobile ? 'auto' : 'span 2' }}>
                <label style={labelStyle}>{t('editProfile.languagesSpoken')}</label>
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
                      placeholder={t('editProfile.searchLanguages')}
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
                          {t('editProfile.addLanguage', { name: searchTerm })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Address Details */}
          <Card title={t('editProfile.homeAddress')} icon={MapPin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div style={inputGroupStyle}>
                <label style={labelStyle}>{t('editProfile.streetAddress')}</label>
                <input 
                  placeholder="123 Career Avenue"
                  style={inputStyle} 
                  value={formData.street_address}
                  onChange={(e) => updateField('street_address', e.target.value)}
                />
              </div>
              <div style={{ ...formGridStyle, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>{t('editProfile.country')}</label>
                  <select 
                    style={inputStyle} 
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                  >
                    <option value="">{t('editProfile.selectCountry')}</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>{t('editProfile.city')}</label>
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
                  <label style={labelStyle}>{t('editProfile.postalCode')}</label>
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
          <Card title={t('editProfile.certifications')} icon={Award}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {formData.certifications.map((cert: any, index: number) => (
                <div key={index} style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative' }}>
                  <button 
                    onClick={() => updateField('certifications', formData.certifications.filter((_: any, i: number) => i !== index))}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>{t('editProfile.certTitle')}</label>
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
                      <label style={labelStyle}>{t('editProfile.certOrg')}</label>
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
                      <label style={labelStyle}>{t('editProfile.certLevel')}</label>
                      <select 
                        style={inputStyle} 
                        value={cert.level}
                        onChange={(e) => {
                          const newCerts = [...formData.certifications];
                          newCerts[index].level = e.target.value;
                          updateField('certifications', newCerts);
                        }}
                      >
                        <option value="">{t('editProfile.selectLevel')}</option>
                        <option value="Beginner">{t('editProfile.beginner')}</option>
                        <option value="Intermediate">{t('editProfile.intermediate')}</option>
                        <option value="Pro">{t('editProfile.pro')}</option>
                      </select>
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>{t('editProfile.year')}</label>
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
                <Plus size={18} style={{ marginRight: '8px' }} /> {t('editProfile.addCertification')}
              </Button>
            </div>
          </Card>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Action Card */}
          <Card title={t('editProfile.detailedManagement')}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {t('editProfile.profileWizardDesc')}
            </p>
            <Button variant="outline" onClick={() => navigate('/profile-setup')} style={{ width: '100%' }}>
              {t('editProfile.launchWizard')}
            </Button>
          </Card>

          <div style={infoCardStyle}>
            <h3>{t('editProfile.privacyNote')}</h3>
            <p>{t('editProfile.privacyNoteDesc')}</p>
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
