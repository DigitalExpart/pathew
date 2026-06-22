import React, { useState, useMemo } from 'react';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Predefined professional gradient accents for section headers
  const ACCENT_COLORS = useMemo(() => [
    { name: 'Gold', start: '#D69E2E', end: '#ECC94B', border: 'D69E2E' }, // Default
    { name: 'Blue', start: '#2563EB', end: '#60A5FA', border: '2563EB' }, // Royal Blue
    { name: 'Red', start: '#DC2626', end: '#F87171', border: 'DC2626' }, // Crimson Red
    { name: 'Green', start: '#059669', end: '#34D399', border: '059669' }, // Emerald
    { name: 'Indigo', start: '#4F46E5', end: '#818CF8', border: '4F46E5' }, // Indigo
    { name: 'Purple', start: '#7C3AED', end: '#A78BFA', border: '7C3AED' }, // Purple
    { name: 'Cyan', start: '#0891B2', end: '#22D3EE', border: '0891B2' }, // Cyan
    { name: 'Slate', start: '#475569', end: '#94A3B8', border: '475569' }, // Gray
    { name: 'Black', start: '#0F172A', end: '#334155', border: '0F172A' }, // Slate Black
    { name: 'Yellow', start: '#EAB308', end: '#FDE047', border: 'EAB308' }, // Yellow
    { name: 'Teal', start: '#0D9488', end: '#2DD4BF', border: '0D9488' }, // Teal
    { name: 'Maroon', start: '#9F1239', end: '#E11D48', border: '9F1239' }, // Maroon/Rose
    { name: 'Navy', start: '#1E3A8A', end: '#3B82F6', border: '1E3A8A' }, // Navy Blue
    { name: 'Orange', start: '#EA580C', end: '#FB923C', border: 'EA580C' }, // Bright Orange
  ], []);

  // Pick an accent color based on the current version number, so it changes for every generation!
  const accentColor = useMemo(() => {
    const versionNum = currentVersionNumber || 1;
    // We use versionNum - 1 so version 1 gets the first color, version 2 gets the second, etc.
    const index = (versionNum - 1) % ACCENT_COLORS.length;
    return ACCENT_COLORS[index];
  }, [currentVersionNumber, ACCENT_COLORS]);

  // Dynamic HR style
  const dynamicSectionHrStyle: React.CSSProperties = {
    ...pvSectionHrStyle,
    background: `linear-gradient(90deg, ${accentColor.start}, ${accentColor.end})`,
  };

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
        const blob = await generateDocxBlob(draftContent, accentColor.border, documentType);
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

  const pages = useMemo(() => paginateMarkdown(draftContent, Math.max(1, estimatedPages)), [draftContent, estimatedPages]);
  const validCurrentPage = Math.min(currentPage, pages.length - 1);
  const pageContent = pages[validCurrentPage];


  const headerActions = (
    <div style={{...headerStyle, ...(isMobile ? { marginBottom: '24px' } : {})}}>
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
  );

  return (
    <div style={containerStyle}>
      {/* Render header at top on desktop */}
      {!isMobile && headerActions}

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

        {/* Render header after editor on mobile */}
        {isMobile && headerActions}

        {/* Right Side: Professional A4 Print Preview */}
        <div style={previewColumnStyle}>
          <div style={previewLabelStyle}>{t('builders.editor.simulatedPreview', 'Simulated A4 Preview')}</div>
          <div style={a4PaperContainerStyle}>
            <div style={a4SheetStyle}>
              <div className="a4-preview-content" style={paperBodyStyle}>
                {!pageContent ? (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Drafting document...</p>
                ) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      // H1 = Full Name (large, centered, uppercase)
                      // H1 = Full Name OR Professional Title (if it was accidentally generated as h1)
                      h1: ({node, children, ...props}) => {
                        const text = extractText(children);
                        if (text.includes('|') || text.length > 50) {
                          return <h2 style={pvTitleStyle} {...props}>{children}</h2>;
                        }
                        return <h1 style={pvNameStyle} {...props}>{children}</h1>;
                      },
                      // H2 = Professional Title (centered subtitle)
                      h2: ({node, children, ...props}) => {
                        const text = extractText(children);
                        // If it's all caps and short, it might be a section header instead
                        if (text === text.toUpperCase() && text.length < 50 && !text.includes('|')) {
                          return (
                            <div style={pvSectionHeaderWrapStyle}>
                              <h2 style={pvSectionHeaderStyle} {...props}>{children}</h2>
                              <div style={dynamicSectionHrStyle} />
                            </div>
                          );
                        }
                        return <h2 style={pvTitleStyle} {...props}>{children}</h2>;
                      },
                      // H3 = Contact info line (centered, small, pipe-separated)
                      h3: ({node, ...props}) => (
                        <h3 style={pvContactStyle} {...props} />
                      ),
                      // H4 = Section headers (PROFESSIONAL SUMMARY, CORE SKILLS, etc.)
                      h4: ({node, ...props}) => (
                        <div style={pvSectionHeaderWrapStyle}>
                          <h4 style={pvSectionHeaderStyle} {...props} />
                          <div style={dynamicSectionHrStyle} />
                        </div>
                      ),
                      // H5 = Sub-section or experience entry title
                      h5: ({node, ...props}) => (
                        <h5 style={pvSubSectionStyle} {...props} />
                      ),
                      // H6 = Minor label
                      h6: ({node, ...props}) => (
                        <h6 style={pvMinorLabelStyle} {...props} />
                      ),
                      // Horizontal rule = gold divider
                      hr: () => <div style={dynamicSectionHrStyle} />,
                      // Paragraphs with experience-row detection
                      // Paragraphs with experience-row detection and section header fallback
                      p: ({node, children, ...props}) => {
                        const text = extractText(children);
                        // Fallback: If paragraph is ALL CAPS and short, treat it as a Section Header
                        if (text === text.toUpperCase() && text.length > 3 && text.length < 50 && /[A-Z]/.test(text) && !text.includes('|')) {
                          return (
                            <div style={pvSectionHeaderWrapStyle}>
                              <h4 style={pvSectionHeaderStyle} {...props}>{children}</h4>
                              <div style={dynamicSectionHrStyle} />
                            </div>
                          );
                        }
                        // Detect experience entry rows: contains | and a date pattern
                        const datePattern = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})\s*[-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4}|Present|Current)/i;
                        if (text.includes('|') && datePattern.test(text)) {
                          return renderExperienceRow(text, accentColor);
                        }
                        return <p style={pvParaStyle} {...props}>{children}</p>;
                      },
                      // List items
                      li: ({node, children, ...props}) => (
                        <li style={pvListItemStyle} {...props}>{children}</li>
                      ),
                      ul: ({node, ...props}) => (
                        <ul style={pvUlStyle} {...props} />
                      ),
                      ol: ({node, ...props}) => (
                        <ol style={pvOlStyle} {...props} />
                      ),
                      // Tables (skills grid)
                      table: ({node, ...props}) => (
                        <table style={pvTableStyle} {...props} />
                      ),
                      thead: ({node, ...props}) => (
                        <thead style={{ display: 'none' }} {...props} />
                      ),
                      tbody: ({node, ...props}) => (
                        <tbody {...props} />
                      ),
                      tr: ({node, ...props}) => (
                        <tr style={pvTableRowStyle} {...props} />
                      ),
                      th: ({node, ...props}) => (
                        <th style={pvTableCellStyle} {...props} />
                      ),
                      td: ({node, ...props}) => (
                        <td style={pvTableCellStyle} {...props} />
                      ),
                      // Strong / Bold
                      strong: ({node, ...props}) => (
                        <strong style={{ fontWeight: 700, color: '#1e293b' }} {...props} />
                      ),
                      // Emphasis / Italic
                      em: ({node, ...props}) => (
                        <em style={{ fontStyle: 'italic', color: '#475569' }} {...props} />
                      ),
                      // Links
                      a: ({node, ...props}) => (
                        <a style={{ color: '#2563eb', textDecoration: 'none' }} {...props} />
                      ),
                      // Images
                      img: ({node, ...props}) => (
                        <img style={{ maxWidth: '100%', height: 'auto' }} {...props} />
                      ),
                    }}
                  >
                    {pageContent.replace(/^[\p{Pd}*+•]\s+/gmu, '- ')}
                  </ReactMarkdown>
                )}
              </div>

              {/* Page Footer */}
              <div style={paperFooterStyle}>
                <span />
                <span style={pageCounterStyle}>Page {validCurrentPage + 1} / {pages.length}</span>
              </div>
            </div>
          </div>
          
          {/* Pagination Controls */}
          {pages.length > 1 && (
            <div style={paginationRowStyle}>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={validCurrentPage === 0}
              >
                {t('builders.editor.previous', 'Previous')}
              </Button>
              <span style={paginationLabelStyle}>
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
          )}
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

