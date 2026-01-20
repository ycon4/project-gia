import { useState, useEffect } from 'react';
import { MessageCircle, BarChart3, Home as HomeIcon } from 'lucide-react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import FloatingChatButton from './components/FloatingChatButton';
import { getAllDocuments } from '../firebase/services';
import { prepareDataContext } from './services/aiService';

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am GIA, the Gender and Development Center Information Assistant. I\'m loading the database now so I can help you analyze your data. How can I help you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Database state
  const [dbData, setDbData] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load database data on mount
  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Test backend connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        const data = await response.json();
        console.log('✅ Backend connected:', data);
      } catch (error) {
        console.error('❌ Backend connection failed:', error);
      }
    };
    testConnection();
  }, []);

  const loadDatabaseData = async () => {
    setIsLoadingData(true);
    try {
      // Update this array with your actual collection names
      const collections = ['students'];
      const data = {};
      
      console.log('📊 Loading database collections...');
      
      for (const collectionName of collections) {
        try {
          const docs = await getAllDocuments(collectionName);
          data[collectionName] = docs;
          console.log(`✅ Loaded ${docs.length} documents from ${collectionName}`);
        } catch (error) {
          console.warn(`⚠️ Could not load collection ${collectionName}:`, error);
          data[collectionName] = [];
        }
      }
      
      setDbData(data);
      setDataLoaded(true);
      
      const totalRecords = Object.values(data).reduce((sum, docs) => sum + docs.length, 0);
      console.log(`✅ Database loaded: ${totalRecords} total records`);
      
      // Update welcome message with data info
      setMessages([{
        role: 'assistant',
        content: `Hello! I am GIA, the Gender and Development Center Information Assistant. I've loaded **${totalRecords} records** from your database. I can now help you analyze:\n\n${Object.entries(data).map(([col, docs]) => `- **${col}**: ${docs.length} records`).join('\n')}\n\nWhat would you like to know?`
      }]);
      
    } catch (error) {
      console.error('❌ Error loading database data:', error);
      setMessages([{
        role: 'assistant',
        content: 'Hello! I am GIA. I encountered an issue loading the database. I can still chat with you, but I won\'t have access to data analysis features.'
      }]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    const userMessage = inputMessage;
    setInputMessage('');
    
    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    
    // Add loading message
    setMessages([...newMessages, { role: 'assistant', content: '🤔 Thinking...' }]);
    
    try {
      // Auto-detect: use localhost for local dev, /api/chat for production
      const hostname = window.location.hostname;
      const apiUrl = hostname === 'localhost' 
        ? 'http://localhost:3001/api/chat'  // Local development
        : '/api/chat';                       // Production (Vercel)
      
      console.log('Hostname:', hostname);
      console.log('Using API URL:', apiUrl);
      
      // Prepare message - SMART CONTEXT DETECTION
      let messageToSend = userMessage;
      
      // Keywords that suggest the user wants data analysis
      const dataKeywords = [
        'analyze', 'analysis', 'data', 'show', 'display', 'list',
        'how many', 'count', 'total', 'number of',
        'students', 'records', 'entries',
        'summary', 'report', 'statistics', 'stats',
        'find', 'search', 'filter', 'where',
        'average', 'mean', 'median', 'sum',
        'gender', 'age', 'course', 'year',
        'breakdown', 'distribution', 'group',
        'compare', 'comparison', 'versus', 'vs',
        'trend', 'pattern', 'insight'
      ];
      
      // Check if the user message contains any data-related keywords
      const lowerMessage = userMessage.toLowerCase();
      const isDataQuery = dataKeywords.some(keyword => lowerMessage.includes(keyword));
      
      // If database is loaded AND user is asking about data, include context
      if (dataLoaded && Object.keys(dbData).length > 0 && isDataQuery) {
        const dataContext = prepareDataContext(dbData);
        messageToSend = `${dataContext}

=== USER QUESTION ===
${userMessage}

Please analyze the data above and answer the user's question. Use tables, lists, and proper markdown formatting in your response.`;
        
        console.log('📤 Sending message WITH database context (data query detected)');
      } else {
        console.log('📤 Sending casual message WITHOUT database context');
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const assistantMessage = data.reply || "I apologize, I couldn't generate a response.";
      
      // Replace loading message with actual response
      setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);
      
    } catch (error) {
      console.error('❌ Error:', error);
      
      let errorMessage = "I'm sorry, I encountered an error. ";
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage += "Please make sure the backend server is running on http://localhost:3001";
      } else if (error.message.includes('503')) {
        errorMessage = "The AI model is currently loading. Please wait about 20-30 seconds and try again.";
      } else {
        errorMessage += "Please try again. Error: " + error.message;
      }
      
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: errorMessage
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
      {/* Navigation */}
      <nav className="bg-white shadow-md border-b border-purple-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between w-full">
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
            dbData={dbData}
            isLoadingData={isLoadingData}
            dataLoaded={dataLoaded}
            onRefreshData={loadDatabaseData}
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