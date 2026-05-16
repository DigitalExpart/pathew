import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Download, Eye, Save, Settings2, X, Sparkles } from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';
import { useTranslation } from 'react-i18next';

export const GrantBuilderPage: React.FC = () => {
  const { t } = useTranslation();
  const [docType, setDocType] = useState(t('grantBuilder.docTypes.full'));
  const [pageCount, setPageCount] = useState(t('grantBuilder.pages.five'));
  const [previewMode, setPreviewMode] = useState(false);
  const [content, setContent] = useState(t('grantBuilder.placeholder'));
  const [questions, setQuestions] = useState([{ id: 1, text: t('grantBuilder.abstract'), limit: 250 }]);
  const { openAssistant } = useAssistant();

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), text: '', limit: 500 }]);
  };

  const openAIGrantHelp = () => {
    openAssistant('Grant Builder', [
      'Draft an answer',
      'Shorten to word limit',
      'Make this more persuasive',
      'Use my achievements to strengthen this answer'
    ], (text) => {
      setContent(prev => prev + '\n\n' + text);
    }, {
      docType: docType,
      content: content,
      questions: questions
    });
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{t('grantBuilder.title')}</h1>
          <p style={subtitleStyle}>{t('grantBuilder.subtitle')}</p>
        </div>
        <div style={headerActionsStyle}>
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye size={16} style={{ marginRight: '8px' }} />
            {previewMode ? t('grantBuilder.editMode') : t('grantBuilder.preview')}
          </Button>
          <Button style={{ backgroundColor: '#22c55e', color: '#000' }}>
            <Save size={16} style={{ marginRight: '8px' }} />
            {t('grantBuilder.saveDraft')}
          </Button>
        </div>
      </header>

      <div style={layoutGridStyle}>
        {/* Settings Sidebar */}
        <aside style={settingsSidebarStyle}>
          <Card title={t('grantBuilder.docSetup')} icon={Settings2}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>{t('grantBuilder.docType')}</label>
              <select 
                style={selectStyle}
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value={t('grantBuilder.docTypes.full')}>{t('grantBuilder.docTypes.full')}</option>
                <option value={t('grantBuilder.docTypes.onePage')}>{t('grantBuilder.docTypes.onePage')}</option>
                <option value={t('grantBuilder.docTypes.ukCV')}>{t('grantBuilder.docTypes.ukCV')}</option>
                <option value={t('grantBuilder.docTypes.usCV')}>{t('grantBuilder.docTypes.usCV')}</option>
                <option value={t('grantBuilder.docTypes.euCV')}>{t('grantBuilder.docTypes.euCV')}</option>
                <option value={t('grantBuilder.docTypes.academicCV')}>{t('grantBuilder.docTypes.academicCV')}</option>
                <option value={t('grantBuilder.docTypes.coverLetter')}>{t('grantBuilder.docTypes.coverLetter')}</option>
              </select>
            </div>

            {(docType === t('grantBuilder.docTypes.full') || docType === t('grantBuilder.docTypes.academicCV')) && (
              <div style={formGroupStyle}>
                <label style={labelStyle}>{t('grantBuilder.targetPageCount')}</label>
                <select 
                  style={selectStyle}
                  value={pageCount}
                  onChange={(e) => setPageCount(e.target.value)}
                >
                  <option value={t('grantBuilder.pages.one')}>{t('grantBuilder.pages.one')}</option>
                  <option value={t('grantBuilder.pages.two')}>{t('grantBuilder.pages.two')}</option>
                  <option value={t('grantBuilder.pages.three')}>{t('grantBuilder.pages.three')}</option>
                  <option value={t('grantBuilder.pages.five')}>{t('grantBuilder.pages.five')}</option>
                  <option value={t('grantBuilder.pages.tenPlus')}>{t('grantBuilder.pages.tenPlus')}</option>
                </select>
              </div>
            )}
          </Card>

          {docType.includes(t('grantBuilder.docTypes.onePage').split(' ')[1]) && (
            <Card title={t('grantBuilder.customQuestions')} style={{ marginTop: '24px' }}>
              <div style={questionsListStyle}>
                {questions.map((q, idx) => (
                  <div key={q.id} style={questionItemStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Q{idx + 1}</span>
                      <button style={iconBtnStyle}><X size={14} /></button>
                    </div>
                    <input 
                      type="text" 
                      placeholder={t('grantBuilder.questionPlaceholder')} 
                      defaultValue={q.text}
                      style={inputStyle} 
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('grantBuilder.wordLimit')}</span>
                      <input type="number" defaultValue={q.limit} style={smallInputStyle} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addQuestion} style={{ width: '100%' }}>
                  {t('grantBuilder.addQuestion')}
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
              <span style={{ color: 'var(--text-muted)' }}>• {content.split(' ').length} {t('grantBuilder.words')}</span>
              <div style={toolbarDividerStyle}></div>
              <button 
                style={AssistantGrantHelpButtonStyle}
                onClick={openAIGrantHelp}
              >
                <Sparkles size={14} />
                <span>{t('assistant.title', 'Assistant')}</span>
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
                placeholder={t('grantBuilder.placeholder')}
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

const AssistantGrantHelpButtonStyle: React.CSSProperties = {
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