// ============================================================
// HELPER: Extract text from React children for pattern detection
// ============================================================
const extractText = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    if (props.children) {
      return extractText(props.children);
    }
  }
  return '';
};

// ============================================================
// HELPER: Render experience entry row with right-aligned dates
// ============================================================
const renderExperienceRow = (text: string, accentColor: { start: string, end: string }): React.ReactNode => {
  // Split on pipe to find segments
  const parts = text.split('|').map(p => p.trim());
  
  // Try to find the date part
  const datePattern = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})\s*[-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4}|Present|Current)/i;
  
  let leftParts: string[] = [];
  let rightParts: string[] = [];
  let foundDate = false;
  
  for (const part of parts) {
    if (!foundDate && datePattern.test(part)) {
      foundDate = true;
      rightParts.push(part);
    } else if (foundDate) {
      rightParts.push(part);
    } else {
      leftParts.push(part);
    }
  }
  
  const leftText = leftParts.join('  |  ');
  const rightText = rightParts.join('  •  ');
  
  return (
    <div style={pvExpRowStyle}>
      <div style={pvExpLeftStyle}>
        {renderInlineBold(leftText)}
      </div>
      <div style={{ ...pvExpRightStyle, color: accentColor.start }}>
        {rightText}
      </div>
    </div>
  );
};

