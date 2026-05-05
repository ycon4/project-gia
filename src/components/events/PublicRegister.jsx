import { useState, useEffect } from 'react';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import RegistrationForm from './RegistrationForm';

export default function PublicRegister() {
  // Parse eventId and session directly from the URL — no dependency on App.jsx
  const pathParts = window.location.pathname.split('/');
  const eventId = pathParts[2] || null;
  const params = new URLSearchParams(window.location.search);
  const session = params.get('session')
    ? decodeURIComponent(params.get('session'))
    : 'General Attendance';

  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'not-found' | 'error'

  useEffect(() => {
    if (!eventId) {
      setStatus('not-found');
      return;
    }

    getDoc(doc(db, 'events', eventId))
      .then(snap => {
        if (!snap.exists()) {
          setStatus('not-found');
          return;
        }
        setEvent({ id: snap.id, ...snap.data() });
        setStatus('ready');
      })
      .catch(err => {
        console.error('PublicRegister: failed to load event', err);
        setStatus('error');
      });
  }, [eventId]);

  const handleSubmit = async (formData) => {
    try {
      console.log('📝 Submitting attendance record...');
      console.log('  Event ID:', eventId);
      console.log('  Session:', session);
      console.log('  Form Data:', formData);

      const docRef = await addDoc(collection(db, 'attendance'), {
        ...formData,
        eventId,
        session_name: session,
        createdAt: serverTimestamp(),
      });

      console.log('✅ Attendance record saved! Doc ID:', docRef.id);
    } catch (error) {
      console.error('❌ Failed to save attendance record:', error);
      throw error; // Re-throw so RegistrationForm can handle it
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Loading event...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">🔍</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Event Not Found
          </h1>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            This registration link may be invalid or the event has been removed.
            Please contact the event organizer for a valid link.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Could not load the event. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <RegistrationForm
      eventId={eventId}
      eventName={event.title}
      description={event.description}
      formConfig={event.formConfig}
      hasPreReg={session === 'Pre-Registration'}
      selectedSession={session}
      onSubmit={handleSubmit}
    />
  );
}
