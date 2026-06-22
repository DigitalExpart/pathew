import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, RefreshCw, Check, History, AlertCircle, Download, Trash2, Copy, CheckCheck, Plus, FileText, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { usePathewAssistant } from '../../hooks/usePathewAssistant';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateDocxBlob } from '../../utils/docxExport';

export const AssistantPanel: React.FC = () => {
  const { t } = useTranslation();
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
  const { user } = useAuth();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ type: 'user' | 'assistant', text: string, data?: any, isError?: boolean }[]>([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ url: string, name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const lastRequestIdRef = useRef<number | null>(null);

  const [ratings, setRatings] = useState<Record<number, 'up' | 'down'>>({});
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);
  const [downloadingMsgIdx, setDownloadingMsgIdx] = useState<number | null>(null);

  useEffect(() => {
    if (isAssistantPanelOpen) {
      if (messages.length === 0) {
        setMessages([{ 
          type: 'assistant', 
          text: `I'm your Pathew Assistant, ready to help with your ${activeContext}. I have analyzed your profile and the current opportunity. How can I assist you?` 
        }]);
      }

      // Auto-trigger for preparation plan or any requestId change
      const currentRequestId = fullContextData?.requestId;
      if (currentRequestId && currentRequestId !== lastRequestIdRef.current) {
        lastRequestIdRef.current = currentRequestId;
        if (fullContextData?.duration) {
          const currentDateStr = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
          const deadlineStr = fullContextData?.deadline 
            ? ` (Application Deadline: ${new Date(fullContextData.deadline).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })})` 
            : '';
          handleSend(`Generate a ${fullContextData.duration} preparation plan starting from ${currentDateStr}${deadlineStr}. Ensure the timeline strictly respects these dates and does not backdate.`);
        } else if (fullContextData?.autoTrigger) {
          handleSend(fullContextData.autoTrigger);
        }
      }
    }
  }, [isAssistantPanelOpen, activeContext, fullContextData, messages.length]);

  const handleDownload = async (text: string, idx: number) => {
    setDownloadingMsgIdx(idx);
    try {
      const blob = await generateDocxBlob(text, "D69E2E", fullContextData?.type || activeContext || "General");
      const url = URL.createObjectURL(blob);
      const element = document.createElement("a");
      element.href = url;
      element.download = "Pathew_Assistant_Content.docx";
      document.body.appendChild(element);
      element.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating docx:', e);
      const element = document.createElement("a");
      const file = new Blob([text], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "Pathew_Assistant_Content.txt";
      document.body.appendChild(element);
      element.click();
    } finally {
      setDownloadingMsgIdx(null);
    }
  };

  const handleCopyMsg = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgIdx(idx);
      setTimeout(() => setCopiedMsgIdx(null), 2000);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedMsgIdx(idx);
      setTimeout(() => setCopiedMsgIdx(null), 2000);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    
    setMessages(prev => [...prev, { 
      type: 'user', 
      text,
      data: pendingMedia ? { mediaUrl: pendingMedia.url, fileName: pendingMedia.name } : undefined
    }]);
    setInput('');
    setPendingMedia(null);
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

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setMediaUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/assistant_refs/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      setPendingMedia({ url: publicUrl, name: file.name });
      
      // Auto-notify assistant about the specific upload if needed, 
      // but usually we wait for user to send their message with the attachment
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setMediaUploading(false);
    }
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('assistant.title')}</h2>
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
          {t('assistant.tabAssistant')}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ ...tabButtonStyle, borderBottomColor: activeTab === 'history' ? 'var(--accent-primary)' : 'transparent' }}
        >
          <History size={14} style={{ marginRight: '6px' }} /> {t('assistant.tabHistory')}
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
                  
                  {res.type === 'assistant' ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{res.text}</ReactMarkdown>
                    </div>
                  ) : (
                    res.text
                  )}

                  {res.data?.mediaUrl && (
                    <div style={mediaPreviewStyle}>
                      {(res.data.mediaUrl.split('?')[0].match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                        <img src={res.data.mediaUrl} alt="Reference" style={mediaImgStyle} />
                      ) : (
                        <div style={mediaFileStyle}>
                          <FileText size={20} color="var(--accent-primary)" />
                          <span style={{ fontSize: '0.8125rem' }}>{res.data.fileName}</span>
                        </div>
                      )}
                    </div>
                  )}

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
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          style={smallBtnStyle}
                          onClick={() => handleInsert(res.text)}
                        >
                          <Check size={14} /> {t('assistant.insert', 'Insert')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          style={smallBtnStyle}
                          onClick={() => handleDownload(res.text, i)}
                          disabled={downloadingMsgIdx === i}
                        >
                          {downloadingMsgIdx === i ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {t('assistant.download', 'Download')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          style={smallBtnStyle}
                          onClick={() => handleCopyMsg(res.text, i)}
                        >
                          {copiedMsgIdx === i ? <CheckCheck size={14} color="#22c55e" /> : <Copy size={14} />} {t('assistant.copy', 'Copy')}
                        </Button>
                        <Button variant="outline" size="sm" style={smallBtnStyle} onClick={() => handleSend(messages[i-1].text)}>
                          <RefreshCw size={14} /> {t('assistant.regenerate', 'Regenerate')}
                        </Button>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          style={{ ...iconActionBtnStyle, backgroundColor: ratings[i] === 'up' ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-primary)', borderColor: ratings[i] === 'up' ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-color)' }}
                          onClick={() => setRatings(prev => ({ ...prev, [i]: prev[i] === 'up' ? undefined : 'up' as any }))}
                          title="Helpful"
                        >
                          <ThumbsUp size={14} color={ratings[i] === 'up' ? '#22c55e' : 'var(--text-muted)'} />
                        </button>
                        <button 
                          style={{ ...iconActionBtnStyle, backgroundColor: ratings[i] === 'down' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-primary)', borderColor: ratings[i] === 'down' ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)' }}
                          onClick={() => setRatings(prev => ({ ...prev, [i]: prev[i] === 'down' ? undefined : 'down' as any }))}
                          title="Not Helpful"
                        >
                          <ThumbsDown size={14} color={ratings[i] === 'down' ? '#ef4444' : 'var(--text-muted)'} />
                        </button>
                      </div>
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
            {pendingMedia && (
              <div style={pendingMediaWrapperStyle}>
                <div style={pendingMediaBadgeStyle}>
                  {pendingMedia.url.split('?')[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={pendingMedia.url} alt="Pending" style={pendingMediaImgStyle} />
                  ) : (
                    <FileText size={16} color="var(--accent-primary)" />
                  )}
                  <span style={{ fontSize: '0.75rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pendingMedia.name}
                  </span>
                  <button onClick={() => setPendingMedia(null)} style={removeMediaBtnStyle}>
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
            <div style={creditWarningStyle}>
              <Sparkles size={12} color="var(--accent-primary)" />
              <span>{t('assistant.creditCost')}</span>
            </div>
            <div style={chipsContainerStyle}>
              {Array.isArray(suggestedPrompts) ? suggestedPrompts.map((prompt, i) => (
                <button key={i} onClick={() => setInput(prompt)} style={chipStyle}>
                  {prompt}
                </button>
              )) : null}
            </div>
            <div style={inputWrapperStyle}>
              <input 
                type="file" 
                id="assistant-media-upload" 
                style={{ display: 'none' }} 
                onChange={handleMediaUpload}
              />
              <button 
                onClick={() => document.getElementById('assistant-media-upload')?.click()}
                style={{ ...sendButtonStyle, marginRight: '8px' }}
                disabled={mediaUploading}
                title={t('assistant.uploadMedia')}
              >
                {mediaUploading ? (
                  <Loader2 size={18} className="animate-spin" color="var(--accent-primary)" />
                ) : (
                  <Plus size={18} color="var(--accent-primary)" />
                )}
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder={t('assistant.placeholder')}
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
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('assistant_messages')
      .select('*, session:assistant_sessions(*)')
      .eq('user_id', user.id)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error) setHistory(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('assistant_messages')
        .delete()
        .eq('id', id);
      if (!error) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) return;
    setClearingAll(true);
    try {
      const { error } = await supabase
        .from('assistant_messages')
        .delete()
        .eq('user_id', user.id)
        .eq('role', 'assistant');
      if (!error) setHistory([]);
    } catch (err) {
      console.error('Clear all error:', err);
    } finally {
      setClearingAll(false);
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading history...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with Clear All */}
      {history.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {history.length === 1 ? t('assistant.savedResponses', { count: 1 }) : t('assistant.savedResponsesPlural', { count: history.length })}
          </span>
          <button
            onClick={handleClearAll}
            disabled={clearingAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: clearingAll ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: clearingAll ? 0.6 : 1
            }}
          >
            <Trash2 size={12} />
            {clearingAll ? t('common.loading') : t('assistant.clearAll')}
          </button>
        </div>
      )}

      {/* History list */}
      <div style={{ ...messagesStyle, gap: '12px' }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <History size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <p>{t('assistant.noHistory')}</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} style={historyItemStyle}>
              {/* Item header: date/task + action buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: 1, marginRight: '8px' }}>
                  {new Date(item.created_at).toLocaleDateString()} • {item.session?.task || 'General'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleCopy(item.content, item.id)}
                    title={t('assistant.copy')}
                    style={iconActionBtnStyle}
                  >
                    {copiedId === item.id
                      ? <CheckCheck size={14} color="#22c55e" />
                      : <Copy size={14} color="var(--text-muted)" />}
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    title={t('assistant.deleteResponse')}
                    style={{ ...iconActionBtnStyle, opacity: deletingId === item.id ? 0.5 : 1 }}
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                  <button
                    style={{
                      ...smallBtnStyle,
                      padding: '4px 10px',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '6px',
                      color: 'var(--accent-primary)',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 700
                    }}
                    onClick={() => onInsert(item.content)}
                  >
                    {t('assistant.insert')}
                  </button>
                </div>
              </div>
              {/* Content preview */}
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
                margin: 0
              }}>
                {item.content}
              </p>
            </div>
          ))
        )}
      </div>
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
  width: '100%',
  maxWidth: '400px',
  height: '100dvh',
  backgroundColor: 'var(--bg-secondary)',
  borderLeft: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000,
  boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
  animation: 'slideInRight 0.3s ease-out',
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
  padding: '14px 16px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  transition: 'border-color 0.2s ease',
};

const iconActionBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  padding: '5px 6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
  backgroundColor: 'var(--bg-primary)',
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
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: '1px solid var(--border-color)',
};

const footerStyle: React.CSSProperties = {
  padding: '20px',
  paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
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

const mediaPreviewStyle: React.CSSProperties = {
  marginTop: '12px',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '1px solid var(--border-color)',
  backgroundColor: 'rgba(0,0,0,0.2)',
};

const mediaImgStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: '200px',
  objectFit: 'cover',
  display: 'block',
};

const mediaFileStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px',
};
const pendingMediaWrapperStyle: React.CSSProperties = {
  marginBottom: '12px',
  display: 'flex',
  gap: '8px',
};

const pendingMediaBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 10px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '8px',
  border: '1px solid var(--accent-primary)',
  position: 'relative',
};

const pendingMediaImgStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  objectFit: 'cover',
};

const removeMediaBtnStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: 'none',
  borderRadius: '50%',
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'var(--text-primary)',
  position: 'absolute',
  top: '-8px',
  right: '-8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
};
