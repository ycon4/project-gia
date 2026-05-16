import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import giaLogo from './assets/GIA Logo.svg';
import {
  MessageCircle, BarChart3, Home as HomeIcon, LogOut,
  CalendarDays, PanelLeftClose, PanelLeft, SquarePen, Trash2, MessageSquare,
  Moon, Sun, ChevronUp, Pencil, X, Users,
} from 'lucide-react';
import AboutPage from './pages/AboutPage';
import DistributionPage from './pages/DistributionPage';
import ChatPage from './pages/ChatPage';
import ChatsPage from './pages/ChatsPage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import UserManagementPage from './pages/UserManagementPage';
import PublicRegister from './components/events/PublicRegister';
import FloatingChatButton from './components/FloatingChatButton';
import { RoleProvider, useRole } from './contexts/RoleContext';
import { getAllDocuments, saveEvent, updateDocument, removeEvent } from '../firebase/services';
import { db, auth } from '../firebase/config';
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('gia-dark-mode') === 'true'
  );

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('chat'); // Always start with chat

  const [isRegisterMode, setIsRegisterMode] = useState(false);

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

  // ── Persist active section (but don't restore on login)
  useEffect(() => {
    // Only persist, don't restore from localStorage on mount
    if (user) {
      localStorage.setItem('gia-active-section', activeSection);
    }
  }, [activeSection, user]);

  // ── Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setDisplayName(currentUser?.displayName || '');
      setAuthLoading(false);

      // Reset to chat page on login/logout
      if (currentUser) {
        setActiveSection('chat');
      }
    });
    return unsubscribe;
  }, []);

  // ── Sync displayName from Firestore in real-time
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        // Only update if the document belongs to the current user
        if (userData.uid === user.uid && userData.displayName) {
          setDisplayName(userData.displayName);
        }
      }
    });

    return unsubscribe;
  }, [user]);

  // ── Kiosk detection — just flag the mode, PublicRegister handles its own data fetch
  useEffect(() => {
    if (window.location.pathname.startsWith('/register/')) {
      setIsRegisterMode(true);
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

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      signOut(auth);
    }
  };

  const handleUpdateProfile = async (newName) => {
    if (!auth.currentUser) return;
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName: newName });

      // Update Firestore user document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: newName,
        updatedAt: new Date().toISOString(),
      });

      setDisplayName(newName);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCreateEvent = async (newEventData) => {
    try {
      const savedEvent = await saveEvent(newEventData, user.uid, displayName || user.email);
      return savedEvent; // Return the saved event so EventsPage can add it to its local state
    } catch (error) {
      alert('Failed to save event to database.');
      throw error;
    }
  };

  const handleUpdateEvent = async (id, updatedEvent) => {
    try {
      if (!id) throw new Error('The Event ID is missing!');
      await updateDocument('events', id, updatedEvent);
      alert('This event is successfully updated!');
    } catch (error) {
      alert(`Update failed: ${error.message}`);
      throw error;
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`Permanently delete "${title}"?`)) return;
    try {
      // removeEvent deletes the event doc AND all its attendance records in one batch
      await removeEvent(id);
      alert('The event and all its attendance records have been removed.');
    } catch (error) {
      alert('Could not delete. Check your Firestore permissions.');
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

  if (authLoading) return (
    <div className="min-h-screen bg-gia-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-gia-600 font-bold text-p4-sm animate-pulse tracking-widest uppercase">Loading...</div>
    </div>
  );

  if (!user && !isRegisterMode) return <LoginPage darkMode={darkMode} />;

  return (
    <RoleProvider user={user}>
      <div className={`flex bg-neutral-50 dark:bg-neutral-950 relative ${isRegisterMode ? 'min-h-screen' : 'h-screen overflow-hidden'}`}>
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
          className={`flex flex-col flex-1 min-w-0 transition-[margin] duration-300 ease-in-out ${isRegisterMode ? '' : 'min-h-0'} ${!isRegisterMode ? (sidebarOpen ? 'ml-56' : 'ml-10') : ''
            }`}
        >
          {isRegisterMode ? (
            // PublicRegister is fully self-contained — fetches its own event data,
            // handles loading/not-found/error states, and submits attendance itself.
            <PublicRegister />
          ) : activeSection === 'chat' ? (
            <ChatPage
              user={user}
              displayName={displayName}
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
          ) : activeSection === 'event' ? (
            <main className="flex-1 min-h-0 flex overflow-hidden">
              <EventsPage
                onCreateEvent={handleCreateEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
              />
            </main>
          ) : activeSection === 'users' ? (
            <main className="flex-1 overflow-y-auto">
              <UserManagementPage />
            </main>
          ) : (
            <main className="flex-1 overflow-y-auto px-8 py-8">
              <div className="transition-all duration-500 ease-in-out">
                {activeSection === 'home' && <AboutPage onGoToDashboard={() => setActiveSection('data')} onNewChat={handleNewChat} />}
                {activeSection === 'data' && <DistributionPage />}
              </div>
            </main>
          )}
        </div>

        {!isRegisterMode && activeSection !== 'data' && activeSection !== 'event' && activeSection !== 'users' && (
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
    </RoleProvider>
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
  const { role, loading } = useRole();

  // Reset activeSection if user doesn't have permission for current section
  useEffect(() => {
    if (loading) return;

    // If user is on 'users' page but not ADMIN, redirect to home
    if (activeSection === 'users' && role !== 'ADMIN') {
      setActiveSection('home');
    }
  }, [role, loading, activeSection, setActiveSection]);

  const navItems = [
    { id: 'home', label: 'About', icon: HomeIcon },
    { id: 'event', label: 'Events', icon: CalendarDays },
    { id: 'data', label: 'Distribution', icon: BarChart3 },
    { id: 'chats', label: 'Chats', icon: MessageCircle },
  ];

  // Add Users item only for ADMIN
  if (role === 'ADMIN') {
    navItems.push({ id: 'users', label: 'Users', icon: Users });
  }

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
              title="GIA About"
            >
              <div style={{ width: 24, height: 24, background: '#a673d8', WebkitMaskImage: `url(${giaLogo})`, maskImage: `url(${giaLogo})`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
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
          <SideNavItem
            open={open}
            onClick={onNewChat}
            icon={<SquarePen size={16} />}
            label="New Chat"
            newChat
          />
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
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-100 group flex items-start gap-2 ${activeConvId === conv.id && activeSection === 'chat'
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
            ? 'text-[#a673d8] hover:bg-[#a673d8]/10'
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
  const { role } = useRole();
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
              {role && (
                <div className={`text-[9px] font-bold mt-1.5 px-1.5 py-0.5 rounded inline-block ${role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                  role === 'SECRETARIAT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                  {role === 'ADMIN' ? 'Admin' : role === 'SECRETARIAT' ? 'Secretariat' : 'Public View'}
                </div>
              )}
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
        className={`w-full flex items-center py-2 px-2 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 relative ${open ? 'gap-2.5' : ''}`}
      >
        <span className={`shrink-0 rounded-full bg-[#a673d8] text-white flex items-center justify-center font-bold leading-none ${open ? 'w-6 h-6 text-xs' : 'w-4 h-4 text-[9px]'}`}>
          {initial}
        </span>
        {open && (
          <>
            <span className="flex-1 min-w-0 text-left">
              <span className="text-sm font-normal text-neutral-700 dark:text-neutral-300 leading-none truncate block">{name}</span>
              {role && (
                <span className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded inline-block ${role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                  role === 'SECRETARIAT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                  {role === 'ADMIN' ? 'Admin' : role === 'SECRETARIAT' ? 'Secretariat' : 'Public View'}
                </span>
              )}
            </span>
            <ChevronUp size={13} className={`shrink-0 text-neutral-400 transition-transform duration-200 ${menuOpen ? '' : 'rotate-180'}`} />
          </>
        )}
        {!open && role && (
          <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${role === 'ADMIN' ? 'bg-purple-500' :
              role === 'SECRETARIAT' ? 'bg-blue-500' :
                'bg-gray-500'
            }`} title={role === 'ADMIN' ? 'Admin' : role === 'SECRETARIAT' ? 'Secretariat' : 'Public View'} />
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
