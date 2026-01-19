import { Send } from 'lucide-react';

export default function ChatPage({ messages, inputMessage, setInputMessage, handleSendMessage }) {
  return (
    <div className="space-y-6">
      <h1 className="text-5xl font-bold text-gray-800 mb-8">Chat with GIA</h1>
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden flex flex-col" style={{ height: '70vh' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl rounded-2xl px-6 py-4 ${
                msg.role === 'user' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-white text-gray-800 border border-purple-100 shadow-sm'
              }`}>
                <p className="text-sm font-semibold mb-1">
                  {msg.role === 'user' ? 'You' : 'GIA'}
                </p>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
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