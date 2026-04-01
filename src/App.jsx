import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import giaLogo from './assets/GIA Logo.svg';
import {
  MessageCircle, BarChart3, Home as HomeIcon, LogOut,
  CalendarDays, PanelLeftClose, PanelLeft, SquarePen, Trash2, MessageSquare,
  Moon, Sun, ChevronUp, Pencil, X,
} from 'lucide-react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import ChatsPage from './pages/ChatsPage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import RegistrationForm from './components/events/RegistrationForm';
import FloatingChatButton from './components/FloatingChatButton';
import { getAllDocuments, saveEvent, updateDocument, deleteDocument } from '../firebase/services';
import { db, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';

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

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');

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
      setDisplayName(currentUser?.displayName || '');
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

  const handleUpdateProfile = async (newName) => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName: newName });
    setDisplayName(newName);
  };

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
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 overflow-hidden relative">
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
          user={user}
          displayName={displayName}
          onEditProfile={() => setEditProfileOpen(true)}
        />
      )}

      {/* Main content */}
      <div
        className={`flex flex-col flex-1 min-w-0 min-h-0 transition-[margin] duration-300 ease-in-out ${
          !isRegisterMode ? (sidebarOpen ? 'ml-56' : 'ml-10') : ''
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
            displayName={displayName}
            onRefreshData={loadDatabaseData}
            conversations={conversations}
            setConversations={setConversations}
            activeConvId={activeConvId}
            setActiveConvId={setActiveConvId}
          />
        ) : activeSection === 'chats' ? (
          <main className="flex-1 overflow-y-auto">
            <ChatsPage
              conversations={conversations}
              loadingConvs={loadingConvs}
              onSelectConv={handleSelectConv}
              onDeleteConv={handleDeleteConv}
              onNewChat={handleNewChat}
            />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto px-8 py-8">
            <div className="transition-all duration-500 ease-in-out">
              {activeSection === 'home' && <HomePage onGoToDashboard={() => setActiveSection('data')} onNewChat={handleNewChat} />}
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
          onClick={handleNewChat}
          isOnChatPage={activeSection === 'chat' || activeSection === 'chats'}
        />
      )}

      {editProfileOpen && (
        <ProfileModal
          user={user}
          displayName={displayName}
          onSave={handleUpdateProfile}
          onClose={() => setEditProfileOpen(false)}
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
  user, displayName, onEditProfile,
}) {
  const navItems = [
    { id: 'home',  label: 'Home',      icon: HomeIcon      },
    { id: 'event', label: 'Events',    icon: CalendarDays  },
    { id: 'data',  label: 'Dashboard', icon: BarChart3     },
    { id: 'chats', label: 'Chats',      icon: MessageCircle },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col
        bg-white dark:bg-neutral-900
        border-r border-neutral-200 dark:border-neutral-700/70
        transition-[width] duration-300 ease-in-out overflow-hidden
        ${open ? 'w-56' : 'w-10'}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center h-12 px-2 gap-2 border-b border-neutral-100 dark:border-neutral-700/60 shrink-0">
        {open ? (
          <>
            <button
              onClick={() => setActiveSection('home')}
              className="shrink-0 flex items-center justify-center p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
              title="GIA Home"
            >
              <img src={giaLogo} alt="GIA" className="w-6 h-6 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(22%) sepia(90%) saturate(2500%) hue-rotate(272deg) brightness(0.9)' }} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-montserrat text-neutral-900 dark:text-neutral-100 font-semibold text-sm leading-none truncate">MSU-IIT GADC</div>
              <div className="text-neutral-400 dark:text-neutral-500 text-[10px] font-normal mt-0.5 truncate">Information Assistant</div>
            </div>
            <button
              onClick={onToggle}
              className="shrink-0 p-1 text-neutral-400 hover:text-gia-600 hover:bg-gia-50 dark:hover:bg-gia-950/50 dark:hover:text-gia-400 rounded-md transition-all"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            className="p-1 text-neutral-400 hover:text-gia-600 hover:bg-gia-50 dark:hover:bg-gia-950/50 dark:hover:text-gia-400 rounded-md transition-all"
            title="Expand sidebar"
          >
            <PanelLeft size={15} />
          </button>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Nav items */}
        <nav className="px-1 py-3 space-y-1 shrink-0">
          {navItems.map(item => (
            <SideNavItem
              key={item.id}
              open={open}
              active={activeSection === item.id || (item.id === 'chats' && activeSection === 'chat')}
              onClick={() => setActiveSection(item.id)}
              icon={<item.icon size={16} />}
              label={item.label}
            />
          ))}
          <SideNavItem
            open={open}
            onClick={onNewChat}
            icon={<SquarePen size={16} />}
            label="New Chat"
            newChat
          />
        </nav>

        {/* Recents — only when expanded */}
        {open && (
          <div className="flex-1 flex flex-col min-h-0 border-t border-neutral-100 dark:border-neutral-700/60">
            <div className="flex items-center px-3 py-2 shrink-0">
              <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Recents</span>
            </div>

            <div
              className="flex-1 overflow-y-auto px-1.5 pb-2 space-y-0.5"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
            >
              {loadingConvs ? (
                <p className="text-neutral-400 dark:text-neutral-500 text-[10px] text-center py-4">Loading...</p>
              ) : conversations.length === 0 ? (
                <p className="text-neutral-400 dark:text-neutral-500 text-[10px] text-center py-4 px-3 leading-relaxed">
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
                        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
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
      <div className="px-1 py-2 border-t border-neutral-100 dark:border-neutral-700/60 shrink-0 space-y-1">
        <SideNavItem
          open={open}
          onClick={onToggleDark}
          icon={darkMode ? <Sun size={16} /> : <Moon size={16} />}
          label={darkMode ? 'Light mode' : 'Dark mode'}
        />
        <ProfileButton
          open={open}
          user={user}
          displayName={displayName}
          onEditProfile={onEditProfile}
          onLogout={onLogout}
        />
      </div>
    </aside>
  );
}

function SideNavItem({ open, active, onClick, icon, label, danger, newChat }) {
  return (
    <button
      onClick={onClick}
      title={!open ? label : undefined}
      className={`w-full flex items-center py-2 px-2 rounded-md transition-colors duration-150
        ${open ? 'gap-2.5' : ''}
        ${danger
          ? 'text-neutral-400 dark:text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
          : newChat
            ? 'text-gia-600 dark:text-gia-400 hover:bg-gia-50 dark:hover:bg-gia-950/50'
            : active
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
        }`}
    >
      <span className="shrink-0">{icon}</span>
      {open && (
        <span className="text-sm font-medium leading-none whitespace-nowrap overflow-hidden">
          {label}
        </span>
      )}
    </button>
  );
}

function ProfileButton({ open, user, displayName, onEditProfile, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ bottom: 0, left: 0 });
  const btnRef = useRef(null);
  const name = displayName || user?.email?.split('@')[0] || 'User';
  const initial = name[0].toUpperCase();

  const handleToggle = () => {
    if (!menuOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ bottom: window.innerHeight - rect.top + 6, left: rect.left });
    }
    setMenuOpen(m => !m);
  };

  return (
    <div>
      {menuOpen && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div
            className="fixed z-50 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden"
            style={{ bottom: menuPos.bottom, left: menuPos.left }}
          >
            <div className="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-700">
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{name}</p>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { onEditProfile(); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <Pencil size={13} /> Edit Profile
            </button>
            <button
              onClick={() => { onLogout(); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </>,
        document.body
      )}

      <button
        ref={btnRef}
        onClick={handleToggle}
        title={!open ? name : undefined}
        className={`w-full flex items-center py-2 px-2 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${open ? 'gap-2.5' : ''}`}
      >
        <span className={`shrink-0 rounded-full bg-gia-600 text-white flex items-center justify-center font-bold leading-none ${open ? 'w-6 h-6 text-xs' : 'w-4 h-4 text-[9px]'}`}>
          {initial}
        </span>
        {open && (
          <>
            <span className="flex-1 min-w-0 text-left">
              <span className="text-sm font-normal text-neutral-700 dark:text-neutral-300 leading-none truncate block">{name}</span>
            </span>
            <ChevronUp size={13} className={`shrink-0 text-neutral-400 transition-transform duration-200 ${menuOpen ? '' : 'rotate-180'}`} />
          </>
        )}
      </button>
    </div>
  );
}

function ProfileModal({ user, displayName, onSave, onClose }) {
  const [name, setName] = useState(displayName || '');
  const [saving, setSaving] = useState(false);
  const initial = (name || user?.email || '?')[0].toUpperCase();

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Edit Profile</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gia-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
              {initial}
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{user?.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Your name"
              autoFocus
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-gia-500/30 focus:border-gia-500 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 text-sm font-medium bg-gia-600 hover:bg-gia-700 disabled:opacity-40 text-white rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
