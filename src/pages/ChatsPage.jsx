import { useState } from 'react';
import { Search, SquarePen, MessageSquare, Trash2 } from 'lucide-react';

function relTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatsPage({ conversations, loadingConvs, onSelectConv, onDeleteConv, onNewChat }) {
  const [query, setQuery] = useState('');

  const filtered = conversations.filter(c =>
    c.title?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <h1 className="font-montserrat text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">Chats</h1>
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
        >
          <SquarePen size={14} />
          New chat
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search your chats..."
          className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-gia-500/30 focus:border-gia-500 transition-all"
        />
      </div>

      {/* List */}
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {loadingConvs ? (
          <p className="text-sm text-neutral-400 dark:text-neutral-500 py-8 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-neutral-400 dark:text-neutral-500 py-8 text-center">
            {query ? 'No chats match your search.' : 'No conversations yet. Start chatting!'}
          </p>
        ) : (
          filtered.map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelectConv(conv)}
              className="w-full text-left px-3 py-3.5 flex items-start gap-3 group hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-xl transition-all"
            >
              <MessageSquare size={15} className="shrink-0 mt-0.5 text-neutral-300 dark:text-neutral-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate leading-snug">
                  {conv.title}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                  Last message {relTime(conv.updatedAt)}
                </p>
              </div>
              <span
                onClick={e => onDeleteConv(conv.id, e)}
                className="shrink-0 opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-red-400 text-neutral-400 transition-all p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 mt-0.5"
              >
                <Trash2 size={13} />
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
