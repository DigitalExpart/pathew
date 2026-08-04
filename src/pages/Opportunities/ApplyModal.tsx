import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Link as LinkIcon, 
  Send, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Paperclip, 
  Loader2, 
  Trash2,
  UserCheck,
  Globe,
  FileCheck,
  Film,
  Music,
  Sparkles,
  Plus
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface ApplyModalProps {
  opportunityId: string;
  opportunityTitle: string;
  onClose?: () => void;
  onSuccess: () => void;
  isInline?: boolean;
}

export interface MediaFileItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  format: string;
  size?: number;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({ 
  opportunityId, 
  opportunityTitle, 
  onClose, 
  onSuccess, 
  isInline = false 
}) => {
  const { user, profile } = useAuth();
  
  // React refs for file inputs to prevent duplicate DOM ID collisions
  const cvInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Application fields
  const [resumeText, setResumeText] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [proposalLetter, setProposalLetter] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [profileAttached, setProfileAttached] = useState(false);
  
  // CV Upload state
  const [cvFileName, setCvFileName] = useState<string>('');
  const [cvFileSize, setCvFileSize] = useState<number | undefined>(undefined);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvFileUrl, setCvFileUrl] = useState<string>('');

  // Rich Media Portfolio Upload state (Pictures, Videos, Audio, PDFs, Docs)
  const [mediaFiles, setMediaFiles] = useState<MediaFileItem[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<{ url: string; type: string; title: string } | null>(null);

  // User Saved Documents on PATHEW
  const [userDocs, setUserDocs] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOverCv, setIsDragOverCv] = useState(false);
  const [isDragOverMedia, setIsDragOverMedia] = useState(false);

  // Fetch user's saved documents from PATHEW
  useEffect(() => {
    if (!user) return;
    const fetchUserDocs = async () => {
      try {
        const { data } = await supabase
          .from('generated_documents')
          .select('id, title, document_type, content, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        if (data) setUserDocs(data);
      } catch (e) {
        console.error('Error fetching user documents:', e);
      }
    };
    fetchUserDocs();
  }, [user]);

  // Pre-fill profile portfolio link if available
  useEffect(() => {
    if (profile?.portfolio_url && !portfolioUrl) {
      setPortfolioUrl(profile.portfolio_url);
    }
  }, [profile]);

  // Helper for file size display
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to determine media type & format
  const getMediaTypeAndFormat = (file: File) => {
    const mimeType = file.type.toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return { type: 'image' as const, format: ext.toUpperCase() || 'IMAGE' };
    }
    if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogv', '3gp'].includes(ext)) {
      return { type: 'video' as const, format: ext.toUpperCase() || 'VIDEO' };
    }
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext)) {
      return { type: 'audio' as const, format: ext.toUpperCase() || 'AUDIO' };
    }
    return { type: 'document' as const, format: ext.toUpperCase() || 'FILE' };
  };

  // Upload file to Supabase storage with data URL fallback
  const uploadFileToStorage = async (file: File, folder: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop() || 'bin';
      const cleanFileName = `${user?.id || 'anon'}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${cleanFileName}`;

      let targetBucket = folder === 'portfolios' ? 'portfolios' : 'documents';

      let { error: uploadErr } = await supabase.storage
        .from(targetBucket)
        .upload(filePath, file, { upsert: true });

      if (uploadErr && targetBucket !== 'documents') {
        const res = await supabase.storage.from('documents').upload(filePath, file, { upsert: true });
        uploadErr = res.error;
        targetBucket = 'documents';
      }

      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from(targetBucket).getPublicUrl(filePath);
        return publicUrl;
      } else {
        console.warn('Supabase storage bucket upload notice:', uploadErr.message);
      }
    } catch (e) {
      console.warn('Storage error, defaulting to Data URL fallback:', e);
    }

    // Fallback Data URL for reliability (up to 15MB)
    if (file.size < 15 * 1024 * 1024) {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    } else {
      throw new Error(`File ${file.name} is too large. Please upload files under 15MB.`);
    }
  };

  // Handle CV File selection/drop & upload
  const processCvFile = async (file: File) => {
    setCvFileName(file.name);
    setCvFileSize(file.size);
    setUploadingCv(true);
    setError(null);

    try {
      const uploadedUrl = await uploadFileToStorage(file, 'cvs');
      if (uploadedUrl) {
        setCvFileUrl(uploadedUrl);
        setResumeUrl(uploadedUrl);
      } else {
        setError('Failed to upload CV file. Please try again.');
      }
    } catch (err: any) {
      console.error('CV upload error:', err);
      setError('CV upload error: ' + (err.message || 'Failed to upload'));
    } finally {
      setUploadingCv(false);
    }
  };

  const handleCvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processCvFile(file);
  };

  // Handle Media Portfolio Uploads (Pictures, Videos, Audio, PDFs, Files)
  const processMediaFiles = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;

    setUploadingMedia(true);
    setError(null);

    try {
      const uploadedItems: MediaFileItem[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const { type, format } = getMediaTypeAndFormat(file);

        const url = await uploadFileToStorage(file, 'portfolios');
        if (url) {
          uploadedItems.push({
            id: `${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`,
            name: file.name,
            url,
            type,
            format,
            size: file.size
          });
        }
      }

      setMediaFiles(prev => [...prev, ...uploadedItems]);
    } catch (err: any) {
      console.error('Media upload error:', err);
      setError('Media upload error: ' + (err.message || 'Failed to upload'));
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await processMediaFiles(e.target.files);
  };

  // Auto-fill details from logged-in PATHEW Profile
  const handleAutoFillProfile = () => {
    if (!profile) return;
    setProfileAttached(true);
    if (profile.portfolio_url) setPortfolioUrl(profile.portfolio_url);
    
    // Suggest starter proposal text if empty
    if (!proposalLetter) {
      const roleStr = profile.full_name ? `My name is ${profile.full_name}.` : '';
      const storyStr = profile.story ? ` ${profile.story}` : '';
      const skillsStr = profile.skills && profile.skills.length > 0 ? `\n\nKey Expertise & Skills: ${profile.skills.join(', ')}` : '';
      setProposalLetter(`${roleStr}${storyStr}${skillsStr}`);
    }
  };

  // Select PATHEW Generated CV Document
  const handleSelectPathewDoc = (docId: string) => {
    setSelectedDocId(docId);
    const doc = userDocs.find(d => d.id === docId);
    if (doc) {
      setResumeText(doc.content || '');
    }
  };

  const removeMedia = (id: string) => {
    setMediaFiles(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to submit your application.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Check if user already applied
      const { data: existingApp } = await supabase
        .from('opportunity_applications')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .eq('applicant_id', user.id)
        .maybeSingle();

      if (existingApp) {
        setError('You have already submitted an application for this opportunity.');
        setLoading(false);
        return;
      }

      const finalResumeUrl = cvFileUrl || resumeUrl;

      const basePayload: Record<string, any> = {
        opportunity_id: opportunityId,
        applicant_id: user.id,
        resume_text: resumeText,
        resume_url: finalResumeUrl,
        proposal_letter: proposalLetter,
        portfolio_url: portfolioUrl || (mediaFiles.length > 0 ? mediaFiles[0].url : ''),
        media_urls: mediaFiles,
        status: 'pending'
      };

      // Try inserting with optional enhanced fields, with automatic fallback if database columns are missing
      try {
        const { error: insertErr } = await supabase.from('opportunity_applications').insert({
          ...basePayload,
          attached_documents: selectedDocId ? [selectedDocId] : [],
          profile_attached: profileAttached,
        });

        if (insertErr) {
          // If schema cache indicates missing column, fallback to standard base payload
          if (
            insertErr.message?.includes('attached_documents') || 
            insertErr.message?.includes('profile_attached') ||
            insertErr.code === 'PGRST204'
          ) {
            const { error: fallbackErr } = await supabase.from('opportunity_applications').insert(basePayload);
            if (fallbackErr) throw fallbackErr;
          } else {
            throw insertErr;
          }
        }
      } catch (insertCatch: any) {
        // Fallback retry with core base payload
        const { error: fallbackErr } = await supabase.from('opportunity_applications').insert(basePayload);
        if (fallbackErr) throw fallbackErr;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Application submission error:', err);
      setError('Failed to submit application: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Apply for Opportunity
            </h2>
            <span style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
              PATHEW Portal
            </span>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: '6px 0 0 0', fontWeight: 500 }}>
            {opportunityTitle}
          </p>
        </div>

        {!isInline && onClose && (
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-muted)', 
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Auto-fill from Profile Action Card */}
      {profile && (
        <div style={{ padding: '14px 18px', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {(profile.full_name || 'U').charAt(0)}
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {profile.full_name || 'Your PATHEW Profile'}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {profile.portfolio_url ? 'Portfolio URL attached' : 'Attach your profile details & links'}
              </p>
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleAutoFillProfile}
            style={{ gap: '6px', fontSize: '0.8125rem', borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--accent-primary)' }}
          >
            {profileAttached ? <UserCheck size={16} color="#22c55e" /> : <Sparkles size={15} />}
            {profileAttached ? 'Profile Details Attached' : 'Auto-fill from Profile'}
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SECTION 1: Attach CV / Upload Resume */}
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
          <label style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--text-primary)' }}>
            <FileText size={18} color="var(--accent-primary)" />
            1. Attach CV / Resume File <span style={{ color: '#ef4444' }}>*</span>
          </label>

          {/* Option A: Drag & Drop / Upload CV File */}
          <div style={{ marginBottom: '18px' }}>
            <div 
              onClick={() => cvInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOverCv(true); }}
              onDragLeave={() => setIsDragOverCv(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDragOverCv(false);
                if (e.dataTransfer.files?.[0]) await processCvFile(e.dataTransfer.files[0]);
              }}
              style={{
                padding: '20px',
                border: isDragOverCv ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-color)',
                backgroundColor: isDragOverCv ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-primary)',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={handleCvFileChange}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                {uploadingCv ? (
                  <Loader2 size={28} className="animate-spin" color="var(--accent-primary)" />
                ) : cvFileName ? (
                  <FileCheck size={28} color="#22c55e" />
                ) : (
                  <Upload size={28} color="var(--accent-primary)" />
                )}

                <div>
                  {uploadingCv ? (
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.9375rem' }}>Uploading CV File...</p>
                  ) : cvFileName ? (
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#22c55e', fontSize: '0.9375rem' }}>
                        ✓ {cvFileName} {cvFileSize && `(${formatFileSize(cvFileSize)})`}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click or drag to change CV file</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                        Click to Upload CV or Drag & Drop File
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Supports PDF, DOCX, DOC, TXT
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Option B: Choose from PATHEW Saved Documents */}
          {userDocs.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Or attach from your PATHEW Saved CVs:
              </label>
              <select
                value={selectedDocId}
                onChange={e => handleSelectPathewDoc(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem' }}
              >
                <option value="">-- Select Saved PATHEW CV --</option>
                {userDocs.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    📄 {doc.title} ({doc.document_type || 'CV'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Option C: External CV URL / Resume Text */}
          <div>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Or Google Drive / Cloud CV Link / Paste Text:
            </label>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <LinkIcon size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/your-cv..."
                value={resumeUrl}
                onChange={e => setResumeUrl(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 38px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem' }}
              />
            </div>
            <textarea
              rows={3}
              placeholder="Or paste your CV / resume text here..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* SECTION 2: Proposal / Cover Letter */}
        <div>
          <label style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-primary)' }}>
            <span>2. Proposal / Cover Letter <span style={{ color: '#ef4444' }}>*</span></span>
          </label>
          <textarea
            rows={5}
            placeholder="Introduce yourself, explain why you are a great fit for this opportunity, and highlight your relevant experience..."
            value={proposalLetter}
            onChange={e => setProposalLetter(e.target.value)}
            required
            style={{ width: '100%', padding: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.875rem', resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {/* SECTION 3: Media Portfolio Uploads (Pictures, Videos, Audio, Files) */}
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Paperclip size={18} color="var(--accent-primary)" />
              3. Upload Media Portfolio (Pictures, Videos & Work Samples)
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
              Supports All Formats
            </span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
            Attach design portfolios, pictures (PNG/JPG), video introductions/demos (MP4/WEBM/MOV), audio recordings, or PDFs.
          </p>

          {/* Media Upload Dropzone */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragOverMedia(true); }}
            onDragLeave={() => setIsDragOverMedia(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragOverMedia(false);
              if (e.dataTransfer.files) await processMediaFiles(e.dataTransfer.files);
            }}
            style={{
              padding: '16px',
              border: isDragOverMedia ? '2px dashed var(--accent-primary)' : '1px dashed var(--border-color)',
              backgroundColor: isDragOverMedia ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-primary)',
              borderRadius: '10px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Film size={20} color="#3b82f6" />
                <ImageIcon size={20} color="#22c55e" />
                <Music size={20} color="#ec4899" />
                <FileText size={20} color="#f59e0b" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Upload Videos, Pictures, Audio or Documents
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  MP4, WEBM, MOV, PNG, JPG, WEBP, PDF, etc.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              style={{
                padding: '9px 16px',
                backgroundColor: 'var(--accent-primary)',
                color: '#000',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              {uploadingMedia ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {uploadingMedia ? 'Uploading...' : '+ Attach Media Files'}
            </button>
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.zip"
              multiple
              onChange={handleMediaUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Interactive Previews for Uploaded Media (Videos, Pictures, Audio, Files) */}
          {mediaFiles.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Attached Media Previews ({mediaFiles.length}):
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '12px' }}>
                {mediaFiles.map((m) => (
                  <div 
                    key={m.id} 
                    style={{ 
                      position: 'relative', 
                      padding: '12px', 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    {/* Media Type Specific Interactive Preview */}
                    {m.type === 'video' ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Film size={14} color="#3b82f6" />
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>
                            Video ({m.format})
                          </span>
                        </div>
                        <video 
                          src={m.url} 
                          controls 
                          preload="metadata"
                          style={{ width: '100%', height: '120px', borderRadius: '6px', backgroundColor: '#000', objectFit: 'cover' }}
                        />
                      </div>
                    ) : m.type === 'image' ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <ImageIcon size={14} color="#22c55e" />
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase' }}>
                            Picture ({m.format})
                          </span>
                        </div>
                        <img 
                          src={m.url} 
                          alt={m.name} 
                          onClick={() => setPreviewMediaUrl({ url: m.url, type: 'image', title: m.name })}
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }}
                        />
                      </div>
                    ) : m.type === 'audio' ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Music size={14} color="#ec4899" />
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ec4899', textTransform: 'uppercase' }}>
                            Audio ({m.format})
                          </span>
                        </div>
                        <audio src={m.url} controls style={{ width: '100%', marginTop: '8px' }} />
                      </div>
                    ) : (
                      <div style={{ padding: '12px 6px', textAlign: 'center' }}>
                        <FileText size={32} color="var(--accent-primary)" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                          Document ({m.format})
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, flex: 1 }} title={m.name}>
                        {m.name}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removeMedia(m.id)} 
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                        title="Remove file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Portfolio Link Field */}
          <div>
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Or Portfolio / Profile Web Link (Behance, GitHub, Personal Site, LinkedIn):
            </label>
            <div style={{ position: 'relative' }}>
              <Globe size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="url"
                placeholder="https://behance.net/your-profile or https://github.com/..."
                value={portfolioUrl}
                onChange={e => setPortfolioUrl(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 38px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          {!isInline && onClose && (
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading || (!resumeUrl && !resumeText && !cvFileUrl) || !proposalLetter} 
            style={{ gap: '8px', padding: '12px 24px', fontSize: '0.9375rem', fontWeight: 700 }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </Button>
        </div>
      </form>

      {/* Lightbox Modal for Image Preview */}
      {previewMediaUrl && (
        <div 
          onClick={() => setPreviewMediaUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={previewMediaUrl.url} alt={previewMediaUrl.title} style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain' }} />
            <p style={{ color: '#fff', textAlign: 'center', marginTop: '8px', fontSize: '0.875rem' }}>{previewMediaUrl.title}</p>
          </div>
        </div>
      )}
    </div>
  );

  if (isInline) {
    return (
      <div id="application-form-section" style={{ padding: '28px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '18px', marginTop: '32px' }}>
        {formContent}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px 20px',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '780px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        padding: '32px'
      }}>
        {formContent}
      </div>
    </div>
  );
};


