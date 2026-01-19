import { useState } from 'react';
import { MessageCircle, BarChart3, Home as HomeIcon } from 'lucide-react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import FloatingChatButton from './components/FloatingChatButton';

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am GIA, the Gender and Development Center Information Assistant. How can I help you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    setMessages([...messages, 
      { role: 'user', content: inputMessage },
      { role: 'assistant', content: 'This is a placeholder response. The AI model will be integrated later.' }
    ]);
    setInputMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
      {/* Navigation */}
      <nav className="bg-white shadow-md border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">GIA</span>
              </div>
              <div>
                <div className="text-gray-800 font-bold text-lg">GIA</div>
                <div className="text-gray-600 text-sm">Gender and Development Center Information Assistant</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setActiveSection('home')}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition font-medium ${
                  activeSection === 'home' ? 'bg-purple-700 text-white shadow-md' : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <HomeIcon size={18} />
                <span>Home</span>
              </button>
              <button 
                onClick={() => setActiveSection('data')}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition font-medium ${
                  activeSection === 'data' ? 'bg-purple-700 text-white shadow-md' : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <BarChart3 size={18} />
                <span>Dashboard</span>
              </button>
              <button 
                onClick={() => setActiveSection('chat')}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition font-medium ${
                  activeSection === 'chat' ? 'bg-purple-700 text-white shadow-md' : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <MessageCircle size={18} />
                <span>Chat with GIA</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {activeSection === 'home' && <HomePage />}
        {activeSection === 'data' && <DashboardPage />}
        {activeSection === 'chat' && (
          <ChatPage 
            messages={messages}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
          />
        )}
      </div>

      {/* Floating Chat Button */}
      <FloatingChatButton 
        onClick={() => setActiveSection('chat')}
        isOnChatPage={activeSection === 'chat'}
      />
    </div>
  );
}

export default App;