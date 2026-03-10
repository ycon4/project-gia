import { useState, useEffect } from 'react';
import { MessageCircle, BarChart3, Home as HomeIcon } from 'lucide-react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import EventsPage from './pages/EventsPage';
import RegistrationForm from './components/RegistrationForm';
import FloatingChatButton from './components/FloatingChatButton';
import { getAllDocuments, saveEvent, removeEvent } from '../firebase/services';
import { analyzeWithAI } from './services/aiService';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am GIA, the Gender and Development Center Information Assistant. I\'m loading the database now so I can help you analyze your data. How can I help you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // ✅ Conversation history for context awareness (role + content pairs for the API)
  const [chatHistory, setChatHistory] = useState([]);

  // Database state
  const [dbData, setDbData] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  // Kiosk/Registration State
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);

  // 1. Detect if this is a registration link on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');
    if (eventId) {
      setIsRegisterMode(true);
      setCurrentEventId(eventId);
    }
  }, []);

  // 2. Load database data
  useEffect(() => {
    loadDatabaseData();
  }, []);

  const loadDatabaseData = async () => {
    setIsLoadingData(true);
    try {
      const collections = ['attendance', 'employee_information', 'events', 'student_engagement', 'student_enrollment'];
      const data = {};
      for (const col of collections) {
        data[col] = await getAllDocuments(col);
      }
      setDbData(data);
      setEvents(data['events'] || []);
      setAttendance(data['attendance'] || []);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Handlers
  const handleCreateEvent = async (newEventData) => {
    try {
      const savedEvent = await saveEvent(newEventData);
      setEvents(prev => [savedEvent, ...prev]);
    } catch (error) {
      alert("Failed to save event to database.");
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await removeEvent(id);
        setEvents(prev => prev.filter(e => e.id !== id));
      } catch (error) {
        alert("Failed to delete event.");
      }
    }
  };

  const handleAttendanceSubmit = async (formData) => {
    try {
      await addDoc(collection(db, 'attendance'), {
        ...formData,
        eventId: currentEventId,
        timestamp: serverTimestamp()
      });
      const updatedAttendance = await getAllDocuments('attendance');
      setAttendance(updatedAttendance);
    } catch (error) {
      console.error("Attendance submission error:", error);
      throw error;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage('');

    // Update display messages
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages([...newMessages, { role: 'assistant', content: '🤔 Thinking...' }]);

    try {
      // ✅ Pass chatHistory for context awareness
      const reply = await analyzeWithAI(userMessage, dataLoaded ? dbData : {}, chatHistory);

      // Update display messages with real reply
      setMessages([...newMessages, { role: 'assistant', content: reply }]);

      // ✅ Update chat history with this turn (user message + assistant reply)
      // We store the original user message (not the enriched one) for cleaner history
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: reply }
      ]);

    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: "Error: " + error.message }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
      </div>

      {!isRegisterMode && (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
          <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => setActiveSection('home')}>
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                  <div className="relative w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center shadow-xl">
                    <span className="text-white font-black text-xs tracking-tighter">GIA</span>
                  </div>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-slate-900 font-black text-sm uppercase tracking-tighter leading-none">MSU-IIT GADC</div>
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Information Assistant</div>
                </div>
              </div>

              <div className="flex items-center p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                <NavButton active={activeSection === 'home'} onClick={() => setActiveSection('home')} icon={<HomeIcon size={16} />} label="Home" />
                <NavButton active={activeSection === 'event'} onClick={() => setActiveSection('event')} icon={<BarChart3 size={16} />} label="Events" />
                <NavButton active={activeSection === 'data'} onClick={() => setActiveSection('data')} icon={<BarChart3 size={16} />} label="Dashboard" />
                <NavButton active={activeSection === 'chat'} onClick={() => setActiveSection('chat')} icon={<MessageCircle size={16} />} label="Chat AI" />
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="w-full px-8 py-8">
        {isRegisterMode ? (
          <RegistrationForm
            eventName={events.find(e => e.id === currentEventId)?.title}
            onSubmit={handleAttendanceSubmit}
            currentCount={attendance.filter(a => String(a.eventId) === String(currentEventId)).length}
          />
        ) : (
          <div className="transition-all duration-500 ease-in-out">
            {activeSection === 'home' && <HomePage />}
            {activeSection === 'event' && (
              <EventsPage
                events={events}
                attendanceData={attendance}
                onCreateEvent={handleCreateEvent}
                onDeleteEvent={handleDeleteEvent}
              />
            )}
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
        )}
      </main>

      {!isRegisterMode && (
        <FloatingChatButton
          onClick={() => setActiveSection('chat')}
          isOnChatPage={activeSection === 'chat'}
        />
      )}
    </div>
  );
}

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

export default App;