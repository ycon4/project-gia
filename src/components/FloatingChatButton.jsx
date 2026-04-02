import giaLogo from '../assets/GIA Logo.svg';

export default function FloatingChatButton({ onClick, isOnChatPage }) {
  if (isOnChatPage) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 z-50"
      style={{ background: '#a680cf', boxShadow: '0 25px 50px -12px #a680cf4d' }}
      title="Chat with GIA"
    >
      <img
        src={giaLogo}
        alt="GIA"
        className="w-7 h-7 object-contain"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    </button>
  );
}