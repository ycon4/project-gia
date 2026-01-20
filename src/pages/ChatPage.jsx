import { Send, Database, RefreshCw } from 'lucide-react';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage({ 
  messages, 
  inputMessage, 
  setInputMessage, 
  handleSendMessage,
  dbData = {},
  isLoadingData = false,
  dataLoaded = false,
  onRefreshData
}) {
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollbarStyle = {
    scrollbarWidth: 'thin',
    scrollbarColor: '#a78bfa #e5e7eb'
  };

  const totalRecords = Object.values(dbData).reduce((sum, docs) => sum + docs.length, 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Chat with GIA</h1>
        
        {/* Database Status */}
        <div className="flex items-center space-x-3">
          {isLoadingData ? (
            <div className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
              <RefreshCw size={16} className="animate-spin" />
              <span className="text-sm font-medium">Loading database...</span>
            </div>
          ) : dataLoaded ? (
            <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
              <Database size={16} />
              <span className="text-sm font-medium">
                {totalRecords} records loaded
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg">
              <Database size={16} />
              <span className="text-sm font-medium">Database not loaded</span>
            </div>
          )}
          
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              disabled={isLoadingData}
              className="flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoadingData ? 'animate-spin' : ''} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden flex flex-col" style={{ height: '75vh' }}>
        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
          style={scrollbarStyle}
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-2xl px-6 py-4 ${
                msg.role === 'user' 
                  ? 'bg-purple-600 text-white shadow-md max-w-2xl' 
                  : 'bg-white text-gray-800 border border-purple-100 shadow-sm max-w-6xl'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="max-w-none markdown-content">
                    <style>{`
                      .markdown-content table thead th {
                        color: white !important;
                      }
                    `}</style>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Headings
                        h1: ({node, ...props}) => (
                          <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 pb-2 border-b-2 border-purple-200" {...props} />
                        ),
                        h2: ({node, ...props}) => (
                          <h2 className="text-xl font-bold text-gray-900 mt-5 mb-3" {...props} />
                        ),
                        h3: ({node, ...props}) => (
                          <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2" {...props} />
                        ),
                        
                        // Paragraphs
                        p: ({node, ...props}) => (
                          <p className="text-gray-700 mb-4 leading-relaxed" {...props} />
                        ),
                        
                        // Strong/Bold
                        strong: ({node, ...props}) => (
                          <strong className="font-bold text-gray-900" {...props} />
                        ),
                        
                        // Lists
                        ul: ({node, ...props}) => (
                          <ul className="list-disc pl-6 my-4 space-y-2" {...props} />
                        ),
                        ol: ({node, ...props}) => (
                          <ol className="list-decimal pl-6 my-4 space-y-2" {...props} />
                        ),
                        li: ({node, ...props}) => (
                          <li className="text-gray-700 leading-relaxed" {...props} />
                        ),
                        
                        // Tables
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-6">
                            <table className="min-w-full border-collapse rounded-lg overflow-hidden shadow-md" {...props} />
                          </div>
                        ),
                        thead: ({node, ...props}) => (
                          <thead className="bg-gradient-to-r from-purple-600 to-purple-700" {...props} />
                        ),
                        th: ({node, children, ...props}) => (
                          <th className="px-6 py-4 text-left font-bold text-sm tracking-wide border-r border-purple-500 last:border-r-0 [&]:!text-white [&>*]:!text-white" {...props}>
                            {children}
                          </th>
                        ),
                        td: ({node, ...props}) => (
                          <td className="px-6 py-4 text-gray-700 border-b border-gray-200 hover:bg-purple-50 transition-colors duration-150" {...props} />
                        ),
                        tbody: ({node, ...props}) => (
                          <tbody className="bg-white divide-y divide-gray-200" {...props} />
                        ),
                        
                        // Code blocks
                        code: ({node, inline, ...props}) => (
                          inline 
                            ? <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-mono" {...props} />
                            : <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm" {...props} />
                        ),
                        
                        // Blockquotes
                        blockquote: ({node, ...props}) => (
                          <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 italic text-gray-600 bg-purple-50 rounded-r" {...props} />
                        ),
                        
                        // Horizontal rule
                        hr: ({node, ...props}) => (
                          <hr className="my-6 border-t-2 border-purple-200" {...props} />
                        ),
                        
                        // Links
                        a: ({node, ...props}) => (
                          <a className="text-purple-600 hover:text-purple-800 underline font-medium" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-purple-100">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
              placeholder="Ask GIA about gender-disaggregated data..."
              className="flex-1 bg-gray-50 border border-purple-200 rounded-xl px-6 py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-8 py-4 flex items-center space-x-2 transition shadow-md hover:shadow-lg"
            >
              <Send size={20} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}