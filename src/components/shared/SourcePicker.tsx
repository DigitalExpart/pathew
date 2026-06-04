import React, { useState } from 'react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  FileText, 
  FilePlus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Briefcase,
  Eye,
  Copy,
  X,
  Edit3,
  Save
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
  const { t } = useTranslation();
  const PROFILE_ID = 'pathew-profile';
  const [activeTab, setActiveTab] = useState<'upload' | 'linkedin' | 'notes'>('upload');
  const [uploading, setUploading] = useState(false);
  
  // Form states
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedinContent, setLinkedinContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const [viewingSource, setViewingSource] = useState<ProfileSource | null>(null);
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleViewSource = (src: ProfileSource) => {
    setViewingSource(src);
    setEditingContent(src.raw_text || '');
    setIsEditingSource(false);
  };

  const handleSaveEdit = async () => {
    if (!viewingSource) return;
    setIsSavingEdit(true);
    try {
      await BuilderService.updateProfileSource(viewingSource.id, { raw_text: editingContent });
      await onRefreshSources();
      setViewingSource({ ...viewingSource, raw_text: editingContent });
      setIsEditingSource(false);
    } catch (error: any) {
      alert(`Failed to save changes: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

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
      let rawText = '';

      if (file.type === 'text/plain') {
        // Plain text files — read directly
        rawText = await file.text();
      } else if (
        file.name.toLowerCase().endsWith('.docx') ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        // DOCX files — extract text using mammoth
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        rawText = result.value;
        if (!rawText || rawText.trim().length === 0) {
          throw new Error('Could not extract any text from this DOCX file. The document may be empty or image-based.');
        }
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        if (!fullText || fullText.trim().length === 0) {
          throw new Error('Could not extract any text from this PDF file. The document may be image-based or scanned.');
        }
        // Remove null characters (\u0000) which cause PostgreSQL "unsupported Unicode escape sequence" errors
        rawText = fullText.replace(/\0/g, '');
      } else {
        throw new Error(
          `Unsupported file type: ${file.type || file.name.split('.').pop()}. ` +
          'Please upload a .docx or .txt file, or paste your content in the "Add Manual Notes" tab.'
        );
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
      // Reset the file input so the same file can be re-uploaded if needed
      e.target.value = '';
    }
  };

  const handleSubmitLinkedin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinContent.trim()) {
      setFeedback('Error: Auto-import from URL is not supported. You must manually copy the text from your LinkedIn page and paste it into the large text box below.');
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      const profileText = linkedinUrl.trim()
        ? `LinkedIn Profile (${linkedinUrl}):\n${linkedinContent}`
        : linkedinContent;

      await BuilderService.createProfileSource({
        source_type: 'linkedin',
        file_name: linkedinUrl.trim() ? 'LinkedIn Profile' : 'LinkedIn Profile (Pasted)',
        raw_text: profileText.replace(/\0/g, ''),
      }, userId);

      await onRefreshSources();

      // Auto-select the newly created LinkedIn source
      const freshSources = await BuilderService.fetchProfileSources(userId);
      if (freshSources.length > 0) {
        onChangeSelected([...selectedSourceIds, freshSources[0].id]);
      }

      setLinkedinUrl('');
      setLinkedinContent('');
      setFeedback('LinkedIn profile imported successfully!');
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
        raw_text: noteContent.replace(/\0/g, ''),
      }, userId);

      await onRefreshSources();

      // Auto-select the newly created notes source
      const freshSources = await BuilderService.fetchProfileSources(userId);
      if (freshSources.length > 0) {
        onChangeSelected([...selectedSourceIds, freshSources[0].id]);
      }

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
      <h3 style={titleStyle}>{t('builders.sources.step1Title', '1. Select Background Materials')}</h3>
      <p style={subtitleStyle}>{t('builders.sources.step1Desc', 'Select one or more sources. Pathew Assistant will use these to draft and tailor your document automatically.')}</p>

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
                {t('builders.sources.active', 'Active')}
              </Badge>
            )}
          </div>
          <h4 style={cardTitleStyle}>{t('builders.sources.pathewProfile', 'Your Pathew Profile')}</h4>
          <p style={cardDescStyle}>{t('builders.sources.pathewProfileDesc', 'Includes Story, Skills, Experience, and Goals from settings.')}</p>
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
                  {src.raw_text && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewSource(src); }}
                        style={deleteBtnStyle}
                        title="View/Edit content"
                      >
                        <Eye size={14} color="var(--text-muted)" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(src.raw_text || ''); alert('Copied to clipboard!'); }}
                        style={deleteBtnStyle}
                        title="Copy content"
                      >
                        <Copy size={14} color="var(--text-muted)" />
                      </button>
                    </>
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
            {t('builders.sources.tabUpload', 'Upload Resume (PDF/DOCX/TXT)')}
          </button>
          <button 
            onClick={() => setActiveTab('linkedin')} 
            style={{ ...tabBtnStyle, borderBottomColor: activeTab === 'linkedin' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'linkedin' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            {t('builders.sources.tabLinkedin', 'Import LinkedIn')}
          </button>
          <button 
            onClick={() => setActiveTab('notes')} 
            style={{ ...tabBtnStyle, borderBottomColor: activeTab === 'notes' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'notes' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            {t('builders.sources.tabNotes', 'Add Manual Notes')}
          </button>
        </div>

        <div style={tabContentStyle}>
          {activeTab === 'upload' && (
            <div style={uploadZoneStyle}>
              <FilePlus size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>Upload your CV or Resume</p>
              <p style={{ marginBottom: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Supported formats: .pdf, .docx, .txt — Your document content will be extracted automatically</p>
              <Button variant="outline" size="sm" style={{ position: 'relative' }} disabled={uploading}>
                {uploading ? 'Extracting content...' : 'Browse files'}
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
              <div style={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', border: '1px solid var(--warning)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span> Manual Copy-Paste Required
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  We cannot automatically scan your profile from just a URL. You must <b>open your LinkedIn profile</b>, select all the text (About, Experience, Education), <b>copy it</b>, and <b>paste it</b> into the large box below.
                </p>
              </div>
              <input 
                type="url" 
                placeholder="https://linkedin.com/in/username (optional)" 
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                style={inputStyle}
              />
              <textarea 
                placeholder="Paste your LinkedIn profile content here...&#10;&#10;Example:&#10;About: Experienced software engineer...&#10;Experience: Senior Developer at [Company Name]...&#10;Skills: React, TypeScript...&#10;Education: BSc Computer Science, [University Name]"
                value={linkedinContent}
                onChange={(e) => setLinkedinContent(e.target.value)}
                style={textareaStyle}
                required
              />
              <Button type="submit" size="sm" disabled={uploading} style={{ gap: '8px' }}>
                <LinkedinIcon size={16} /> {uploading ? 'Importing...' : 'Import LinkedIn Profile'}
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

      {viewingSource && (
        <div style={modalOverlayStyle} onClick={() => setViewingSource(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {viewingSource.file_name}
              </h4>
              <button onClick={() => setViewingSource(null)} style={deleteBtnStyle}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>
            
            <div style={modalBodyStyle}>
              {isEditingSource ? (
                <textarea 
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  style={{...modalTextareaStyle, backgroundColor: 'var(--bg-primary, #fff)', border: '1px solid var(--accent-primary)'}}
                  placeholder="Edit content here..."
                />
              ) : (
                <textarea 
                  readOnly
                  value={viewingSource.raw_text} 
                  style={modalTextareaStyle} 
                />
              )}
            </div>
            
            <div style={modalFooterStyle}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    navigator.clipboard.writeText(viewingSource.raw_text || ''); 
                    alert('Copied to clipboard!');
                  }} 
                  size="sm"
                  style={{ gap: '6px' }}
                >
                  <Copy size={14} /> Copy
                </Button>
                
                {isEditingSource ? (
                  <Button 
                    onClick={handleSaveEdit} 
                    size="sm" 
                    disabled={isSavingEdit}
                    style={{ gap: '6px' }}
                  >
                    <Save size={14} /> {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setIsEditingSource(true)} 
                    size="sm"
                    style={{ gap: '6px' }}
                  >
                    <Edit3 size={14} /> Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary, #fff)',
  borderRadius: 'var(--radius-lg, 8px)',
  width: '90%',
  maxWidth: '700px',
  height: '80vh',
  maxHeight: '600px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid var(--border-color, #e5e7eb)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const modalBodyStyle: React.CSSProperties = {
  padding: '20px',
  overflowY: 'auto',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
};

const modalTextareaStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  backgroundColor: 'var(--bg-secondary, #f9fafb)',
  border: '1px solid var(--border-color, #e5e7eb)',
  borderRadius: '4px',
  padding: '16px',
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  resize: 'none',
  outline: 'none',
  lineHeight: 1.5,
};

const modalFooterStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderTop: '1px solid var(--border-color, #e5e7eb)',
  display: 'flex',
  justifyContent: 'flex-end',
};
