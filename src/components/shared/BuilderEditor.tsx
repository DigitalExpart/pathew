import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Sparkles, 
  Download, 
  Check, 
  Copy, 
  History
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useTranslation } from 'react-i18next';
import { ExportModal } from '../ui/ExportModal';
import { generateDocxBlob } from '../../utils/docxExport';

interface BuilderEditorProps {
  draftContent: string;
  onChangeContent: (content: string) => void;
  onRegenerate: (instructions: string) => Promise<void>;
  onSaveVersion: (title: string) => Promise<any>;
  savedVersions: any[];
  currentVersionNumber: number;
  onSelectVersion: (ver: any) => void;
  isLoading: boolean;
  documentType: string;
  estimatedPages?: number;
}

export const BuilderEditor: React.FC<BuilderEditorProps> = ({
  draftContent,
  onChangeContent,
  onRegenerate,
  onSaveVersion,
  savedVersions = [],
  currentVersionNumber,
  onSelectVersion,
  isLoading,
  documentType,
  estimatedPages = 1,
}) => {
  const { t } = useTranslation();
  const [instruction, setInstruction] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [savingVersion, setSavingVersion] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const handleCopy = () => {
    navigator.clipboard.writeText(draftContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;
    setSavingVersion(true);
    try {
      await onSaveVersion(saveTitle.trim());
      setSaveTitle('');
      alert('Draft version saved successfully!');
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingVersion(false);
    }
  };

  const handleDownload = async (format: string) => {
    try {
      if (format === 'docx') {
        const blob = await generateDocxBlob(draftContent);
        const element = document.createElement('a');
        element.href = URL.createObjectURL(blob);
        element.download = `${documentType.replace(/\s+/g, '_')}_Version_${currentVersionNumber}.docx`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        setIsExportOpen(false);
        return;
      }
      // Generate simulated download for pdf/txt fallback
      const element = document.createElement('a');
      const file = new Blob([draftContent], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${documentType.replace(/\s+/g, '_')}_Version_${currentVersionNumber}.${format === 'pdf' ? 'txt' : 'docx'}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setIsExportOpen(false);
    } catch (err) {
      console.error('Error generating document:', err);
      alert('Failed to generate the document. Please try again.');
    }
  };

  return (
    <div style={containerStyle}>
      {/* Dynamic Header actions */}
      <div style={headerStyle}>
        <div style={versionBadgeRowStyle}>
          <History size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 650 }}>{t('builders.editor.versionHistory', 'Version History')}</span>
          <select 
            value={currentVersionNumber}
            onChange={(e) => {
              const selectedVer = savedVersions.find(v => v.version === Number(e.target.value));
              if (selectedVer) onSelectVersion(selectedVer);
            }}
            style={versionSelectStyle}
          >
            {savedVersions.length > 0 ? (
              savedVersions.map((v) => (
                <option key={v.id} value={v.version}>
                  Version {v.version} ({v.title})
                </option>
              ))
            ) : (
              <option value="1">Version 1 (Active)</option>
            )}
          </select>
        </div>

        <div style={actionRowStyle}>
          <Button variant="outline" size="sm" onClick={handleCopy} style={{ gap: '8px' }}>
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Text'}
          </Button>
          <Button size="sm" onClick={() => setIsExportOpen(true)} style={{ gap: '8px' }}>
            <Download size={16} /> Export Document
          </Button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div style={workspaceGridStyle}>
        
        {/* Left Side: Markdown Editor + Inline AI Assistant */}
        <div style={editorColumnStyle}>
          <Card style={editorCardStyle}>
            <div style={columnHeaderStyle}>
              <span style={colTitleLabelStyle}>{t('builders.editor.liveEditor', 'Live Editor')}</span>
              <Badge variant="outline">{t('builders.editor.textMode', 'Text Mode')}</Badge>
            </div>
            
            <textarea 
              value={draftContent}
              onChange={(e) => onChangeContent(e.target.value)}
              style={textareaInputStyle}
              placeholder="Edit your document here..."
              disabled={isLoading}
            />

            {/* Save new version */}
            <form onSubmit={handleSaveSubmit} style={saveVersionFormStyle}>
              <input 
                type="text"
                placeholder="e.g. Added metrics, or In UK English"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                style={versionInputStyle}
                required
              />
              <Button type="submit" variant="secondary" size="sm" disabled={savingVersion || !draftContent}>
                {savingVersion ? t('builders.editor.saving', 'Saving...') : t('builders.editor.saveNewVersion', 'Save New Version')}
              </Button>
            </form>
          </Card>

          {/* Inline AI Instruct Drawer */}
          <Card style={aiBoxStyle}>
            <div style={aiBoxHeaderStyle}>
              <Sparkles size={16} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t('builders.editor.tailorAssistant', 'Tailor this section with Pathew Assistant')}</span>
            </div>
            <textarea 
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={t('builders.editor.rewritePlaceholder', 'e.g. Shorten the summary paragraph, or Write in the first person, or Highlight Next.js metrics...')}
              style={aiInputStyle}
              disabled={isLoading}
            />
            <div style={aiBoxFooterStyle}>
              <Button 
                onClick={async () => {
                  if (!instruction.trim()) return;
                  await onRegenerate(instruction);
                  setInstruction('');
                }} 
                disabled={isLoading || !instruction.trim()}
                size="sm"
                style={{ gap: '8px' }}
              >
                <Sparkles size={14} fill="currentColor" />
                {isLoading ? t('builders.editor.tailoring', 'Tailoring Draft...') : t('builders.editor.rewriteSection', 'Rewrite Section')}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Side: simulated A4 Print Preview Sheet */}
        <div style={previewColumnStyle}>
          <div style={previewLabelStyle}>{t('builders.editor.simulatedPreview', 'Simulated A4 Preview')}</div>
          <div style={a4PaperContainerStyle}>
            {(() => {
              const pages = paginateMarkdown(draftContent, Math.max(1, estimatedPages));
              const validCurrentPage = Math.min(currentPage, pages.length - 1);
              const pageContent = pages[validCurrentPage];
              
              return (
                <div style={{
                  ...a4SheetStyle,
                  minHeight: '1123px',
                  marginBottom: '0'
                }}>
                  {/* Cover Letter Header elements - Only on first page */}
                  {validCurrentPage === 0 && (
                    <div style={letterheadStyle}>
                      <div style={letterheadLogoStyle}>P</div>
                    </div>
                  )}
                  
                  <div className="a4-preview-content" style={paperBodyStyle}>
                    {!pageContent ? (
                      <p style={{ color: 'var(--text-muted)' }}>Drafting document...</p>
                    ) : (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          h1: ({node, ...props}) => <h2 style={previewH1Style} {...props} />,
                          h2: ({node, ...props}) => <h3 style={previewH2Style} {...props} />,
                          h3: ({node, ...props}) => <h4 style={previewH3Style} {...props} />,
                          li: ({node, ...props}) => <li style={previewLiStyle} {...props} />,
                          p: ({node, ...props}) => <p style={previewParaStyle} {...props} />,
                          hr: () => null,
                          table: ({node, ...props}) => <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginBottom: '16px' }} {...props} />,
                          th: ({node, ...props}) => <th style={{ borderBottom: '2px solid #e2e8f0', padding: '8px 4px', textAlign: 'left', overflowWrap: 'break-word', wordWrap: 'break-word' }} {...props} />,
                          td: ({node, ...props}) => <td style={{ padding: '8px 4px', verticalAlign: 'top', overflowWrap: 'break-word', wordWrap: 'break-word' }} {...props} />,
                          img: ({node, ...props}) => <img style={{ maxWidth: '100%', height: 'auto' }} {...props} />
                        }}
                      >
                        {pageContent}
                      </ReactMarkdown>
                    )}
                  </div>

                  {/* Watermark/Footer */}
                  <div style={paperFooterStyle}>
                    <span>Powered by Pathew Assistant</span>
                    <span>Page {validCurrentPage + 1} of {pages.length}</span>
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* Pagination Controls */}
          {(() => {
            const pages = paginateMarkdown(draftContent, Math.max(1, estimatedPages));
            if (pages.length <= 1) return null;
            const validCurrentPage = Math.min(currentPage, pages.length - 1);
            return (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={validCurrentPage === 0}
                >
                  {t('builders.editor.previous', 'Previous')}
                </Button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {t('builders.editor.pageOf', 'Page {{current}} of {{total}}', { current: validCurrentPage + 1, total: pages.length })}
                </span>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(pages.length - 1, prev + 1))}
                  disabled={validCurrentPage >= pages.length - 1}
                >
                  {t('builders.editor.next', 'Next')}
                </Button>
              </div>
            );
          })()}
        </div>

      </div>

      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        onDownload={handleDownload} 
      />
    </div>
  );
};