// ============================================================
// HELPER: Render inline bold markers **text** in JSX
// ============================================================
const renderInlineBold = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700, color: '#1e293b' }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

// ============================================================
// SMART PAGINATION: Section-aware page splitting
// ============================================================
const paginateMarkdown = (content: string, maxPages: number): string[] => {
  if (!content) return [''];
  if (maxPages <= 1) return [content];
  
  // Split content into logical sections based on ## headers or ALL-CAPS lines
  const lines = content.split('\n');
  const sections: string[][] = [];
  let currentSection: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    const isHeader = trimmed.startsWith('## ') || trimmed.startsWith('### ') || trimmed.startsWith('#### ');
    const isAllCaps = trimmed.length > 3 && trimmed.length < 60 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && !trimmed.includes('|');
    
    if ((isHeader || isAllCaps) && currentSection.length > 0) {
      sections.push(currentSection);
      currentSection = [line];
    } else {
      currentSection.push(line);
    }
  }
  if (currentSection.length > 0) {
    sections.push(currentSection);
  }
  
  // Estimate lines per page: ~42 effective content lines per A4 page at our font size
  const LINES_PER_PAGE = 42;
  const totalEstimatedLines = sections.reduce((sum, sec) => {
    return sum + sec.reduce((lineCount, line) => {
      const trimmed = line.trim();
      if (!trimmed) return lineCount + 0.5; // blank lines are half
      // Long lines wrap: estimate ~80 chars per visual line
      return lineCount + Math.max(1, Math.ceil(trimmed.length / 80));
    }, 0);
  }, 0);
  
  const targetLinesPerPage = Math.max(LINES_PER_PAGE, Math.ceil(totalEstimatedLines / maxPages));
  
  const pages: string[] = [];
  let currentPageSections: string[][] = [];
  let currentPageLines = 0;
  
  for (const section of sections) {
    const sectionLines = section.reduce((count, line) => {
      const trimmed = line.trim();
      if (!trimmed) return count + 0.5;
      return count + Math.max(1, Math.ceil(trimmed.length / 80));
    }, 0);
    
    // If adding this section would exceed the page target and we have content,
    // AND we haven't reached the last page yet, start a new page
    if (currentPageLines + sectionLines > targetLinesPerPage * 1.15 
        && currentPageSections.length > 0 
        && pages.length < maxPages - 1) {
      pages.push(currentPageSections.flat().join('\n'));
      currentPageSections = [section];
      currentPageLines = sectionLines;
    } else {
      currentPageSections.push(section);
      currentPageLines += sectionLines;
    }
  }
  
  // Push remaining content
  if (currentPageSections.length > 0) {
    pages.push(currentPageSections.flat().join('\n'));
  }
  
  return pages.length > 0 ? pages.slice(0, maxPages) : [''];
};

