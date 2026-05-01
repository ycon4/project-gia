import { useRef, useState, useEffect } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

export default function EventPosterGenerator({ event, isOpen, onClose }) {
  const posterRef = useRef(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate QR code when modal opens - use event's registration URL
  useEffect(() => {
    if (isOpen && event) {
      // Determine which session to use for the QR code
      let sessionForQR = 'General Attendance';
      if (event.hasPreReg) {
        sessionForQR = 'Pre-Registration';
      } else if (event.sessions && event.sessions.length > 0) {
        sessionForQR = event.sessions[0];
      }

      // Generate the registration URL
      const registrationUrl = `${window.location.origin}/register/${event.id}?session=${encodeURIComponent(sessionForQR)}`;

      // Generate QR code from the registration URL
      QRCode.toDataURL(registrationUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#6B21A8', // Purple
          light: '#FFFFFF',
        },
      })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  // Determine which session to use for the registration link
  let sessionForLink = 'General Attendance';
  if (event.hasPreReg) {
    sessionForLink = 'Pre-Registration';
  } else if (event.sessions && event.sessions.length > 0) {
    sessionForLink = event.sessions[0];
  }

  // Generate the registration URL for display
  const registrationUrl = `${window.location.origin}/register/${event.id}?session=${encodeURIComponent(sessionForLink)}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    // For now, we'll use a default time. You can add time fields to the event form later
    return '9AM PHT';
  };

  const handleDownload = async (format = 'png') => {
    if (!posterRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        backgroundColor: '#F3E8FF',
        logging: false,
        useCORS: true,
      });

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}_poster.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else if (format === 'pdf') {
        // For PDF, we'll use jsPDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new (await import('jspdf')).jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${event.title.replace(/[^a-z0-9]/gi, '_')}_poster.pdf`);
      }
    } catch (error) {
      console.error('Error generating poster:', error);
      alert('Failed to generate poster. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] border border-neutral-200/60 dark:border-neutral-700/60">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div>
            <h2 className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-widest leading-none">
              Event Poster Generator
            </h2>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium mt-0.5">
              Download your event poster as PNG or PDF
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-center">
            <div
              ref={posterRef}
              className="relative w-[1024px] h-[512px] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 50%, #DDD6FE 100%)',
              }}
            >
              {/* Decorative leaves - left */}
              <div className="absolute top-0 left-0 w-32 h-full opacity-20">
                <svg viewBox="0 0 100 200" className="w-full h-full">
                  <path d="M10,20 Q5,40 10,60 T10,100 T10,140 T10,180" stroke="#9333EA" strokeWidth="3" fill="none" opacity="0.3" />
                  <ellipse cx="10" cy="30" rx="15" ry="8" fill="#9333EA" opacity="0.2" transform="rotate(-45 10 30)" />
                  <ellipse cx="15" cy="70" rx="12" ry="6" fill="#9333EA" opacity="0.2" transform="rotate(-30 15 70)" />
                  <ellipse cx="8" cy="110" rx="14" ry="7" fill="#9333EA" opacity="0.2" transform="rotate(-50 8 110)" />
                  <ellipse cx="12" cy="150" rx="13" ry="6" fill="#9333EA" opacity="0.2" transform="rotate(-40 12 150)" />
                </svg>
              </div>

              {/* Decorative leaves - right */}
              <div className="absolute top-0 right-0 w-32 h-full opacity-20">
                <svg viewBox="0 0 100 200" className="w-full h-full">
                  <path d="M90,20 Q95,40 90,60 T90,100 T90,140 T90,180" stroke="#9333EA" strokeWidth="3" fill="none" opacity="0.3" />
                  <ellipse cx="90" cy="30" rx="15" ry="8" fill="#9333EA" opacity="0.2" transform="rotate(45 90 30)" />
                  <ellipse cx="85" cy="70" rx="12" ry="6" fill="#9333EA" opacity="0.2" transform="rotate(30 85 70)" />
                  <ellipse cx="92" cy="110" rx="14" ry="7" fill="#9333EA" opacity="0.2" transform="rotate(50 92 110)" />
                  <ellipse cx="88" cy="150" rx="13" ry="6" fill="#9333EA" opacity="0.2" transform="rotate(40 88 150)" />
                </svg>
              </div>

              {/* Content Container */}
              <div className="relative z-10 h-full flex flex-col p-8">

                {/* Header with logos */}
                <div className="flex items-center gap-3 mb-6">
                  <img
                    src="/msu-iit-logo-word.png"
                    alt="MSU-IIT Logo"
                    className="h-12 object-contain"
                  />
                  <img
                    src="/msu-iit-logo-seal.png"
                    alt="MSU-IIT Seal"
                    className="h-12 object-contain"
                  />
                  <img
                    src="/gadc-logo.png"
                    alt="GADC Logo"
                    className="h-12 object-contain"
                  />
                </div>

                {/* Main Content - Two Columns with Fixed Widths */}
                <div className="flex-1 flex gap-6">

                  {/* Left Column - Event Info - Fixed Width */}
                  <div className="w-[580px] flex flex-col justify-center">

                    {/* Event Series Name */}
                    {event.eventSeriesName && (
                      <div className="mb-4">
                        <h1 className="text-4xl font-black text-[#6B21A8] leading-none mb-1">
                          {event.eventSeriesName}
                        </h1>
                        <p className="text-xs text-[#9333EA] font-semibold tracking-wide">
                          (Gender-Related Initiative Talks)
                        </p>
                      </div>
                    )}

                    {/* Event Title */}
                    <h2 className="text-xl font-black text-[#4C1D95] uppercase leading-tight mb-6">
                      {event.title}
                    </h2>

                    {/* Date, Time, QR Code Box - Side by side */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-[#6B21A8] text-white px-5 py-3 rounded-xl">
                        <div className="text-xl font-black leading-none">{formatDate(event.startDate).split(' ')[0]}</div>
                        <div className="text-xs font-bold mt-1">{formatDate(event.startDate).split(' ').slice(1).join(' ')}</div>
                        <div className="text-[10px] font-semibold mt-2">{formatTime(event.startDate)}</div>
                        <div className="text-[10px] font-medium mt-0.5">via {event.mode === 'Online' ? event.venue || 'Zoom' : 'In-person'}</div>
                      </div>

                      {qrCodeUrl && (
                        <div className="bg-white p-2 rounded-xl border-2 border-[#9333EA]">
                          <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" />
                        </div>
                      )}
                    </div>

                    {/* Registration Link - Always show */}
                    <div className="bg-[#6B21A8] text-white px-3 py-1.5 rounded-lg inline-block max-w-full">
                      <p className="text-[10px] font-black uppercase tracking-wider truncate">
                        Register: {registrationUrl.replace('https://', '').replace('http://', '')}
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Speaker Info - Fixed Width */}
                  <div className="w-[340px] flex flex-col items-center justify-start pt-2 pr-8">

                    {/* Speaker Photo - Gradient border like original */}
                    <div className="relative w-56 h-56 mb-3">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#9333EA] via-[#A855F7] to-[#C084FC] p-1">
                        <div className="w-full h-full rounded-full overflow-hidden bg-neutral-200">
                          {event.speakerPhoto ? (
                            <img
                              src={event.speakerPhoto}
                              alt={event.speakerName || 'Speaker'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Speaker Info Box - Rounded background like original */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg max-w-full">
                      {/* Speaker Name - Maroon, smaller font */}
                      {event.speakerName && (
                        <h3 className="text-base font-black text-[#7C2D3A] text-center leading-tight mb-1">
                          {event.speakerName}
                        </h3>
                      )}

                      {/* Speaker Title - Maroon, smaller */}
                      {event.speakerTitle && (
                        <p className="text-xs font-bold text-[#7C2D3A] text-center mb-0.5">
                          {event.speakerTitle}
                        </p>
                      )}

                      {/* Speaker Affiliation - Maroon, italic, smaller */}
                      {event.speakerAffiliation && (
                        <p className="text-[11px] italic text-[#7C2D3A] text-center leading-snug">
                          {event.speakerAffiliation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 shrink-0 flex items-center justify-between gap-3">
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
            Poster will be downloaded at 3072x1536px resolution
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleDownload('png')}
              disabled={isGenerating}
              className="px-5 py-2 bg-gia-600 hover:bg-gia-700 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Download size={13} /> Download PNG
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
