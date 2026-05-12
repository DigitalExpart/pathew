import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles, RefreshCw, Check, Trash2 } from 'lucide-react';
import { useAI } from '../../context/AIContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const AIAssistantPanel: React.FC = () => {
  const { isAIPanelOpen, setAIPanelOpen, aiContext, suggestedPrompts } = useAI();
  const [input, setInput] = useState('');
  const [responses, setResponses] = useState<{ type: 'user' | 'ai', text: string }[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    if (isAIPanelOpen && responses.length === 0) {
      setResponses([{ type: 'ai', text: `I'm PATHEW AI, ready to help with ${aiContext || 'your task'}. How can I assist you today?` }]);
    }
  }, [isAIPanelOpen, aiContext]);

  const handleSend = (text: string = input) => {
    if (!text.trim()) return;
    
    const userMsg = { type: 'user' as const, text };
    setResponses(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg = { 
        type: 'ai' as const, 
        text: `Based on your request "${text}" for ${aiContext}, here is a polished version: \n\n"Experienced professional with a track record of success in ${aiContext}. Proven ability to deliver high-quality results and drive innovation in competitive environments."` 
      };
      setResponses(prev => [...prev, aiMsg]);
      setIsThinking(false);
    }, 1500);
  };

  if (!isAIPanelOpen) return null;

  return (
    <div style={drawerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={iconBoxStyle}>
            <Sparkles size={18} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>PATHEW AI</h2>
        </div>
        <button onClick={() => setAIPanelOpen(false)} style={closeButtonStyle}>
          <X size={20} />
        </button>
      </div>

      <div style={contentStyle}>
        <div style={messagesStyle}>
          {responses.map((res, i) => (
            <div key={i} style={res.type === 'user' ? userMsgWrapperStyle : aiMsgWrapperStyle}>
              <div style={res.type === 'user' ? userMsgStyle : aiMsgStyle}>
                {res.text}
                {res.type === 'ai' && i > 0 && (
                  <div style={aiActionStyle}>
                    <Button variant="outline" size="sm" style={smallBtnStyle}>
                      <Check size={14} /> Insert
                    </Button>
                    <Button variant="outline" size="sm" style={smallBtnStyle} onClick={() => handleSend(responses[i-1].text)}>
                      <RefreshCw size={14} /> Regenerate
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isThinking && <ThinkingState />}
        </div>

        <div style={footerStyle}>
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
            <button onClick={() => handleSend()} style={sendButtonStyle}>
              <Send size={18} color={input.trim() ? 'var(--accent-primary)' : 'var(--text-muted)'} />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
             <button onClick={() => setResponses([])} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                <Trash2 size={12} /> Clear Chat
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThinkingState = () => (
  <div style={aiMsgWrapperStyle}>
    <div style={{ ...aiMsgStyle, display: 'flex', gap: '8px', alignItems: 'center' }}>
      <div className="pulse" style={pulseDotStyle}></div>
      <div className="pulse" style={{ ...pulseDotStyle, animationDelay: '0.2s' }}></div>
      <div className="pulse" style={{ ...pulseDotStyle, animationDelay: '0.4s' }}></div>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>PATHEW is thinking...</span>
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

const aiMsgWrapperStyle: React.CSSProperties = {
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

const aiMsgStyle: React.CSSProperties = {
  maxWidth: '85%',
  padding: '12px 16px',
  backgroundColor: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  borderRadius: '18px 18px 18px 2px',
  fontSize: '0.9375rem',
  lineHeight: 1.5,
  border: '1px solid var(--border-color)',
};

const aiActionStyle: React.CSSProperties = {
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
