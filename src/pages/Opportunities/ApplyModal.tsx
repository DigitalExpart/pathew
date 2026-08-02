import React, { useState } from 'react';
import { X, UploadCloud, Link as LinkIcon, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface ApplyModalProps {
  opportunityId: string;
  opportunityTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({ opportunityId, opportunityTitle, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [proposalLetter, setProposalLetter] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // Check if user already applied
      const { data: existingApp, error: existingErr } = await supabase
        .from('opportunity_applications')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .eq('applicant_id', user.id)
        .single();

      if (existingApp) {
        setError('You have already applied for this opportunity.');
        setLoading(false);
        return;
      }

      const { error: insertErr } = await supabase.from('opportunity_applications').insert({
        opportunity_id: opportunityId,
        applicant_id: user.id,
        resume_text: resumeText,
        resume_url: resumeUrl,
        proposal_letter: proposalLetter,
        portfolio_url: portfolioUrl,
        status: 'pending'
      });

      if (insertErr) throw insertErr;

      onSuccess();
    } catch (err: any) {
      console.error('Application submission error:', err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Apply for Opportunity</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{opportunityTitle}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Resume / CV Link</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="url"
                  placeholder="Link to Google Drive, Dropbox, or Portfolio"
                  value={resumeUrl}
                  onChange={e => setResumeUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px 10px 10px 40px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>OR PASTE RESUME TEXT</span>
             <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          </div>

          <div>
             <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Paste Resume Text</label>
             <textarea
                rows={6}
                placeholder="Paste your resume text here..."
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical' }}
             />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Proposal / Cover Letter</label>
            <textarea
              rows={5}
              placeholder="Why are you a great fit for this opportunity?"
              value={proposalLetter}
              onChange={e => setProposalLetter(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Portfolio URL (Optional)</label>
            <div style={{ position: 'relative' }}>
               <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
               <input
                 type="url"
                 placeholder="https://..."
                 value={portfolioUrl}
                 onChange={e => setPortfolioUrl(e.target.value)}
                 style={{ width: '100%', padding: '10px 10px 10px 40px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
               />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || (!resumeUrl && !resumeText) || !proposalLetter} style={{ gap: '8px' }}>
              <Send size={18} />
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
