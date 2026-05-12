import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Download, Eye, Save, Settings2, X, Sparkles } from 'lucide-react';
import { useAI } from '../../context/AIContext';

export const GrantBuilderPage: React.FC = () => {
  const [docType, setDocType] = useState('Full Grant Proposal');
  const [pageCount, setPageCount] = useState('5 Pages');
  const [previewMode, setPreviewMode] = useState(false);
  const [content, setContent] = useState('Start drafting your proposal here...');
  const [questions, setQuestions] = useState([{ id: 1, text: 'Project Abstract', limit: 250 }]);
  const { openAIAssistant } = useAI();

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), text: '', limit: 500 }]);
  };

  const openAIGrantHelp = () => {
    openAIAssistant('Grant Builder', [
      'Draft an answer',
      'Shorten to word limit',
      'Make this more persuasive',
      'Use my achievements to strengthen this answer'
    ]);
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Grant Builder</h1>
          <p style={subtitleStyle}>Create multi-page proposals and targeted CVs tailored for success.</p>
        </div>
        <div style={headerActionsStyle}>
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye size={16} style={{ marginRight: '8px' }} />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button style={{ backgroundColor: '#22c55e', color: '#000' }}>
            <Save size={16} style={{ marginRight: '8px' }} />
            Save Draft
          </Button>
        </div>
      </header>

      <div style={layoutGridStyle}>
        {/* Settings Sidebar */}
        <aside style={settingsSidebarStyle}>
          <Card title="Document Setup" icon={Settings2}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Document Type</label>
              <select 
                style={selectStyle}
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option>Full Grant Proposal</option>
                <option>One-Page Proposal</option>
                <option>UK CV</option>
                <option>US CV</option>
                <option>EU CV</option>
                <option>Academic CV</option>
                <option>Cover Letter</option>
              </select>
            </div>

            {(docType === 'Full Grant Proposal' || docType === 'Academic CV') && (
              <div style={formGroupStyle}>
                <label style={labelStyle}>Target Page Count</label>
                <select 
                  style={selectStyle}
                  value={pageCount}
                  onChange={(e) => setPageCount(e.target.value)}
                >
                  <option>1 Page</option>
                  <option>2 Pages</option>
                  <option>3 Pages</option>
                  <option>5 Pages</option>
                  <option>10+ Pages</option>
                </select>
              </div>
            )}
          </Card>

          {docType.includes('Proposal') && (
            <Card title="Custom Questions" style={{ marginTop: '24px' }}>
              <div style={questionsListStyle}>
                {questions.map((q, idx) => (
                  <div key={q.id} style={questionItemStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Q{idx + 1}</span>
                      <button style={iconBtnStyle}><X size={14} /></button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Question or Section Title" 
                      defaultValue={q.text}
                      style={inputStyle} 
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Word limit:</span>
                      <input type="number" defaultValue={q.limit} style={smallInputStyle} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addQuestion} style={{ width: '100%' }}>
                  + Add Question
                </Button>
              </div>
            </Card>
          )}
        </aside>

        {/* Editor Area */}
        <div style={editorAreaStyle}>
          <div style={editorToolbarStyle}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{docType}</span>
              <span style={{ color: 'var(--text-muted)' }}>• {content.split(' ').length} words</span>
              <div style={toolbarDividerStyle}></div>
              <button 
                style={aiToolbarButtonStyle}
                onClick={openAIGrantHelp}
              >
                <Sparkles size={14} />
                <span>AI Assistant</span>
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="outline" size="sm">
                <Download size={14} style={{ marginRight: '6px' }} />
                PDF
              </Button>
              <Button variant="outline" size="sm">
                <Download size={14} style={{ marginRight: '6px' }} />
                DOCX
              </Button>
            </div>
          </div>

          <div style={editorContainerStyle}>
            {previewMode ? (
              <div style={previewBoxStyle}>
                <h2>{docType}</h2>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: '24px', color: 'var(--text-secondary)' }}>
                  {content}
                </div>
              </div>
            ) : (
              <textarea 
                style={textareaStyle}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing your document..."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  height: 'calc(100vh - 120px)',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '24px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
};

const headerActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
};

const layoutGridStyle: React.CSSProperties = {
  display: 'flex',
  gap: '32px',
  flex: 1,
  minHeight: 0,
};

const settingsSidebarStyle: React.CSSProperties = {
  width: '320px',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  paddingRight: '4px',
};

const editorAreaStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border-color)',
  overflow: 'hidden',
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 600,
  marginBottom: '8px',
  color: 'var(--text-secondary)',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
};

const questionsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const questionItemStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  padding: '12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
};

const smallInputStyle: React.CSSProperties = {
  width: '80px',
  padding: '4px 8px',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: '0.75rem',
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '2px',
};

const editorToolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px',
  borderBottom: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-primary)',
};

const toolbarDividerStyle: React.CSSProperties = {
  width: '1px',
  height: '20px',
  backgroundColor: 'var(--border-color)',
  margin: '0 4px',
};

const aiToolbarButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '20px',
  backgroundColor: 'rgba(245, 158, 11, 0.05)',
  border: '1px solid rgba(245, 158, 11, 0.1)',
  color: 'var(--accent-primary)',
  fontSize: '0.75rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const editorContainerStyle: React.CSSProperties = {
  flex: 1,
  padding: '24px',
  overflowY: 'auto',
  backgroundColor: '#1a1a1a',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
  backgroundColor: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  lineHeight: 1.6,
  resize: 'none',
  outline: 'none',
};

const previewBoxStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  backgroundColor: '#fff',
  color: '#000',
  padding: '64px',
  minHeight: '100%',
  borderRadius: '4px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
};