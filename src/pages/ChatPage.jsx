import { useState, useEffect, useRef } from 'react';
import { Send, Database, RefreshCw } from 'lucide-react';
import giaLogo from '../assets/GIA Logo.svg';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { updateDoc, doc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { analyzeWithAI } from '../services/aiService';
import ChatChart from '../components/chat/ChatChart';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hello! I'm **GIA**, the Gender and Development Center Information Assistant. I can help you analyze enrollment, engagement, employee, attendance, and events data. What would you like to know?",
  timestamp: null,
};

export default function ChatPage({
  dbData, isLoadingData, dataLoaded, user, onRefreshData,
  conversations, setConversations, activeConvId, setActiveConvId,
}) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const totalRecords = Object.values(dbData).reduce(
    (sum, docs) => sum + (Array.isArray(docs) ? docs.length : 0), 0
  );

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConvId === null) {
      setMessages([WELCOME_MESSAGE]);
      setChatHistory([]);
      setInputMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } else {
      const conv = conversations.find(c => c.id === activeConvId);
      if (conv) {
        setMessages(conv.messages?.length ? conv.messages : [WELCOME_MESSAGE]);
        setChatHistory((conv.messages || []).map(m => ({ role: m.role, content: m.content })));
      }
      setInputMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  };

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
      setChatHistory([
        ...chatHistory,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: result.reply },
      ]);

      await persistConversation(finalMessages, trimmed);
    } catch {
      setMessages([...withUser, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const persistConversation = async (finalMessages, firstUserText) => {
    if (!user) return;
    const toSave = finalMessages.filter(m => m.timestamp !== null);
    const now = new Date().toISOString();

    if (activeConvId) {
      await updateDoc(doc(db, 'conversations', activeConvId), { messages: toSave, updatedAt: now });
      setConversations(prev =>
        prev.map(c => c.id === activeConvId ? { ...c, messages: toSave, updatedAt: now } : c)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    } else {
      const title = firstUserText.length > 45 ? firstUserText.substring(0, 45) + '…' : firstUserText;
      const newConv = { userId: user.uid, title, messages: toSave, createdAt: now, updatedAt: now };
      const docRef = await addDoc(collection(db, 'conversations'), newConv);
      const created = { id: docRef.id, ...newConv };
      setActiveConvId(docRef.id);
      setConversations(prev => [created, ...prev]);
    }
  };

  const isWelcomeScreen = messages.length === 1 && messages[0].timestamp === null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 overflow-hidden">

      {/* ── Welcome screen ── */}
      {isWelcomeScreen ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-12 select-none">
          <div className="mb-6">
            <img src={giaLogo} alt="GIA" className="w-16 h-16 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(22%) sepia(90%) saturate(2500%) hue-rotate(272deg) brightness(0.9)' }} />
          </div>
          <h1 className="text-p4-3xl font-bold text-slate-800 dark:text-slate-100 text-center leading-tight mb-3 max-w-lg">
            What would you like to know?
          </h1>
          <p className="text-p4-base text-slate-400 dark:text-slate-500 text-center max-w-sm leading-relaxed">
            Ask about enrollment, engagement, employees, attendance, or events data.
          </p>

          <div className="mt-8">
            {isLoadingData ? (
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-p4-sm">
                <RefreshCw size={13} className="animate-spin" /> Loading database...
              </div>
            ) : dataLoaded ? (
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-p4-sm">
                <Database size={13} className="text-green-400" />
                {totalRecords.toLocaleString()} records ready
                {onRefreshData && (
                  <button onClick={onRefreshData} className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition ml-1">
                    <RefreshCw size={12} />
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* ── Message list ── */
        <div
          className="flex-1 overflow-y-auto py-6"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
        >
          <div className="max-w-3xl mx-auto px-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  {msg.role === 'user' ? (
                    <div className="bg-neutral-200 dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="text-gray-800 dark:text-slate-200 text-sm leading-relaxed w-full">
                      {msg.content === '🤔 Thinking...' ? (
                        <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 italic text-sm font-sans">
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-gia-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-gia-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-gia-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-4 mb-3 font-sans" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mt-3 mb-2 font-sans" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mt-3 mb-2 font-sans" {...props} />,
                                p: ({node, ...props}) => <p className="text-gray-700 dark:text-slate-300 mb-3 leading-relaxed" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-slate-100" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-3 space-y-1" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-3 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="text-gray-700 dark:text-slate-300 leading-relaxed" {...props} />,
                                table: ({node, ...props}) => (
                                  <div className="overflow-x-auto my-4 font-sans">
                                    <table className="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm" {...props} />
                                  </div>
                                ),
                                thead: ({node, ...props}) => <thead className="bg-gradient-to-r from-gia-600 to-gia-700" {...props} />,
                                th: ({node, children, ...props}) => (
                                  <th className="px-4 py-3 text-left font-bold text-xs tracking-wide border-r border-gia-500 last:border-r-0 text-white font-sans" {...props}>{children}</th>
                                ),
                                td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-300 border-b border-gray-100 dark:border-neutral-700 font-sans" {...props} />,
                                tbody: ({node, ...props}) => <tbody className="bg-white dark:bg-neutral-800/50 divide-y divide-gray-100 dark:divide-neutral-700" {...props} />,
                                code: ({node, inline, ...props}) => (
                                  inline
                                    ? <code className="bg-gia-50 dark:bg-gia-950/50 text-gia-700 dark:text-gia-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                                    : <code className="block bg-gray-900 dark:bg-neutral-800 text-gray-100 p-4 rounded-lg my-3 overflow-x-auto font-mono text-xs" {...props} />
                                ),
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gia-300 dark:border-gia-700 pl-4 py-1 my-3 italic text-gray-500 dark:text-slate-400 bg-gia-50/50 dark:bg-gia-950/30 rounded-r" {...props} />,
                                hr: ({node, ...props}) => <hr className="my-4 border-gray-100 dark:border-neutral-700" {...props} />,
                                a: ({node, ...props}) => <a className="text-gia-600 dark:text-gia-400 hover:underline font-sans" target="_blank" rel="noreferrer" {...props} />,
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

                  {msg.timestamp && (
                    <span className="text-[10px] text-gray-300 dark:text-slate-600 mt-1 px-1 font-sans">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 shrink-0">
        <form onSubmit={handleSendMessage}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl px-4 py-3 focus-within:border-gia-300 dark:focus-within:border-gia-700 focus-within:ring-2 focus-within:ring-gia-100 dark:focus-within:ring-gia-900/40 transition-all">
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
                className="flex-1 bg-transparent resize-none text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none text-sm leading-relaxed"
                style={{ scrollbarWidth: 'none', maxHeight: '160px' }}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isThinking}
                className="shrink-0 w-8 h-8 bg-gia-600 hover:bg-gia-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all duration-200"
              >
                <Send size={13} />
              </button>
            </div>
            <p className="text-[10px] text-gray-300 dark:text-slate-600 mt-2 text-center font-sans">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
