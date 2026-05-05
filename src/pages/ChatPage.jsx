import { useState, useEffect, useRef } from 'react';
import { Send, Database, RefreshCw, Copy, Check, ArrowDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { updateDoc, doc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { analyzeWithAI } from '../services/aiService';
import ChatChart from '../components/chat/ChatChart';

const makeWelcome = (name) => ({
  role: 'assistant',
  content: `Hello${name ? `, ${name}` : ''}! I'm **GIA**, the Gender and Development Center Information Assistant. I can help you analyze enrollment, engagement, employee, attendance, and events data. What would you like to know?`,
  timestamp: null,
});

export default function ChatPage({
  dbData, isLoadingData, dataLoaded, user, displayName, onRefreshData,
  conversations, setConversations, activeConvId, setActiveConvId,
}) {
  const [messages, setMessages] = useState(() => [makeWelcome(displayName)]);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [lastDataUpdate, setLastDataUpdate] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const totalRecords = Object.values(dbData).reduce(
    (sum, docs) => sum + (Array.isArray(docs) ? docs.length : 0), 0
  );

  // Set initial data update time when data loads
  useEffect(() => {
    if (dataLoaded && !lastDataUpdate) {
      setLastDataUpdate(new Date());
    }
  }, [dataLoaded]);

  // Format relative time for data freshness
  const getRelativeTime = (date) => {
    if (!date) return null;
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConvId === null) {
      setMessages([makeWelcome(displayName)]);
      setChatHistory([]);
      setInputMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } else {
      const conv = conversations.find(c => c.id === activeConvId);
      if (conv) {
        setMessages(conv.messages?.length ? conv.messages : [makeWelcome(displayName)]);
        setChatHistory((conv.messages || []).map(m => ({ role: m.role, content: m.content })));
      }
      setInputMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle scroll to show/hide scroll-to-bottom button
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom && messages.length > 3);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  };

  const copyTableToClipboard = async (content, messageId) => {
    try {
      // Extract table from markdown
      const tableMatch = content.match(/\|[\s\S]*?\|/g);
      if (tableMatch) {
        const tableText = tableMatch.join('\n');
        await navigator.clipboard.writeText(tableText);
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
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

  const exampleQuestions = [
    "Male and female students enrolled in 2024-2025",
    "PWD students by college and gender",
    "Male and female students in CCS",
    "Students by province disaggregated by sex",
    "Compare male and female enrollment across colleges",
    "Events by type and participant gender"
  ];

  const handleExampleClick = (question) => {
    setInputMessage(question);
    textareaRef.current?.focus();
  };

  // Detect if message contains an error and should show suggestions
  const isErrorMessage = (content) => {
    const errorPatterns = [
      /could not determine/i,
      /don't have information/i,
      /couldn't understand/i,
      /sorry.*can't/i,
      /not available in the current data/i,
      /unable to/i,
      /cannot find/i,
      /no data/i,
      /please rephrase/i,
      /provide more context/i,
      /accidentally typed/i,
      /random characters/i,
      /unclear/i,
      /didn't quite understand/i,
    ];
    return errorPatterns.some(pattern => pattern.test(content));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 overflow-hidden">

      {/* ── Welcome screen ── */}
      {isWelcomeScreen ? (
        <div className="flex-1 flex items-center justify-center px-8 pb-1 select-none">
          <div className="flex flex-col items-start w-full max-w-2xl">
            <div className="w-full">
              <h1 className="text-p4-3xl font-bold text-neutral-800 dark:text-neutral-100 leading-tight mb-1">
                What would you<br />like to know{displayName ? `, ${displayName}` : ''}?
              </h1>
              <p className="text-p4-base text-neutral-400 dark:text-neutral-500 leading-relaxed mb-3">
                Ask about enrollment, engagement, employees, attendance, or events data.
              </p>
              {isLoadingData ? (
                <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500 text-p4-sm mb-6">
                  <RefreshCw size={13} className="animate-spin" /> Loading database...
                </div>
              ) : dataLoaded ? (
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500 text-p4-sm">
                    <Database size={13} className="text-green-400" />
                    {totalRecords.toLocaleString()} records ready
                    {onRefreshData && (
                      <button
                        onClick={() => {
                          onRefreshData();
                          setLastDataUpdate(new Date());
                        }}
                        className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400 transition ml-1"
                      >
                        <RefreshCw size={12} />
                      </button>
                    )}
                  </div>
                  {lastDataUpdate && (
                    <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">
                      Last updated: {getRelativeTime(lastDataUpdate)}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Example Questions */}
              <div className="mt-6">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">Try asking:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {exampleQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(question)}
                      className="group text-left px-3 py-2 text-xs text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:bg-gia-50 dark:hover:bg-gia-950/30 border border-neutral-200 dark:border-neutral-700 hover:border-gia-300 dark:hover:border-gia-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                    >
                      <span className="flex items-start gap-2">
                        <span className="text-gia-400 dark:text-gia-500 mt-0.5 group-hover:text-gia-600 dark:group-hover:text-gia-400 transition-colors text-[10px]">•</span>
                        <span className="flex-1">{question}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Message list ── */
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
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
                          {/* Copy button for messages with tables */}
                          {msg.content.includes('|') && msg.content.includes('---') && (
                            <div className="flex justify-end mb-2">
                              <button
                                onClick={() => copyTableToClipboard(msg.content, idx)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-gia-600 dark:hover:text-gia-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200"
                                title="Copy table to clipboard"
                              >
                                {copiedMessageId === idx ? (
                                  <>
                                    <Check size={14} className="text-green-500" />
                                    <span className="text-green-500">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={14} />
                                    <span>Copy table</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                          <div className="prose prose-sm max-w-none markdown-content">
                            <style>{`
                              .markdown-content table thead th { color: white !important; }
                              .markdown-content tbody tr:nth-child(even) { background-color: rgba(249, 250, 251, 0.5); }
                              .markdown-content tbody tr:hover { background-color: rgba(139, 92, 246, 0.05); transition: background-color 0.15s ease; }
                              .dark .markdown-content tbody tr:nth-child(even) { background-color: rgba(23, 23, 23, 0.3); }
                              .dark .markdown-content tbody tr:hover { background-color: rgba(139, 92, 246, 0.1); }
                              .markdown-content strong { color: #7c3aed; font-weight: 600; }
                              .dark .markdown-content strong { color: #a78bfa; }
                              .markdown-content h2 { border-bottom: 2px solid rgba(139, 92, 246, 0.1); padding-bottom: 0.5rem; }
                              .markdown-content ul li::marker { color: #8b5cf6; }
                            `}</style>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-4 mb-3 font-sans" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mt-3 mb-2 font-sans" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mt-3 mb-2 font-sans" {...props} />,
                                p: ({ node, ...props }) => <p className="text-gray-700 dark:text-slate-300 mb-3 leading-relaxed" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-slate-100" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-3 space-y-1" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-3 space-y-1" {...props} />,
                                li: ({ node, ...props }) => <li className="text-gray-700 dark:text-slate-300 leading-relaxed" {...props} />,
                                table: ({ node, ...props }) => (
                                  <div className="overflow-x-auto my-4 font-sans">
                                    <table className="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm" {...props} />
                                  </div>
                                ),
                                thead: ({ node, ...props }) => <thead className="bg-gradient-to-r from-gia-600 to-gia-700" {...props} />,
                                th: ({ node, children, ...props }) => (
                                  <th className="px-4 py-3 text-left font-bold text-xs tracking-wide border-r border-gia-500 last:border-r-0 text-white font-sans" {...props}>{children}</th>
                                ),
                                td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-300 border-b border-gray-100 dark:border-neutral-700 font-sans" {...props} />,
                                tbody: ({ node, ...props }) => <tbody className="bg-white dark:bg-neutral-800/50 divide-y divide-gray-100 dark:divide-neutral-700" {...props} />,
                                code: ({ node, inline, ...props }) => (
                                  inline
                                    ? <code className="bg-gia-50 dark:bg-gia-950/50 text-gia-700 dark:text-gia-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                                    : <code className="block bg-gray-900 dark:bg-neutral-800 text-gray-100 p-4 rounded-lg my-3 overflow-x-auto font-mono text-xs" {...props} />
                                ),
                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gia-300 dark:border-gia-700 pl-4 py-1 my-3 italic text-gray-500 dark:text-slate-400 bg-gia-50/50 dark:bg-gia-950/30 rounded-r" {...props} />,
                                hr: ({ node, ...props }) => <hr className="my-4 border-gray-100 dark:border-neutral-700" {...props} />,
                                a: ({ node, ...props }) => <a className="text-gia-600 dark:text-gia-400 hover:underline font-sans" target="_blank" rel="noreferrer" {...props} />,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          {msg.chartData && <ChatChart chartData={msg.chartData} />}

                          {/* Show suggestions on error messages */}
                          {isErrorMessage(msg.content) && (
                            <div className="mt-2 p-2 bg-gia-50/50 dark:bg-gia-950/20 border border-gia-200/50 dark:border-gia-800/50 rounded-md">
                              <p className="text-[10px] font-medium text-gia-600 dark:text-gia-400 mb-1.5">
                                💡 Try:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {exampleQuestions.slice(0, 4).map((question, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleExampleClick(question)}
                                    className="text-[10px] text-gia-600 dark:text-gia-400 hover:text-gia-700 dark:hover:text-gia-300 hover:underline transition-colors"
                                  >
                                    {question}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {msg.timestamp && (
                    <span className="text-[10px] text-neutral-300 dark:text-neutral-600 mt-1 px-1 font-sans">
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

      {/* ── Scroll to Bottom Button ── */}
      {showScrollButton && !isWelcomeScreen && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-28 right-8 bg-white dark:bg-neutral-800 hover:bg-gia-50 dark:hover:bg-gia-950/50 text-neutral-600 dark:text-neutral-300 hover:text-gia-600 dark:hover:text-gia-400 p-3 rounded-full shadow-lg hover:shadow-xl border border-neutral-200 dark:border-neutral-700 transition-all duration-200 z-10"
          title="Scroll to bottom"
        >
          <ArrowDown size={20} />
        </button>
      )}

      {/* ── Input ── */}
      <div className="px-6 py-4 bg-white dark:bg-neutral-950 shrink-0">
        <form onSubmit={handleSendMessage}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl px-4 py-3 focus-within:border-neutral-400 dark:focus-within:border-neutral-500 focus-within:ring-2 focus-within:ring-neutral-200 dark:focus-within:ring-neutral-700/50 transition-all">
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
                className="flex-1 bg-transparent resize-none text-gray-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none text-sm leading-relaxed"
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
            <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-2 text-center font-sans">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
