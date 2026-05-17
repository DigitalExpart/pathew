import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  FileText, 
  FilePlus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Briefcase
} from 'lucide-react';
import { BuilderService } from '../../services/builderService';
import type { ProfileSource } from '../../services/builderService';

const LinkedinIcon = ({ size = 20, color }: { size?: number; color?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color || "currentColor"} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface SourcePickerProps {
  sources: ProfileSource[];
  selectedSourceIds: string[];
  onChangeSelected: (ids: string[]) => void;
  onRefreshSources: () => Promise<void>;
  userId: string;
}

export const SourcePicker: React.FC<SourcePickerProps> = ({
  sources,
  selectedSourceIds,
  onChangeSelected,
  onRefreshSources,
  userId,
}) => {
  const PROFILE_ID = 'pathew-profile';
  const [activeTab, setActiveTab] = useState<'upload' | 'linkedin' | 'notes'>('upload');
  const [uploading, setUploading] = useState(false);
  
  // Form states
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Auto-select the Pathew Profile on mount
  useState(() => {
    if (!selectedSourceIds.includes(PROFILE_ID)) {
      onChangeSelected([...selectedSourceIds, PROFILE_ID]);
    }
  });

  const isProfileSelected = selectedSourceIds.includes(PROFILE_ID);

  const toggleProfileSelect = () => {
    if (isProfileSelected) {
      onChangeSelected(selectedSourceIds.filter(sid => sid !== PROFILE_ID));
    } else {
      onChangeSelected([...selectedSourceIds, PROFILE_ID]);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedSourceIds.includes(id)) {
      onChangeSelected(selectedSourceIds.filter(sid => sid !== id));
    } else {
      onChangeSelected([...selectedSourceIds, id]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFeedback(null);

    try {
      // Simple client-side text extractor fallback for demo/txt files, or standard mock text
      let rawText = `Extracted Text from ${file.name}:\n`;
      if (file.type === 'text/plain') {
        const text = await file.text();
        rawText += text;
      } else {
        rawText += `Skills: Software Engineering, React, TypeScript, Node.js, Next.js, Database Design.\nExperience: Senior Software Engineer at TechCorp (2 years), developing high-performance analytics dashboards.\nEducation: BSc Computer Science.\nAchievements: Optimized frontend bundle size by 40% using code splitting.`;
      }

      await BuilderService.createProfileSource({
        source_type: 'uploaded_cv',
        file_name: file.name,
        file_type: file.type,
        raw_text: rawText,
      }, userId);

      await onRefreshSources();
      setFeedback('Resume uploaded and processed successfully!');
      
      // Auto-select the newly uploaded source
      const freshSources = await BuilderService.fetchProfileSources(userId);
      if (freshSources.length > 0) {
        onChangeSelected([...selectedSourceIds, freshSources[0].id]);
      }
    } catch (err: any) {
      setFeedback(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitLinkedin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl.trim()) return;

    setUploading(true);
    setFeedback(null);

    try {
      const mockParsedLinkedIn = `LinkedIn Profile details for ${linkedinUrl}:\nFull Name: Shilley Johnson\nHeadline: Senior Full Stack Engineer & Team Lead\nIndustry: Cloud Computing & SaaS Development\nSkills: React, Redux, PostgreSQL, GraphQL, Deno, Serverless Architectures.\nExperience: Lead Developer at FinTech Solutions (3 years). Managed a team of 4 engineers to launch commission automation tools.`;

      await BuilderService.createProfileSource({
        source_type: 'linkedin',
        source_url: linkedinUrl,
        file_name: 'LinkedIn Profile Link',
        raw_text: mockParsedLinkedIn,
      }, userId);

      await onRefreshSources();
      setLinkedinUrl('');
      setFeedback('LinkedIn URL imported successfully!');
    } catch (err: any) {
      setFeedback(`Import failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setUploading(true);
    setFeedback(null);

    try {
      await BuilderService.createProfileSource({
        source_type: 'manual_notes',
        file_name: noteTitle.trim() || 'My Background Notes',
        raw_text: noteContent,
      }, userId);

      await onRefreshSources();
      setNoteTitle('');
      setNoteContent('');
      setFeedback('Notes recorded successfully!');
    } catch (err: any) {
      setFeedback(`Save failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSource = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this source?')) return;
    try {
      await BuilderService.deleteProfileSource(id);
      onChangeSelected(selectedSourceIds.filter(sid => sid !== id));
      await onRefreshSources();
    } catch (err: any) {
      alert(`Could not delete: ${err.message}`);
    }
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>1. Select Background Materials</h3>
      <p style={subtitleStyle}>Select one or more sources. Pathew Assistant will use these to draft and tailor your document automatically.</p>

      {/* Selectable Sources Grid */}
      <div style={sourcesGridStyle}>
        {/* Core Pathew Profile (Simulated default option) */}
        <Card 
          onClick={toggleProfileSelect} 
          style={{ 
            ...sourceCardStyle, 
            borderColor: isProfileSelected ? 'var(--accent-primary)' : 'var(--border-color)',
            background: isProfileSelected ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
            cursor: 'pointer'
          }}
        >
          <div style={sourceCardHeaderStyle}>
            <div style={iconBoxStyle}>
              <Briefcase size={20} color={isProfileSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
            </div>
            {isProfileSelected && (
              <Badge variant="primary" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-primary)' }}>
                Active
              </Badge>
            )}
          </div>
          <h4 style={cardTitleStyle}>Your Pathew Profile</h4>
          <p style={cardDescStyle}>Includes Story, Skills, Experience, and Goals from settings.</p>
        </Card>

        {sources.map(src => {
          const isSelected = selectedSourceIds.includes(src.id);
          return (
            <Card 
              key={src.id}
              onClick={() => toggleSelect(src.id)}
              style={{ 
                ...sourceCardStyle, 
                borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={sourceCardHeaderStyle}>
                <div style={iconBoxStyle}>
                  {src.source_type === 'linkedin' ? (
                    <LinkedinIcon size={20} color="#0077b5" />
                  ) : (
                    <FileText size={20} color="var(--accent-primary)" />
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isSelected && (
                    <span style={checkBadgeStyle}>
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </span>
                  )}
                  <button 
                    onClick={(e) => handleDeleteSource(e, src.id)} 
                    style={deleteBtnStyle}
                    title="Delete source"
                  >
                    <Trash2 size={14} color="var(--text-muted)" />
                  </button>
                </div>
              </div>
              <h4 style={cardTitleStyle}>{src.file_name}</h4>
              <p style={cardDescStyle}>
                {src.source_type === 'uploaded_cv' && 'Uploaded resume file.'}
                {src.source_type === 'linkedin' && 'LinkedIn Profile details.'}
                {src.source_type === 'manual_notes' && 'Pasted manual background notes.'}
              </p>
              <span style={dateBadgeStyle}>
                {src.created_at ? new Date(src.created_at).toLocaleDateString() : 'Just now'}
              </span>
            </Card>
          );
        })}
      </div>

      {/* Add new Background material tabs */}
      <Card style={newSourceCardStyle}>
        <div style={tabsHeaderStyle}>
          <button 
            onClick={() => setActiveTab('upload')} 
            style={{ ...tabBtnStyle, borderBottomColor: activeTab === 'upload' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'upload' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            Upload Resume (PDF/TXT)
          </button>
          <button 
            onClick={() => setActiveTab('linkedin')} 
            style={{ ...tabBtnStyle, borderBottomColor: activeTab === 'linkedin' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'linkedin' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            Import LinkedIn
          </button>
          <button 
            onClick={() => setActiveTab('notes')} 
            style={{ ...tabBtnStyle, borderBottomColor: activeTab === 'notes' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'notes' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            Add Manual Notes
          </button>
        </div>

        <div style={tabContentStyle}>
          {activeTab === 'upload' && (
            <div style={uploadZoneStyle}>
              <FilePlus size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ marginBottom: '16px', fontSize: '0.875rem' }}>Drag and drop your file here, or click to browse</p>
              <Button variant="outline" size="sm" style={{ position: 'relative' }} disabled={uploading}>
                {uploading ? 'Processing...' : 'Browse files'}
                <input 
                  type="file" 
                  accept=".txt,.pdf,.docx" 
                  onChange={handleFileUpload} 
                  style={fileInputOverlayStyle} 
                  disabled={uploading}
                />
              </Button>
            </div>
          )}

          {activeTab === 'linkedin' && (
            <form onSubmit={handleSubmitLinkedin} style={formStyle}>
              <input 
                type="url" 
                placeholder="https://linkedin.com/in/username" 
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                style={inputStyle}
                required
              />
              <Button type="submit" size="sm" disabled={uploading} style={{ gap: '8px' }}>
                <LinkedinIcon size={16} /> {uploading ? 'Syncing...' : 'Sync LinkedIn Profile'}
              </Button>
            </form>
          )}

          {activeTab === 'notes' && (
            <form onSubmit={handleSubmitNote} style={formStyle}>
              <input 
                type="text" 
                placeholder="Title (e.g. My Leadership achievements)" 
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                style={inputStyle}
              />
              <textarea 
                placeholder="Paste any additional experience details, work summaries, or qualifications you want the AI to incorporate..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                style={textareaStyle}
                required
              />
              <Button type="submit" size="sm" disabled={uploading}>
                {uploading ? 'Adding...' : 'Save Notes'}
              </Button>
            </form>
          )}

          {feedback && (
            <div style={{ ...feedbackStyle, color: feedback.includes('failed') ? '#ef4444' : 'var(--accent-primary)' }}>
              <AlertCircle size={16} />
              <span>{feedback}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  marginBottom: '4px',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '0.875rem',
  marginBottom: '20px',
};

const sourcesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '16px',
  marginBottom: '24px',
};

const sourceCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  minHeight: '140px',
  transition: 'border-color 0.2s ease',
};

const sourceCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
};

const iconBoxStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const checkBadgeStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: 'var(--accent-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const deleteBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '0.975rem',
  fontWeight: 650,
  marginBottom: '4px',
};

const cardDescStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  marginBottom: '12px',
  flex: 1,
};

const dateBadgeStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--text-muted)',
  alignSelf: 'flex-start',
};

const newSourceCardStyle: React.CSSProperties = {
  padding: 0,
  overflow: 'hidden',
};

const tabsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-secondary)',
};

const tabBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  fontSize: '0.825rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
};

const tabContentStyle: React.CSSProperties = {
  padding: '24px',
};

const uploadZoneStyle: React.CSSProperties = {
  border: '2px dashed var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: '32px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
  position: 'relative',
};

const fileInputOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  opacity: 0,
  cursor: 'pointer',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--text-primary)',
  padding: '12px',
  fontSize: '0.875rem',
  outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--text-primary)',
  padding: '12px',
  fontSize: '0.875rem',
  outline: 'none',
  minHeight: '120px',
  fontFamily: 'inherit',
  resize: 'vertical',
};

const feedbackStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.8rem',
  marginTop: '16px',
};
