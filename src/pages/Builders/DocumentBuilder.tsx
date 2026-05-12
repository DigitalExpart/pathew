import React, { useState } from 'react';
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
import { useAI } from '../../context/AIContext';

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
  const { openAIAssistant } = useAI();

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
    openAIAssistant(`${type} Builder`, prompts[type]);
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{initialTitle}</h1>
          <p style={subtitleStyle}>{type} Builder • Editing Mode</p>
        </div>
        <div style={actionsStyle}>
          <Button variant="outline" onClick={handleSave} style={{ gap: '8px' }}>
            {isSaved ? <CheckCircle size={18} color="#22c55e" /> : <Save size={18} />}
            {isSaved ? 'Saved' : 'Save Draft'}
          </Button>
          <div style={dividerStyle}></div>
          <Button variant="secondary" style={{ gap: '8px' }}>
            <FileDown size={18} /> DOCX
          </Button>
          <Button style={{ gap: '8px' }}>
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
              style={aiToolbarButtonStyle}
              onClick={openAIDocumentHelp}
            >
              <Sparkles size={16} />
              <span>AI Assistant</span>
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
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Live Preview</span>
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

const ToolbarButton = ({ icon: Icon, label }: any) => (
  <button style={toolbarButtonStyle}>
    <Icon size={18} />
    {label && <span style={{ fontSize: '0.75rem', marginLeft: '6px' }}>{label}</span>}
  </button>
);

// Styles
const containerStyle: React.CSSProperties = {
  height: 'calc(100vh - 120px)',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
};

const dividerStyle: React.CSSProperties = {
  width: '1px',
  height: '24px',
  backgroundColor: 'var(--border-color)',
  margin: '0 8px',
};

const editorGridStyle: React.CSSProperties = {
  flex: 1,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '24px',
  overflow: 'hidden',
};

const editorColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border-color)',
  overflow: 'hidden',
};

const toolbarStyle: React.CSSProperties = {
  padding: '12px',
  display: 'flex',
  gap: '8px',
  borderBottom: '1px solid var(--border-color)',
  backgroundColor: 'rgba(0,0,0,0.1)',
};

const toolbarButtonStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '6px',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  transition: 'all 0.2s ease',
};

const aiToolbarButtonStyle: React.CSSProperties = {
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
  height: '20px',
  backgroundColor: 'var(--border-color)',
  margin: '0 4px',
};

const editorWrapperStyle: React.CSSProperties = {
  flex: 1,
  padding: '24px',
};

const editorAreaStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'none',
  border: 'none',
  color: 'var(--text-primary)',
  resize: 'none',
  outline: 'none',
  fontSize: '1rem',
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
  padding: '40px',
  overflowY: 'auto',
  display: 'flex',
  justifyContent: 'center',
};

const documentPageStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '600px',
  minHeight: '800px',
  backgroundColor: '#fff',
  color: '#1e293b',
  padding: '60px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  fontFamily: 'serif',
};

const docHeaderStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '40px',
  borderBottom: '2px solid #334155',
  paddingBottom: '20px',
};

const docTitleStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  letterSpacing: '0.1em',
  marginBottom: '8px',
};

const docContactStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#64748b',
};

const docBodyStyle: React.CSSProperties = {
  lineHeight: 1.6,
  fontSize: '0.9375rem',
};
