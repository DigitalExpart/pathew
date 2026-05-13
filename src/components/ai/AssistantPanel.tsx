import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, RefreshCw, Check, History, AlertCircle, Download } from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { usePathewAssistant } from '../../hooks/usePathewAssistant';

export const AssistantPanel: React.FC = () => {
  const { 
    isAssistantPanelOpen, 
    setAssistantPanelOpen, 
    activeContext, 
    suggestedPrompts, 
    onInsert, 
    fullContextData,
    isGenerating,
    setIsGenerating
  } = useAssistant();
  
  const { profile: _profile } = useAuth();
  const { generate, isLoading, error } = usePathewAssistant();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ type: 'user' | 'assistant', text: string, data?: any, isError?: boolean }[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const initialTriggerRef = useRef(false);

  useEffect(() => {
    if (isAssistantPanelOpen && messages.length === 0) {
      setMessages([{ 
        type: 'assistant', 
        text: `I'm your Pathew Assistant, ready to help with your ${activeContext}. I have analyzed your profile and the current opportunity. How can I assist you?` 
      }]);

      // Auto-trigger for preparation plan
      if (fullContextData?.duration && !initialTriggerRef.current) {
        initialTriggerRef.current = true;
        handleSend(`Generate a ${fullContextData.duration} preparation plan`);
      }
    }

    if (!isAssistantPanelOpen) {
      initialTriggerRef.current = false;
    }
  }, [isAssistantPanelOpen, activeContext, fullContextData]);

  const handleDownload = (text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "Pathew_Assistant_Content.txt";
    document.body.appendChild(element);
    element.click();
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    
    setMessages(prev => [...prev, { type: 'user', text }]);
    setInput('');
    setIsGenerating(true);

    const result = await generate({
      action: text,
      documentType: fullContextData?.type || activeContext,
      opportunityId: fullContextData?.opportunityId,
      currentDraft: fullContextData?.content,
      contextData: fullContextData
    });

    if (result) {
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        text: result.draft,
        data: result
      }]);
    } else {
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        text: error || '[RELOADED] I encountered an error while processing your request. Please try again.',
        isError: true
      }]);
    }
    
    setIsGenerating(false);
  };

  const handleInsert = (fullText: string) => {
    if (!onInsert) return;
    
    // For preparation plans, we often want the whole text or everything after the success tag
    let textToInsert = fullText;
    
    if (fullText.includes('[Assistant GENERATED SUCCESS]')) {
      const parts = fullText.split('\n\n');
      if (parts.length > 1) {
        textToInsert = parts.slice(1).join('\n\n');
      }
    } else {
      // Fallback to quote extraction for simple text snippets
      const match = fullText.match(/"([^"]+)"/);
      if (match) textToInsert = match[1];
    }
    
    onInsert(textToInsert);
    setAssistantPanelOpen(false);
  };

  if (!isAssistantPanelOpen) return null;

  return (
    <div style={drawerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={iconBoxStyle}>
            <Sparkles size={18} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>PATHEW Assistant</h2>
        </div>
        <button onClick={() => setAssistantPanelOpen(false)} style={closeButtonStyle}>
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
            {messages.map((res, i) => (
              <div key={i} style={res.type === 'user' ? userMsgWrapperStyle : AssistantMsgWrapperStyle}>
                <div style={{
                  ...(res.type === 'user' ? userMsgStyle : AssistantMsgStyle),
                  ...(res.isError ? errorMsgStyle : {})
                }}>
                  {res.isError && <AlertCircle size={16} style={{ marginBottom: '8px', display: 'block' }} />}
                  
                  {res.text}

                  {res.data?.matchSummary && (
                    <div style={matchSummaryStyle}>
                      {res.data.matchSummary.strongMatches.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <p style={matchTitleStyle}>Strong Matches</p>
                          <ul style={matchListStyle}>
                            {res.data.matchSummary.strongMatches.map((m: string, idx: number) => (
                              <li key={idx}>✓ {m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {res.data.matchSummary.gaps.length > 0 && (
                        <div>
                          <p style={{ ...matchTitleStyle, color: '#f59e0b' }}>Key Gaps</p>
                          <ul style={matchListStyle}>
                            {res.data.matchSummary.gaps.map((g: string, idx: number) => (
                              <li key={idx}>! {g}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {res.type === 'assistant' && i > 0 && !res.isError && (
                    <div style={AssistantActionStyle}>
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
                      <Button variant="outline" size="sm" style={smallBtnStyle} onClick={() => handleSend(messages[i-1].text)}>
                        <RefreshCw size={14} /> Regenerate
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && <ThinkingState />}
          </div>
        ) : (
          <HistoryTab onInsert={handleInsert} />
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

const HistoryTab = ({ onInsert }: { onInsert: (text: string) => void }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('assistant_messages')
        .select('*, session:assistant_sessions(*)')
        .eq('user_id', user.id)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error) setHistory(data || []);
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading history...</div>;

  return (
    <div style={messagesStyle}>
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No generation history yet.
        </div>
      ) : (
        history.map((item, i) => (
          <div key={i} style={historyItemStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(item.created_at).toLocaleDateString()} • {item.session?.task || 'General'}
              </span>
              <button style={smallBtnStyle} onClick={() => onInsert(item.content)}>Insert</button>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.content}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

// ... existing drawerStyle and other styles

const ThinkingState = () => (
  <div style={AssistantMsgWrapperStyle}>
    <div style={{ ...AssistantMsgStyle, display: 'flex', gap: '8px', alignItems: 'center' }}>
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

const AssistantMsgWrapperStyle: React.CSSProperties = {
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

const AssistantMsgStyle: React.CSSProperties = {
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

const AssistantActionStyle: React.CSSProperties = {
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

const matchSummaryStyle: React.CSSProperties = {
  marginTop: '16px',
  padding: '12px',
  backgroundColor: 'rgba(255,255,255,0.03)',
  borderRadius: '8px',
  borderLeft: '3px solid var(--accent-primary)',
};

const matchTitleStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--accent-primary)',
  marginBottom: '6px',
};

const matchListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  fontSize: '0.8125rem',
  color: 'var(--text-secondary)',
};

