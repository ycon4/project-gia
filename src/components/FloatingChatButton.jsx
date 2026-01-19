import { MessageCircle } from 'lucide-react';

export default function FloatingChatButton({ onClick, isOnChatPage }) {
  if (isOnChatPage) return null;
  
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-2xl hover:shadow-purple-300 transition-all duration-300 hover:scale-110 z-50"
      title="Chat with GIA"
    >
      <MessageCircle size={28} />
    </button>
  );
}