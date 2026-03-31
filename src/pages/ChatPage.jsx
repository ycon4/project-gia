import { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2, MessageSquare, Database, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { analyzeWithAI } from '../services/aiService';
import ChatChart from '../components/chat/ChatChart';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hello! I'm **GIA**, the Gender and Development Center Information Assistant. I can help you analyze enrollment, engagement, employee, attendance, and events data. What would you like to know?",
  timestamp: null,
};

export default function ChatPage({ dbData, isLoadingData, dataLoaded, user, onRefreshData }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const totalRecords = Object.values(dbData).reduce(
    (sum, docs) => sum + (Array.isArray(docs) ? docs.length : 0), 0
  );

  // ── Load conversations on mount ──────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(collection(db, 'conversations'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const convs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setConversations(convs);
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        setLoadingConvs(false);
      }
    })();
  }, [user]);

  // ── Scroll to bottom on new messages ─────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto-resize textarea ──────────────────────────────────
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  };

  // ── New conversation ──────────────────────────────────────
  const startNewConversation = () => {
    setActiveConvId(null);
    setMessages([WELCOME_MESSAGE]);
    setChatHistory([]);
    setInputMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // ── Select conversation ───────────────────────────────────
  const selectConversation = (conv) => {
    setActiveConvId(conv.id);
    setMessages(conv.messages?.length ? conv.messages : [WELCOME_MESSAGE]);
    setChatHistory(
      (conv.messages || []).map(m => ({ role: m.role, content: m.content }))
    );
    setInputMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // ── Delete conversation ───────────────────────────────────
  const deleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'conversations', convId));
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConvId === convId) startNewConversation();
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  // ── Send message ──────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isThinking) return;

    setInputMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsThinking(true);

    const userMsg = { role: 'user', content: trimmed, timestamp: new Date().toISOString() };
    const thinkingMsg = { role: 'assistant', content: '🤔 Thinking...', timestamp: null };
    const withUser = [...messages, userMsg];
    setMessages([...withUser, thinkingMsg]);

    try {
      const result = await analyzeWithAI(trimmed, dataLoaded ? dbData : {}, chatHistory);

      const assistantMsg = {
        role: 'assistant',
        content: result.reply,
        chartData: result.chartData ? JSON.parse(JSON.stringify(result.chartData)) : null,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...withUser, assistantMsg];
      setMessages(finalMessages);

      const newHistory = [
        ...chatHistory,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: result.reply },
      ];
      setChatHistory(newHistory);

      // Persist to Firestore
      await persistConversation(finalMessages, trimmed);
    } catch (err) {
      setMessages([...withUser, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  // ── Save/update conversation in Firestore ─────────────────
  const persistConversation = async (finalMessages, firstUserText) => {
    if (!user) return;

    // Strip welcome placeholder before saving
    const toSave = finalMessages.filter(m => m.timestamp !== null);
    const now = new Date().toISOString();

    if (activeConvId) {
      await updateDoc(doc(db, 'conversations', activeConvId), {
        messages: toSave,
        updatedAt: now,
      });
      setConversations(prev =>
        prev.map(c => c.id === activeConvId ? { ...c, messages: toSave, updatedAt: now } : c)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    } else {
      const title = firstUserText.length > 45
        ? firstUserText.substring(0, 45) + '…'
        : firstUserText;

      const newConv = { userId: user.uid, title, messages: toSave, createdAt: now, updatedAt: now };
      const docRef = await addDoc(collection(db, 'conversations'), newConv);
      const created = { id: docRef.id, ...newConv };
      setActiveConvId(docRef.id);
      setConversations(prev => [created, ...prev]);
    }
  };

  // ── Relative time ─────────────────────────────────────────
  const relTime = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  };

  return (
    <div
      className="-mx-8 -mt-8 flex overflow-hidden rounded-b-none"
      style={{ height: 'calc(100vh - 4.5rem)' }}
    >
      {/* ════════════════ SIDEBAR ════════════════ */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0 select-none">

        {/* New chat */}
        <div className="p-3 border-b border-slate-700/40">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all duration-150 text-xs font-semibold"
          >
            <Plus size={14} />
            New conversation
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
          {loadingConvs ? (
            <p className="text-slate-500 text-[11px] text-center py-8">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-slate-500 text-[11px] text-center py-8">No conversations yet</p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-100 group flex items-start gap-2 ${
                  activeConvId === conv.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                }`}
              >
                <MessageSquare size={13} className="shrink-0 mt-0.5 opacity-50" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate leading-snug">{conv.title}</p>
                  <p className="text-[9px] opacity-40 mt-0.5">{relTime(conv.updatedAt)}</p>
                </div>
                <span
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-400 transition p-0.5 mt-0.5"
                >
                  <Trash2 size={11} />
                </span>
              </button>
            ))
          )}
        </div>

        {/* DB status */}
        <div className="px-4 py-3 border-t border-slate-700/40">
          {isLoadingData ? (
            <div className="flex items-center gap-2 text-blue-400 text-[11px]">
              <RefreshCw size={11} className="animate-spin" /> Loading database...
            </div>
          ) : dataLoaded ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-green-400 text-[11px]">
                <Database size={11} /> {totalRecords.toLocaleString()} records loaded
              </div>
              {onRefreshData && (
                <button onClick={onRefreshData} className="text-slate-600 hover:text-slate-300 transition">
                  <RefreshCw size={11} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-yellow-400 text-[11px]">
              <Database size={11} /> Database not loaded
            </div>
          )}
        </div>
      </aside>

      {/* ════════════════ MAIN CHAT ════════════════ */}
      <div className="flex-1 flex flex-col bg-white min-w-0">

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto py-6"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
        >
          <div className="max-w-3xl mx-auto px-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-white font-black text-[8px]">GIA</span>
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-purple-600 font-bold text-[9px]">YOU</span>
                  </div>
                )}

                {/* Content */}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  {msg.role === 'user' ? (
                    <div className="bg-purple-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="text-gray-800 text-sm leading-relaxed w-full">
                      {msg.content === '🤔 Thinking...' ? (
                        <div className="flex items-center gap-2 text-gray-400 italic text-sm">
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                          Thinking...
                        </div>
                      ) : (
                        <>
                          <div className="prose prose-sm max-w-none markdown-content">
                            <style>{`.markdown-content table thead th { color: white !important; }`}</style>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 mt-4 mb-3" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-900 mt-3 mb-2" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-base font-semibold text-gray-800 mt-3 mb-2" {...props} />,
                                p: ({node, ...props}) => <p className="text-gray-700 mb-3 leading-relaxed" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-3 space-y-1" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-3 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="text-gray-700 leading-relaxed" {...props} />,
                                table: ({node, ...props}) => (
                                  <div className="overflow-x-auto my-4">
                                    <table className="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm" {...props} />
                                  </div>
                                ),
                                thead: ({node, ...props}) => <thead className="bg-gradient-to-r from-purple-600 to-purple-700" {...props} />,
                                th: ({node, children, ...props}) => (
                                  <th className="px-4 py-3 text-left font-bold text-xs tracking-wide border-r border-purple-500 last:border-r-0 text-white" {...props}>{children}</th>
                                ),
                                td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100" {...props} />,
                                tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-100" {...props} />,
                                code: ({node, inline, ...props}) => (
                                  inline
                                    ? <code className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                                    : <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg my-3 overflow-x-auto font-mono text-xs" {...props} />
                                ),
                                blockquote: ({node, ...props}) => <blockquote className="border-l-3 border-purple-400 pl-4 py-1 my-3 italic text-gray-500 bg-purple-50/50 rounded-r" {...props} />,
                                hr: ({node, ...props}) => <hr className="my-4 border-gray-100" {...props} />,
                                a: ({node, ...props}) => <a className="text-purple-600 hover:underline" target="_blank" rel="noreferrer" {...props} />,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          {msg.chartData && <ChatChart chartData={msg.chartData} />}
                        </>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  {msg.timestamp && (
                    <span className="text-[10px] text-gray-300 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white shrink-0">
          <form onSubmit={handleSendMessage}>
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => { setInputMessage(e.target.value); resizeTextarea(); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Ask about enrollment, employees, attendance, events..."
                  rows={1}
                  className="flex-1 bg-transparent resize-none text-gray-800 placeholder-gray-400 focus:outline-none text-sm leading-relaxed"
                  style={{ scrollbarWidth: 'none', maxHeight: '160px' }}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isThinking}
                  className="shrink-0 w-8 h-8 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all duration-200"
                >
                  <Send size={13} />
                </button>
              </div>
              <p className="text-[10px] text-gray-300 mt-2 text-center">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
