import { MessageCircle } from 'lucide-react';

export default function FloatingChatButton({ onClick, isOnChatPage }) {
  if (isOnChatPage) return null;
  
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 bg-gia-600 hover:bg-gia-700 text-white rounded-full p-4 shadow-2xl shadow-gia-600/30 hover:shadow-gia-600/50 transition-all duration-300 hover:scale-110 z-50"
      title="Chat with GIA"
    >
      <MessageCircle size={28} />
    </button>
  );
}