import { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle, BarChart3, Home as HomeIcon, LogOut,
  CalendarDays, PanelLeftClose, PanelLeft, Plus, Trash2, MessageSquare,
  Moon, Sun,
} from 'lucide-react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import RegistrationForm from './components/events/RegistrationForm';
import FloatingChatButton from './components/FloatingChatButton';
import { getAllDocuments, saveEvent, updateDocument, deleteDocument } from '../firebase/services';
import { db, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('gia-dark-mode') === 'true'
  );

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [activeEvent, setActiveEvent] = useState(null);

  const [dbData, setDbData] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [currentSession, setCurrentSession] = useState('General Attendance');

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [loadingConvs, setLoadingConvs] = useState(false);

  // ── Dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('gia-dark-mode', darkMode);
  }, [darkMode]);

  // ── Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Kiosk detection
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    if (path.startsWith('/register/')) {
      const eventId = path.split('/')[2];
      if (eventId) {
        setIsRegisterMode(true);
        setCurrentEventId(eventId);
        if (session) setCurrentSession(decodeURIComponent(session));
      }
    }
  }, []);

  // ── Load conversations
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    setLoadingConvs(true);
    try {
      const q = query(collection(db, 'conversations'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const convs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setConversations(convs);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  // ── Load db data
  useEffect(() => {
    loadDatabaseData();
  }, []);

  const handleLogout = () => signOut(auth);

  const loadDatabaseData = async () => {
    setIsLoadingData(true);
    try {
      const collections = ['attendance', 'employee_information', 'events', 'student_engagement', 'student_enrollment'];
      const results = await Promise.allSettled(collections.map(col => getAllDocuments(col)));
      const data = {};
      results.forEach((result, index) => {
        const colName = collections[index];
        data[colName] = result.status === 'fulfilled' ? result.value : [];
        if (result.status === 'rejected') console.error(`Error loading "${colName}":`, result.reason);
      });
      setDbData(data);
      setEvents(data['events'] || []);
      setAttendance(data['attendance'] || []);
      setDataLoaded(true);
    } catch (error) {
      console.error('Critical error in database loader:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreateEvent = async (newEventData) => {
    try {
      const savedEvent = await saveEvent(newEventData);
      setEvents(prev => [savedEvent, ...prev]);
    } catch {
      alert('Failed to save event to database.');
    }
  };

  const handleUpdateEvent = async (id, updatedEvent) => {
    try {
      if (!id) throw new Error('The Event ID is missing!');
      await updateDocument('events', id, updatedEvent);
      setEvents(prev => prev.map(ev => ev.id === id ? updatedEvent : ev));
      setActiveEvent(updatedEvent);
      alert('This event is successfully updated!');
    } catch (error) {
      alert(`Update failed: ${error.message}`);
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`Permanently delete "${title}"?`)) return;
    try {
      await deleteDocument('events', id);
      setEvents(prev => prev.filter(ev => ev.id !== id));
      if (activeEvent?.id === id) setActiveEvent(null);
      alert('The event has been successfully removed.');
    } catch {
      alert('Could not delete. Check your Firestore permissions.');
    }
  };

  const handleAttendanceSubmit = async (formData) => {
    try {
      await addDoc(collection(db, 'attendance'), {
        ...formData,
        eventId: currentEventId,
        session_name: currentSession,
        createdAt: serverTimestamp(),
      });
      loadDatabaseData();
    } catch (error) {
      console.error('Attendance submission error:', error);
      throw error;
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setActiveSection('chat');
  };

  const handleSelectConv = (conv) => {
    setActiveConvId(conv.id);
    setActiveSection('chat');
  };

  const handleDeleteConv = async (convId, e) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'conversations', convId));
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConvId === convId) setActiveConvId(null);
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const regData = useMemo(() => {
    if (!isRegisterMode || events.length === 0) return null;
    const found = events.find(e => String(e.id) === String(currentEventId));
    return {
      eventName: found?.title || 'Event Not Found',
      description: found?.description || '',
      formConfig: found?.formConfig || {},
    };
  }, [isRegisterMode, events, currentEventId]);

  if (authLoading) return (
    <div className="min-h-screen bg-gia-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-gia-600 font-bold text-p4-sm animate-pulse tracking-widest uppercase">Loading...</div>
    </div>
  );

  if (!user && !isRegisterMode) return <LoginPage darkMode={darkMode} />;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-neutral-950 overflow-hidden relative">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] bg-gia-100/30 dark:bg-gia-900/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[50%] bg-gia-50/50 dark:bg-gia-950/30 rounded-full blur-[160px]" />
      </div>

      {/* Sidebar */}
      {!isRegisterMode && (
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
          conversations={conversations}
          activeConvId={activeConvId}
          onSelectConv={handleSelectConv}
          onDeleteConv={handleDeleteConv}
          onNewChat={handleNewChat}
          loadingConvs={loadingConvs}
        />
      )}

      {/* Main content */}
      <div
        className={`flex flex-col flex-1 min-w-0 min-h-0 transition-all duration-300 ease-in-out ${
          !isRegisterMode ? (sidebarOpen ? 'ml-60' : 'ml-16') : ''
        }`}
      >
        {isRegisterMode ? (
          <main className="flex-1 overflow-y-auto p-8">
            <RegistrationForm
              eventName={regData?.eventName || 'Loading...'}
              description={regData?.description}
              formConfig={regData?.formConfig}
              selectedSession={currentSession}
              onSubmit={handleAttendanceSubmit}
              currentCount={attendance.filter(
                a => String(a.eventId) === String(currentEventId) && a.session_name === currentSession
              ).length}
            />
          </main>
        ) : activeSection === 'chat' ? (
          <ChatPage
            dbData={dbData}
            isLoadingData={isLoadingData}
            dataLoaded={dataLoaded}
            user={user}
            onRefreshData={loadDatabaseData}
            conversations={conversations}
            setConversations={setConversations}
            activeConvId={activeConvId}
            setActiveConvId={setActiveConvId}
          />
        ) : (
          <main className="flex-1 overflow-y-auto px-8 py-8">
            <div className="transition-all duration-500 ease-in-out">
              {activeSection === 'home' && <HomePage />}
              {activeSection === 'event' && (
                <EventsPage
                  events={events}
                  attendance={attendance}
                  activeEvent={activeEvent}
                  setActiveEvent={setActiveEvent}
                  onCreateEvent={handleCreateEvent}
                  onUpdateEvent={handleUpdateEvent}
                  onDeleteEvent={handleDeleteEvent}
                />
              )}
              {activeSection === 'data' && <DashboardPage />}
            </div>
          </main>
        )}
      </div>

      {!isRegisterMode && (
        <FloatingChatButton
          onClick={() => setActiveSection('chat')}
          isOnChatPage={activeSection === 'chat'}
        />
      )}
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────── */
function relTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

/* ─── Sidebar ───────────────────────────────────────────── */
function Sidebar({
  open, onToggle,
  activeSection, setActiveSection, onLogout,
  darkMode, onToggleDark,
  conversations, activeConvId, onSelectConv, onDeleteConv, onNewChat, loadingConvs,
}) {
  const navItems = [
    { id: 'home',  label: 'Home',      icon: HomeIcon      },
    { id: 'event', label: 'Events',    icon: CalendarDays  },
    { id: 'data',  label: 'Dashboard', icon: BarChart3     },
    { id: 'chat',  label: 'Chat AI',   icon: MessageCircle },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col
        bg-white dark:bg-neutral-900
        border-r border-slate-200 dark:border-neutral-700/70
        transition-all duration-300 ease-in-out
        ${open ? 'w-60' : 'w-16'}`}
    >
      {/* ── Header ── */}
      {open ? (
        <div className="flex items-center h-16 px-3 gap-3 border-b border-slate-100 dark:border-neutral-700/60 shrink-0">
          <button
            onClick={() => setActiveSection('home')}
            className="shrink-0 w-9 h-9 bg-gia-900 dark:bg-gia-800 rounded-xl flex items-center justify-center shadow-md"
            title="GIA Home"
          >
            <span className="text-white font-black text-[10px] tracking-tight">GIA</span>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-slate-900 dark:text-neutral-100 font-semibold text-sm leading-none truncate">MSU-IIT GADC</div>
            <div className="text-slate-400 dark:text-neutral-500 text-[10px] font-normal mt-0.5 truncate">Information Assistant</div>
          </div>
          <button
            onClick={onToggle}
            className="shrink-0 p-1.5 text-slate-400 hover:text-gia-600 hover:bg-gia-50 dark:hover:bg-gia-950/50 dark:hover:text-gia-400 rounded-lg transition-all"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-16 border-b border-slate-100 dark:border-neutral-700/60 shrink-0">
          <button
            onClick={onToggle}
            className="p-1.5 text-slate-400 hover:text-gia-600 hover:bg-gia-50 dark:hover:bg-gia-950/50 dark:hover:text-gia-400 rounded-lg transition-all"
            title="Expand sidebar"
          >
            <PanelLeft size={16} />
          </button>
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Nav items */}
        <nav className="px-2 py-2 space-y-0.5 shrink-0">
          {navItems.map(item => (
            <SideNavItem
              key={item.id}
              open={open}
              active={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
              icon={<item.icon size={16} />}
              label={item.label}
            />
          ))}
        </nav>

        {/* Recents — only when expanded */}
        {open && (
          <div className="flex-1 flex flex-col min-h-0 border-t border-slate-100 dark:border-neutral-700/60">
            <div className="flex items-center justify-between px-4 py-2.5 shrink-0">
              <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-500">Recents</span>
              <button
                onClick={onNewChat}
                className="p-1 text-slate-400 hover:text-gia-600 dark:hover:text-gia-400 hover:bg-gia-50 dark:hover:bg-gia-950/50 rounded-md transition-all"
                title="New conversation"
              >
                <Plus size={13} />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
            >
              {loadingConvs ? (
                <p className="text-slate-400 dark:text-slate-500 text-[10px] text-center py-4">Loading...</p>
              ) : conversations.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 text-[10px] text-center py-4 px-3 leading-relaxed">
                  No conversations yet. Start chatting!
                </p>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConv(conv)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-100 group flex items-start gap-2 ${
                      activeConvId === conv.id && activeSection === 'chat'
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-slate-900 dark:text-neutral-100'
                        : 'text-slate-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    <MessageSquare size={12} className="shrink-0 mt-0.5 opacity-40" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-normal truncate leading-snug">{conv.title}</p>
                      <p className="text-xs opacity-40 mt-0.5">{relTime(conv.updatedAt)}</p>
                    </div>
                    <span
                      onClick={(e) => onDeleteConv(conv.id, e)}
                      className="shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:text-red-400 transition-all p-0.5 mt-0.5"
                    >
                      <Trash2 size={10} />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-2 py-2 border-t border-slate-100 dark:border-neutral-700/60 shrink-0 space-y-0.5">
        <SideNavItem
          open={open}
          onClick={onToggleDark}
          icon={darkMode ? <Sun size={16} /> : <Moon size={16} />}
          label={darkMode ? 'Light mode' : 'Dark mode'}
        />
        <SideNavItem
          open={open}
          onClick={onLogout}
          icon={<LogOut size={16} />}
          label="Logout"
          danger
        />
      </div>
    </aside>
  );
}

function SideNavItem({ open, active, onClick, icon, label, danger }) {
  return (
    <button
      onClick={onClick}
      title={!open ? label : undefined}
      className={`w-full flex items-center rounded-md transition-all duration-150
        ${open ? 'gap-2.5 px-2.5 py-1.5' : 'justify-center p-2'}
        ${danger
          ? 'text-slate-400 dark:text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
          : active
            ? 'bg-neutral-100 dark:bg-neutral-800 text-slate-900 dark:text-neutral-100'
            : 'text-slate-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-neutral-100'
        }`}
    >
      <span className="shrink-0">{icon}</span>
      {open && (
        <span className="text-sm font-normal leading-none whitespace-nowrap">{label}</span>
      )}
    </button>
  );
}

export default App;
