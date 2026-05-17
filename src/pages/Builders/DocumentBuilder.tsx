import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { 
  Download, 
  Eye, 
  Type, 
  Bold, 
  Italic, 
  List, 
  Save,
  CheckCircle,
  FileDown,
  Sparkles
} from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';
import { useTranslation } from 'react-i18next';

interface DocumentBuilderProps {
  type: 'CV' | 'Cover Letter' | 'Proposal';
  initialTitle: string;
  initialContent: string;
}

export const DocumentBuilder: React.FC<DocumentBuilderProps> = ({ 
  type, 
  initialTitle, 
  initialContent 
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaved, setIsSaved] = useState(false);
  const { openAssistant } = useAssistant();
  const { t } = useTranslation();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const openAIDocumentHelp = () => {
    const prompts = {
      'CV': ['Write a professional summary', 'Improve my bullet points', 'Tailor to a role', 'Shorten this section'],
      'Cover Letter': ['Write from scratch', 'Make it more formal', 'Rewrite for InnovateX', 'Make it personal'],
      'Proposal': ['Generate proposal draft', 'Outline the structure', 'Improve clarity', 'Make it concise']
    };
    openAssistant(`${type} Builder`, prompts[type], (text) => {
      setContent(prev => prev + '\n\n' + text);
    }, {
      title: initialTitle,
      content: content,
      type: type,
      opportunityId: (window as any).currentOpportunityId // Temporary bridge if not in props
    });
  };

  // Dynamic Responsive Styles
  const containerStyle: React.CSSProperties = {
    height: isMobile ? 'auto' : 'calc(100vh - 120px)',
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '16px' : '0'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    marginBottom: isMobile ? '16px' : '24px',
    gap: isMobile ? '16px' : '0'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '1.25rem' : '1.5rem',
    fontWeight: 700,
    marginBottom: '2px'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: isMobile ? '100%' : 'auto',
  };

  const dividerStyle: React.CSSProperties = {
    display: isMobile ? 'none' : 'block',
    width: '1px',
    height: '24px',
    backgroundColor: 'var(--border-color)',
    margin: '0 8px',
  };

  const editorGridStyle: React.CSSProperties = {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? '20px' : '24px',
    overflow: isMobile ? 'visible' : 'hidden',
  };

  const editorColStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
    height: isMobile ? '350px' : 'auto',
  };

  const toolbarStyle: React.CSSProperties = {
    padding: '10px 12px',
    display: 'flex',
    gap: '6px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'rgba(0,0,0,0.1)',
    flexWrap: 'wrap'
  };

  const toolbarButtonStyle: React.CSSProperties = {
    padding: '6px 8px',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  };

  const AssistantToolbarButtonStyle: React.CSSProperties = {
    ...toolbarButtonStyle,
    color: 'var(--accent-primary)',
    fontWeight: 600,
    fontSize: '0.75rem',
    gap: '6px',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.1)',
  };

  const toolbarDividerStyle: React.CSSProperties = {
    width: '1px',
    height: '18px',
    backgroundColor: 'var(--border-color)',
    margin: '0 4px',
    alignSelf: 'center'
  };

  const editorWrapperStyle: React.CSSProperties = {
    flex: 1,
    padding: isMobile ? '16px' : '24px',
  };

  const editorAreaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    resize: 'none',
    outline: 'none',
    fontSize: '0.9375rem',
    lineHeight: 1.6,
    fontFamily: '"Courier New", Courier, monospace',
  };

  const previewColStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  const previewHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    color: 'var(--text-secondary)',
  };

  const documentWrapperStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 'var(--radius-xl)',
    padding: isMobile ? '16px' : '40px',
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'center',
    height: isMobile ? '400px' : 'auto',
    minHeight: isMobile ? '300px' : '0',
  };

  const documentPageStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '600px',
    minHeight: isMobile ? 'auto' : '800px',
    backgroundColor: '#fff',
    color: '#1e293b',
    padding: isMobile ? '24px' : '60px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    fontFamily: 'serif',
  };

  const docHeaderStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: isMobile ? '20px' : '40px',
    borderBottom: '2px solid #334155',
    paddingBottom: isMobile ? '10px' : '20px',
  };

  const docTitleStyle: React.CSSProperties = {
    fontSize: isMobile ? '1.25rem' : '1.75rem',
    letterSpacing: '0.1em',
    marginBottom: '8px',
  };

  const docContactStyle: React.CSSProperties = {
    fontSize: isMobile ? '0.75rem' : '0.875rem',
    color: '#64748b',
    lineHeight: 1.4
  };

  const docBodyStyle: React.CSSProperties = {
    lineHeight: 1.6,
    fontSize: isMobile ? '0.8125rem' : '0.9375rem',
  };

  const ToolbarButton = ({ icon: Icon, label }: any) => (
    <button style={toolbarButtonStyle}>
      <Icon size={18} />
      {label && <span style={{ fontSize: '0.75rem', marginLeft: '6px' }}>{label}</span>}
    </button>
  );

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{initialTitle}</h1>
          <p style={subtitleStyle}>{type} Builder • {t('builders.editingMode')}</p>
        </div>
        <div style={actionsStyle}>
          <Button 
            variant="outline" 
            onClick={handleSave} 
            style={{ gap: '8px', flex: isMobile ? 1 : 'none', justifyContent: 'center' }}
          >
            {isSaved ? <CheckCircle size={18} color="#22c55e" /> : <Save size={18} />}
            {isSaved ? t('opportunities.saved') : t('grantBuilder.saveDraft')}
          </Button>
          <div style={dividerStyle}></div>
          <Button 
            variant="secondary" 
            style={{ gap: '8px', flex: isMobile ? 1 : 'none', justifyContent: 'center' }}
          >
            <FileDown size={18} /> DOCX
          </Button>
          <Button 
            style={{ gap: '8px', flex: isMobile ? 1 : 'none', justifyContent: 'center' }}
          >
            <Download size={18} /> PDF
          </Button>
        </div>
      </header>

      <div style={editorGridStyle}>
        {/* Editor Sidebar */}
        <section style={editorColStyle}>
          <div style={toolbarStyle}>
            <ToolbarButton icon={Bold} />
            <ToolbarButton icon={Italic} />
            <ToolbarButton icon={List} />
            <div style={toolbarDividerStyle}></div>
            <ToolbarButton icon={Type} label="Heading" />
            <div style={toolbarDividerStyle}></div>
            <button 
              style={AssistantToolbarButtonStyle}
              onClick={openAIDocumentHelp}
            >
              <Sparkles size={16} />
              <span>{t('assistant.title')}</span>
            </button>
          </div>
          
          <div style={editorWrapperStyle}>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={editorAreaStyle}
              spellCheck={false}
            />
          </div>
        </section>

        {/* Live Preview */}
        <section style={previewColStyle}>
          <div style={previewHeaderStyle}>
            <Eye size={16} /> 
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('builders.livePreview')}</span>
          </div>
          
          <div style={documentWrapperStyle}>
            <div style={documentPageStyle}>
              {/* This mimics a real A4 paper */}
              <div style={docHeaderStyle}>
                <h2 style={docTitleStyle}>ALEX JOHNSON</h2>
                <p style={docContactStyle}>San Francisco, CA • alex.j@example.com • (555) 000-1234</p>
              </div>
              
              <div style={docBodyStyle}>
                {content.split('\n').map((line, i) => (
                  <p key={i} style={{ marginBottom: '12px' }}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
