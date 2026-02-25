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
    // These match your Excel sheet names exactly
    const collections = ['master_list', 'student_engagement', 'employee_specific', 'student_graduate'];
    const data = {};
    
    for (const collectionName of collections) {
      const docs = await getAllDocuments(collectionName);
      data[collectionName] = docs;
    }
    
    setDbData(data);
    setDataLoaded(true);
    // ... rest of your existing logic
  } catch (error) {
    console.error("Error loading multi-collection data:", error);
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
  <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
    {/* Decorative Background Orbs */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
    </div>

    {/* Navigation */}
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => setActiveSection('home')}>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl">
                <span className="text-white font-black text-xs tracking-tighter">GIA</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-slate-900 font-black text-sm uppercase tracking-tighter leading-none">MSU-IIT GADC</div>
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Information Assistant</div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50">
            <NavButton 
              active={activeSection === 'home'} 
              onClick={() => setActiveSection('home')}
              icon={<HomeIcon size={16} />}
              label="Home"
            />
            <NavButton 
              active={activeSection === 'data'} 
              onClick={() => setActiveSection('data')}
              icon={<BarChart3 size={16} />}
              label="Dashboard"
            />
            <NavButton 
              active={activeSection === 'chat'} 
              onClick={() => setActiveSection('chat')}
              icon={<MessageCircle size={16} />}
              label="Chat AI"
            />
          </div>
        </div>
      </div>
    </nav>

    {/* Main Content */}
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="transition-all duration-500 ease-in-out">
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
    </main>

    {/* Floating Chat Button */}
    <FloatingChatButton 
      onClick={() => setActiveSection('chat')}
      isOnChatPage={activeSection === 'chat'}
    />
  </div>
);

// Internal Helper for Navigation Buttons
function NavButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest ${
        active 
          ? 'bg-white text-purple-600 shadow-sm ring-1 ring-slate-200' 
          : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
}

export default App;