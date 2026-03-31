import { useState, useEffect, useMemo } from 'react';
import { MessageCircle, BarChart3, Home as HomeIcon, LogOut } from 'lucide-react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import RegistrationForm from './components/events/RegistrationForm';
import FloatingChatButton from './components/FloatingChatButton';
import { getAllDocuments, saveEvent, updateDocument, deleteDocument } from '../firebase/services';
import { db, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [activeEvent, setActiveEvent] = useState(null);
  // Database state
  const [dbData, setDbData] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  // Kiosk/Registration State
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [currentSession, setCurrentSession] = useState('General Attendance');

  // 1. Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Detect if this is a registration link on mount
  useEffect(() => {
  const path = window.location.pathname; // This gets "/register/H5JI5yWv1bgMd6qs29mc"
  const params = new URLSearchParams(window.location.search);
  const session = params.get('session');

  // Check if the path starts with /register/
  if (path.startsWith('/register/')) {
    // Extract the ID (the part after the second slash)
    const eventId = path.split('/')[2]; 
    
    if (eventId) {
      console.log("Kiosk Mode Active for Event:", eventId);
      setIsRegisterMode(true);
      setCurrentEventId(eventId);
      
      if (session) {
        setCurrentSession(decodeURIComponent(session));
      }
    }
  }
}, []);

  // 2. Load database data
  useEffect(() => {
    loadDatabaseData();
  }, []);

  const handleLogout = () => signOut(auth);

  const getRegistrationData = () => {
    const activeEvent = events.find(e => String(e.id) === String(currentEventId));
    if (!activeEvent) {
      return {
        eventName: "Event Not Found",
        description: "Please check your link or contact the administrator.",
        formConfig: {}
      };
    }
    return {
      eventName: activeEvent.title,
      description: activeEvent.description,
      formConfig: activeEvent.formConfig || {}
    };

  };

  const loadDatabaseData = async () => {
    setIsLoadingData(true);
    try {
      const collections = ['attendance', 'employee_information', 'events', 'student_engagement', 'student_enrollment'];
      const results = await Promise.allSettled(collections.map(col => getAllDocuments(col)));
      
      const data = {};
 
      results.forEach((result, index) => {
      const colName = collections[index];
      if (result.status === 'fulfilled') {
        data[colName] = result.value;
      } else {
        // Log exactly which collection is failing
        console.error(`Error loading collection "${colName}":`, result.reason);
        data[colName] = []; // Fallback to empty array so the app doesn't crash
      }
    });

      setDbData(data);
      setEvents(data['events'] || []);
      setAttendance(data['attendance'] || []);
      setDataLoaded(true);

    } catch (error) {
      console.error("Critical error in database loader:", error);
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

   const handleUpdateEvent = async (id, updatedEvent) => {
    try {
      if (!id) throw new Error("The Event ID is missing!");
      await updateDocument('events', id, updatedEvent);
    
      setEvents(prev => prev.map(ev => ev.id === id ? updatedEvent : ev));
      if (typeof setActiveEvent !== 'undefined') {
        setActiveEvent(updatedEvent);
      } else {
        console.error("The function 'setActiveEvent' was not found in this scope.");
      }

      console.log("✅ Sync Complete");
      alert("This event is successfully updated!")
    } catch (error) {
      console.error("❌ ERROR:", error);
      alert(`Update failed: ${error.message}`);
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`Permanently delete "${title}"?`)) return;

    try {
      await deleteDocument('events', id); 
      setEvents(prev => prev.filter(ev => ev.id !== id));
      if (activeEvent?.id === id) setActiveEvent(null);
      
      console.log("Deleted from Firestore and State");
      alert("The event has been successfully removed.")
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Could not delete. Check your Firestore permissions.");
    }
  };

  const handleAttendanceSubmit = async (formData) => {
    try {
      await addDoc(collection(db, 'attendance'), {
        ...formData,
        eventId: currentEventId,
        session_name: currentSession,
        createdAt: serverTimestamp()
      });

      loadDatabaseData();
    } catch (error) {
      console.error("Attendance submission error:", error);
      throw error;
    }
  };

  const regData = useMemo(() => {
  if (!isRegisterMode || events.length === 0) return null;
  
  const activeEvent = events.find(e => String(e.id) === String(currentEventId));
  return {
    eventName: activeEvent?.title || "Event Not Found",
    description: activeEvent?.description || "",
    formConfig: activeEvent?.formConfig || {}
  };
}, [isRegisterMode, events, currentEventId]);


  const handleAddSession = async (eventId, sessionName) => {
    try {
      const eventToUpdate = events.find(e => e.id === eventId);
      if (!eventToUpdate) return;
      const updatedSessions = [...(eventToUpdate.sessions || []), sessionName];
      const updatedEvent = { ...eventToUpdate, sessions: updatedSessions };
      await updateDocument('events', eventId, updatedEvent);
      setEvents(prev => prev.map(ev => ev.id === eventId ? updatedEvent : ev));
      if (activeEvent?.id === eventId) setActiveEvent(updatedEvent);

      console.log("Session added successfully");

    } catch (error) {
      console.error("Failed to add session:", error);
      alert("Error adding session.");
    }
  }

  const handleOpenSessionModal = (event) => {
    setSessionTargetEvent(event);
    setShowSessionModal(true);
  }

  if (authLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-purple-600 font-bold text-sm animate-pulse">Loading...</div>
    </div>
  );

  if (!user && !isRegisterMode) return <LoginPage />;

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

              <div className="flex items-center gap-3">
                <div className="flex items-center p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                  <NavButton active={activeSection === 'home'} onClick={() => setActiveSection('home')} icon={<HomeIcon size={16} />} label="Home" />
                  <NavButton active={activeSection === 'event'} onClick={() => setActiveSection('event')} icon={<BarChart3 size={16} />} label="Events" />
                  <NavButton active={activeSection === 'data'} onClick={() => setActiveSection('data')} icon={<BarChart3 size={16} />} label="Dashboard" />
                  <NavButton active={activeSection === 'chat'} onClick={() => setActiveSection('chat')} icon={<MessageCircle size={16} />} label="Chat AI" />
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-black text-[10px] uppercase tracking-widest"
                  title="Sign out"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="w-full px-8 py-8">
        {isRegisterMode ? (
          <RegistrationForm
            eventName={regData?.eventName || "Loading..."}
            description={regData?.description}
            formConfig={regData?.formConfig} 
            selectedSession={currentSession}
            onSubmit={handleAttendanceSubmit}
            currentCount={attendance.filter(a => String(a.eventId) === String(currentEventId) && a.session_name === currentSession).length}
          />
        ) : (
          <div className="transition-all duration-500 ease-in-out">
            {activeSection === 'home' && <HomePage />}
            {activeSection === 'event' && (
              <EventsPage
                events={events}
                attendance={attendance}
                activeEvent={activeEvent}
                setActiveEvent = {setActiveEvent}
                onCreateEvent={handleCreateEvent}
                onUpdateEvent = {handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
              />
            )}
            {activeSection === 'data' && <DashboardPage />}
            {activeSection === 'chat' && (
              <ChatPage
                dbData={dbData}
                isLoadingData={isLoadingData}
                dataLoaded={dataLoaded}
                user={user}
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