import { useState } from 'react';
import { MessageCircle, BarChart3, Home, Send } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
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
                <Home size={18} />
                <span>Home</span>
              </button>
              <button 
                onClick={() => setActiveSection('data')}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg transition font-medium ${
                  activeSection === 'data' ? 'bg-purple-700 text-white shadow-md' : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <BarChart3 size={18} />
                <span>Data Overview</span>
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
        {/* Home Section */}
        {activeSection === 'home' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-bold text-gray-800">
                Welcome to GIA
              </h1>
              <p className="text-2xl text-gray-700">
                Gender and Development Center Information Assistant
              </p>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Your intelligent assistant for accessing and analyzing sex-disaggregated data at MSU-IIT
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100 mt-12">
              <h2 className="text-3xl font-semibold text-gray-800 mb-6">About GADC of MSU-IIT</h2>
              <div className="text-gray-700 space-y-4">
                <p className="text-lg leading-relaxed">
                  The Gender and Development Center (GADC) at Mindanao State University – Iligan Institute of Technology (MSU-IIT) was established to promote gender equality within the institution and its surrounding communities.
                </p>
                <p className="text-lg leading-relaxed">
                  Guided by Republic Act 7192 and national agencies, the GADC is tasked with integrating sex-disaggregated considerations into instruction, research, extension, and production activities.
                </p>
                <p className="text-lg leading-relaxed">
                  The Center serves as a hub for monitoring, evaluating, and reporting on institutional gender initiatives, ensuring compliance with national policies and contributing to more inclusive governance and academic planning.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white rounded-xl p-6 shadow-md border border-purple-100 hover:shadow-lg transition">
                <Home className="text-purple-600 mb-4" size={32} />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">About GADC</h3>
                <p className="text-gray-600">Learn about our mission, vision, and initiatives at MSU-IIT</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md border border-purple-100 hover:shadow-lg transition">
                <BarChart3 className="text-purple-600 mb-4" size={32} />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Data Analytics</h3>
                <p className="text-gray-600">Access comprehensive sex-disaggregated data and insights</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md border border-purple-100 hover:shadow-lg transition">
                <MessageCircle className="text-purple-600 mb-4" size={32} />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Assistant</h3>
                <p className="text-gray-600">Chat with GIA for instant data queries and analysis</p>
              </div>
            </div>
          </div>
        )}

        {/* Data Overview Section */}
        {activeSection === 'data' && (
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-gray-800 mb-8">Data Overview</h1>
            <div className="bg-white rounded-2xl p-12 shadow-lg border border-purple-100 text-center">
              <BarChart3 className="mx-auto text-purple-600 mb-4" size={64} />
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Visualizations Coming Soon</h2>
              <p className="text-gray-600 text-lg">
                Tables and graphs for MSU-IIT student and employee information will be displayed here.
              </p>
            </div>
          </div>
        )}

        {/* Chat Section */}
        {activeSection === 'chat' && (
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
        )}
      </div>
    </div>
  );
}

export default App;