const paginateMarkdown = (content: string, maxPages: number): string[] => {
  if (!content) return [''];
  if (maxPages <= 1) return [content];
  
  const blocks = content.split(/\n\n+/);
  const totalLength = content.length;
  const targetCharsPerPage = Math.ceil(totalLength / maxPages);
  
  const pages: string[] = [];
  let currentPage: string[] = [];
  let currentChars = 0;
  
  for (const block of blocks) {
    if (currentChars + block.length > targetCharsPerPage * 1.2 && pages.length < maxPages - 1) {
      pages.push(currentPage.join('\n\n'));
      currentPage = [block];
      currentChars = block.length;
    } else {
      currentPage.push(block);
      currentChars += block.length;
    }
  }
  
  if (currentPage.length > 0) {
    pages.push(currentPage.join('\n\n'));
  }
  
  return pages.slice(0, maxPages);
};

const containerStyle: React.CSSProperties = {
  marginTop: '24px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
  marginBottom: '20px',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '16px',
};

const versionBadgeRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const versionSelectStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  padding: '6px 12px',
  fontSize: '0.8rem',
  cursor: 'pointer',
  outline: 'none',
};

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const workspaceGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: '24px',
};

const editorColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const editorCardStyle: React.CSSProperties = {
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  height: '420px',
};

const columnHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
};

const colTitleLabelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
};

const textareaInputStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--text-primary)',
  padding: '16px',
  fontSize: '0.9rem',
  lineHeight: '1.5',
  height: '100%',
  outline: 'none',
  resize: 'none',
  fontFamily: 'monospace',
};

const saveVersionFormStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginTop: '12px',
};

const versionInputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  padding: '6px 12px',
  fontSize: '0.8rem',
  outline: 'none',
};

const aiBoxStyle: React.CSSProperties = {
  padding: '16px',
  borderColor: 'rgba(99,102,241,0.2)',
  backgroundColor: 'rgba(99,102,241,0.02)',
};

const aiBoxHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '10px',
};

const aiInputStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  padding: '10px',
  fontSize: '0.8rem',
  height: '60px',
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
  resize: 'none',
};

const aiBoxFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '10px',
};

const previewColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const previewLabelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
};

const a4PaperContainerStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-xl)',
  padding: '24px',
  display: 'flex',
  justifyContent: 'center',
  maxHeight: '660px',
  overflowY: 'auto',
};

const a4SheetStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#1e293b',
  width: '100%',
  maxWidth: '520px',
  minHeight: '700px',
  borderRadius: '4px',
  padding: '40px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
  display: 'flex',
  flexDirection: 'column',
};

const letterheadStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '2px solid #e2e8f0',
  paddingBottom: '16px',
  marginBottom: '28px',
};

const letterheadLogoStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  backgroundColor: '#6366f1',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: '1.1rem',
};


const paperBodyStyle: React.CSSProperties = {
  flex: '1 0 auto',
  fontSize: '0.825rem',
  lineHeight: '1.6',
  color: '#334155',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
};

const paperFooterStyle: React.CSSProperties = {
  marginTop: 'auto',
  borderTop: '1px solid #f1f5f9',
  paddingTop: '12px',
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.625rem',
  color: '#94a3b8',
};

// Simulated markdown headings and spacing
const previewH1Style: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 800,
  color: '#0f172a',
  marginTop: '16px',
  marginBottom: '8px',
  paddingBottom: '4px',
  textAlign: 'center',
};

const previewH2Style: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 700,
  color: '#1e293b',
  marginTop: '14px',
  marginBottom: '6px',
  borderBottom: '2px solid #D69E2E',
  paddingBottom: '2px',
};

const previewH3Style: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 650,
  color: '#334155',
  marginTop: '10px',
  marginBottom: '4px',
};

const previewParaStyle: React.CSSProperties = {
  marginBottom: '10px',
  textAlign: 'left',
};

const previewLiStyle: React.CSSProperties = {
  marginLeft: '16px',
  listStyleType: 'disc',
  marginBottom: '4px',
};
