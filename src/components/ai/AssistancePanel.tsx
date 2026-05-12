import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, RefreshCw, Check, Trash2, History, AlertCircle, Download } from 'lucide-react';
import { useAssistance } from '../../context/AssistanceContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { assistanceService } from '../../services/aiService';
import { mockUser } from '../../data/mockData';

export const AssistancePanel: React.FC = () => {
  const { 
    isAssistancePanelOpen, 
    setAssistancePanelOpen, 
    assistanceContext, 
    suggestedPrompts, 
    onInsert, 
    fullContextData,
    isGenerating,
    setIsGenerating
  } = useAssistance();

  const [input, setInput] = useState('');
  const [responses, setResponses] = useState<{ type: 'user' | 'assistance', text: string, error?: boolean }[]>([]);
  const [history, setHistory] = useState<{ text: string, date: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const initialTriggerRef = useRef(false);

  useEffect(() => {
    if (isAssistancePanelOpen && responses.length === 0) {
      setResponses([{ 
        type: 'assistance', 
        text: `I'm your Pathew Assistant, ready to help with your ${assistanceContext}. I have access to your current document context. How can I assist you?` 
      }]);

      // Auto-trigger for preparation plan
      if (fullContextData?.duration && !initialTriggerRef.current) {
        initialTriggerRef.current = true;
        handleSend(`Generate a ${fullContextData.duration} preparation plan`);
      }
    }

    if (!isAssistancePanelOpen) {
      initialTriggerRef.current = false;
    }
  }, [isAssistancePanelOpen, assistanceContext, fullContextData]);

  const handleDownload = (text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text.replace('[ASSISTANCE GENERATED SUCCESS] \n\n', '')], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "Pathew_Preparation_Plan.txt";
    document.body.appendChild(element);
    element.click();
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isGenerating) return;
    
    const userMsg = { type: 'user' as const, text };
    setResponses(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    const result = await assistanceService.generateResponse({
      type: assistanceContext,
      action: text,
      data: fullContextData,
      userCredits: mockUser.credits
    });

    if (result.success) {
      const assistanceMsg = { type: 'assistance' as const, text: result.text! };
      setResponses(prev => [...prev, assistanceMsg]);
      setHistory(prev => [{ text: result.text!, date: new Date().toLocaleTimeString() }, ...prev]);
    } else {
      const errorMsg = { type: 'assistance' as const, text: result.error!, error: true };
      setResponses(prev => [...prev, errorMsg]);
    }
    
    setIsGenerating(false);
  };

  const handleInsert = (fullText: string) => {
    if (!onInsert) return;
    
    // Extract the text within quotes for the mock response, or just use the text if no quotes
    const match = fullText.match(/"([^"]+)"/);
    const textToInsert = match ? match[1] : (fullText.includes('[ASSISTANCE GENERATED SUCCESS]') ? fullText.split('\n\n')[1] : fullText);
    
    onInsert(textToInsert);
    setAssistancePanelOpen(false);
  };

  if (!isAssistancePanelOpen) return null;

  return (
    <div style={drawerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={iconBoxStyle}>
            <Sparkles size={18} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>PATHEW Assistance</h2>
        </div>
        <button onClick={() => setAssistancePanelOpen(false)} style={closeButtonStyle}>
          <X size={20} />
        </button>
      </div>

      <div style={tabsStyle}>
        <button 
          onClick={() => setActiveTab('chat')}
          style={{ ...tabButtonStyle, borderBottomColor: activeTab === 'chat' ? 'var(--accent-primary)' : 'transparent' }}
        >
          Assistant
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ ...tabButtonStyle, borderBottomColor: activeTab === 'history' ? 'var(--accent-primary)' : 'transparent' }}
        >
          <History size={14} style={{ marginRight: '6px' }} /> History
        </button>
      </div>

      <div style={contentStyle}>
        {activeTab === 'chat' ? (
          <div style={messagesStyle}>
            {responses.map((res, i) => (
              <div key={i} style={res.type === 'user' ? userMsgWrapperStyle : assistanceMsgWrapperStyle}>
                <div style={{
                  ...(res.type === 'user' ? userMsgStyle : assistanceMsgStyle),
                  ...(res.error ? errorMsgStyle : {})
                }}>
                  {res.error && <AlertCircle size={16} style={{ marginBottom: '8px', display: 'block' }} />}
                  {res.text}
                  {res.type === 'assistance' && i > 0 && !res.error && (
                    <div style={assistanceActionStyle}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        style={smallBtnStyle}
                        onClick={() => handleInsert(res.text)}
                      >
                        <Check size={14} /> Insert
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        style={smallBtnStyle}
                        onClick={() => handleDownload(res.text)}
                      >
                        <Download size={14} /> Download
                      </Button>
                      <Button variant="outline" size="sm" style={smallBtnStyle} onClick={() => handleSend(responses[i-1].text)}>
                        <RefreshCw size={14} /> Regenerate
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isGenerating && <ThinkingState />}
          </div>
        ) : (
          <div style={messagesStyle}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No generation history yet.
              </div>
            ) : (
              history.map((item, i) => (
                <div key={i} style={historyItemStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.date}</span>
                    <button style={smallBtnStyle} onClick={() => handleInsert(item.text)}>Insert</button>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.text.substring(0, 100)}...</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={footerStyle}>
            <div style={creditWarningStyle}>
              <Sparkles size={12} color="var(--accent-primary)" />
              <span>Each generation costs 10 Credits</span>
            </div>
            <div style={chipsContainerStyle}>
              {suggestedPrompts.map((prompt, i) => (
                <button key={i} onClick={() => handleSend(prompt)} style={chipStyle}>
                  {prompt}
                </button>
              ))}
            </div>
            <div style={inputWrapperStyle}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Ask anything..."
                style={textareaStyle}
              />
              <button onClick={() => handleSend()} style={sendButtonStyle} disabled={isGenerating}>
                <Send size={18} color={input.trim() && !isGenerating ? 'var(--accent-primary)' : 'var(--text-muted)'} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ThinkingState = () => (
  <div style={assistanceMsgWrapperStyle}>
    <div style={{ ...assistanceMsgStyle, display: 'flex', gap: '8px', alignItems: 'center' }}>
      <div className="pulse" style={pulseDotStyle}></div>
      <div className="pulse" style={{ ...pulseDotStyle, animationDelay: '0.2s' }}></div>
      <div className="pulse" style={{ ...pulseDotStyle, animationDelay: '0.4s' }}></div>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>PATHEW is working...</span>
    </div>
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }
      .pulse {
        animation: pulse 1.5s infinite ease-in-out;
      }
    `}</style>
  </div>
);

const drawerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  width: '400px',
  height: '100vh',
  backgroundColor: 'var(--bg-secondary)',
  borderLeft: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000,
  boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
  animation: 'slideIn 0.3s ease-out',
};

const headerStyle: React.CSSProperties = {
  padding: '20px',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'linear-gradient(to bottom, rgba(245, 158, 11, 0.05), transparent)',
};

const iconBoxStyle: React.CSSProperties = {
  padding: '8px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: '10px',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '4px',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const messagesStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const userMsgWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};

const assistanceMsgWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
};

const userMsgStyle: React.CSSProperties = {
  maxWidth: '85%',
  padding: '12px 16px',
  backgroundColor: 'var(--accent-primary)',
  color: '#000',
  borderRadius: '18px 18px 2px 18px',
  fontSize: '0.9375rem',
  fontWeight: 500,
};

const assistanceMsgStyle: React.CSSProperties = {
  maxWidth: '85%',
  padding: '12px 16px',
  backgroundColor: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  borderRadius: '18px 18px 18px 2px',
  fontSize: '0.9375rem',
  lineHeight: 1.5,
  border: '1px solid var(--border-color)',
};

const errorMsgStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  borderColor: 'rgba(239, 68, 68, 0.2)',
  color: '#ef4444',
};

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  padding: '0 20px',
  borderBottom: '1px solid var(--border-color)',
  gap: '20px',
};

const tabButtonStyle: React.CSSProperties = {
  padding: '12px 0',
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  color: 'var(--text-secondary)',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const historyItemStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  marginBottom: '12px',
};

const creditWarningStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  marginBottom: '12px',
  padding: '8px',
  backgroundColor: 'rgba(255,255,255,0.03)',
  borderRadius: '8px',
};

const assistanceActionStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: '1px solid var(--border-color)',
};

const footerStyle: React.CSSProperties = {
  padding: '20px',
  borderTop: '1px solid var(--border-color)',
  backgroundColor: 'rgba(0,0,0,0.2)',
};

const chipsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginBottom: '16px',
};

const chipStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '20px',
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const inputWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-end',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '8px 12px',
};

const textareaStyle: React.CSSProperties = {
  flex: 1,
  background: 'none',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  resize: 'none',
  height: 'auto',
  maxHeight: '120px',
  minHeight: '24px',
  outline: 'none',
  padding: '4px 0',
};

const sendButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
};

const pulseDotStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  backgroundColor: 'var(--accent-primary)',
  borderRadius: '50%',
};

const smallBtnStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '0.75rem',
  height: 'auto',
  gap: '4px',
};