// ============================================================
// STYLES: Container, Header, Editor, AI Box
// ============================================================

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

// ============================================================
// STYLES: A4 Preview Container & Paper
// ============================================================

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
  backgroundColor: '#e2e8f0',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  maxHeight: '840px',
  overflowY: 'auto',
};

const a4SheetStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#1e293b',
  width: '100%',
  maxWidth: '595px',
  minHeight: '842px',
  height: 'max-content',
  borderRadius: '2px',
  padding: '48px 40px 32px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Inter', 'Segoe UI', -apple-system, Arial, sans-serif",
};

const paperBodyStyle: React.CSSProperties = {
  flex: '1 0 auto',
  fontSize: '0.78rem',
  lineHeight: '1.55',
  color: '#334155',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
};

const paperFooterStyle: React.CSSProperties = {
  marginTop: 'auto',
  paddingTop: '16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.6rem',
  color: '#94a3b8',
};

const pageCounterStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  color: '#ffffff',
  padding: '3px 10px',
  borderRadius: '4px',
  fontSize: '0.6rem',
  fontWeight: 700,
};

const paginationRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  marginTop: '12px',
  alignItems: 'center',
};

const paginationLabelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--text-muted)',
};

// ============================================================
// STYLES: Preview Content Renderers
// ============================================================

// H1 = Full Name
const pvNameStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 800,
  color: '#0f172a',
  textAlign: 'center',
  margin: '0 0 2px 0',
  padding: 0,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
};

// H2 = Professional Title
const pvTitleStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#334155',
  textAlign: 'center',
  margin: '0 0 4px 0',
  padding: 0,
  lineHeight: 1.3,
};

// H3 = Contact Info Row
const pvContactStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 600,
  color: '#64748b',
  textAlign: 'center',
  margin: '0 0 20px 0',
  padding: '0 0 14px 0',
  borderBottom: '1.5px solid #e2e8f0',
  lineHeight: 1.4,
  letterSpacing: '0.01em',
};

// Section Header Wrapper
const pvSectionHeaderWrapStyle: React.CSSProperties = {
  marginTop: '18px',
  marginBottom: '10px',
};

// H4 = Section Header (PROFESSIONAL SUMMARY, CORE SKILLS, etc.)
const pvSectionHeaderStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 800,
  color: '#0f172a',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 6px 0',
  padding: 0,
  lineHeight: 1.2,
};

// Gold HR divider under section headers
const pvSectionHrStyle: React.CSSProperties = {
  height: '2px',
  background: 'linear-gradient(90deg, #D69E2E, #ECC94B)',
  borderRadius: '1px',
  margin: '0 0 10px 0',
};

// H5 = Sub-section header
const pvSubSectionStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#1e293b',
  margin: '10px 0 4px 0',
  padding: 0,
  lineHeight: 1.3,
};

// H6 = Minor label
const pvMinorLabelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 600,
  color: '#475569',
  margin: '6px 0 2px 0',
  padding: 0,
  lineHeight: 1.3,
};

// Paragraph
const pvParaStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  lineHeight: 1.55,
  fontSize: '0.78rem',
  color: '#334155',
  textAlign: 'left',
};

// Unordered list
const pvUlStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  paddingLeft: '24px',
  listStyleType: "disc",
};

// Ordered list
const pvOlStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  paddingLeft: '18px',
};

// List item
const pvListItemStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  lineHeight: 1.6,
  color: '#334155',
  marginBottom: '4px',
  paddingLeft: '4px',
};

// Experience entry row
const pvExpRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: '12px',
  margin: '10px 0 4px 0',
  flexWrap: 'wrap',
};

const pvExpLeftStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#1e293b',
  flex: '1 1 auto',
  lineHeight: 1.4,
};

const pvExpRightStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 500,
  color: '#64748b',
  textAlign: 'right',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  lineHeight: 1.4,
};

// Skills Table (Grid)
const pvTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: '4px',
  tableLayout: 'fixed',
  margin: '4px 0 12px 0',
};

const pvTableRowStyle: React.CSSProperties = {};

const pvTableCellStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '4px',
  padding: '5px 8px',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: '#334155',
  textAlign: 'center',
  verticalAlign: 'middle',
  overflowWrap: 'break-word',
  wordWrap: 'break-word',
};
