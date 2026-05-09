import { useRef, useState, useEffect } from 'react';
import { Download, X, Loader2, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

export default function EventPosterGenerator({ event, isOpen, onClose }) {
  const posterRef = useRef(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('violet');
  const [isCopied, setIsCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Color themes
  const themes = {
    violet: {
      name: 'Violet',
      bgGradient: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 50%, #DDD6FE 100%)',
      primary: '#6B21A8',
      secondary: '#9333EA',
      tertiary: '#7C3AED',
      accent: '#A855F7',
      qrColor: '#6B21A8',
    },
    maroon: {
      name: 'Maroon',
      bgGradient: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%)',
      primary: '#881337',
      secondary: '#BE123C',
      tertiary: '#E11D48',
      accent: '#FB7185',
      qrColor: '#881337',
    },
    orange: {
      name: 'Orange',
      bgGradient: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)',
      primary: '#C2410C',
      secondary: '#EA580C',
      tertiary: '#F97316',
      accent: '#FB923C',
      qrColor: '#C2410C',
    },
    pink: {
      name: 'Pink',
      bgGradient: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 50%, #FBCFE8 100%)',
      primary: '#9F1239',
      secondary: '#DB2777',
      tertiary: '#EC4899',
      accent: '#F472B6',
      qrColor: '#9F1239',
    },
    brown: {
      name: 'Brown',
      bgGradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)',
      primary: '#78350F',
      secondary: '#92400E',
      tertiary: '#B45309',
      accent: '#D97706',
      qrColor: '#78350F',
    },
  };

  const currentTheme = themes[selectedTheme];

  // Generate QR code when modal opens or theme changes
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

      // Generate QR code from the registration URL with current theme color
      QRCode.toDataURL(registrationUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: currentTheme.qrColor,
          light: '#FFFFFF',
        },
      })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [isOpen, event, selectedTheme, currentTheme.qrColor]);

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
        logging: false,
        useCORS: true,
      });

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}_poster.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else if (format === 'pdf') {
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

  const handleCopyImage = async () => {
    if (!posterRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy image:', err);
          alert('Failed to copy image to clipboard. Please try downloading instead.');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating poster:', error);
      alert('Failed to generate poster. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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
          <div className="flex items-center gap-3">
            {/* Theme Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Theme:</span>
              <div className="flex gap-1.5">
                {Object.entries(themes).map(([key, theme]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTheme(key)}
                    className={`w-7 h-7 rounded-lg transition-all ${selectedTheme === key
                      ? 'ring-2 ring-offset-2 ring-neutral-400 scale-110'
                      : 'hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                    style={{ background: theme.bgGradient }}
                    title={theme.name}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-center">
            <div
              ref={posterRef}
              className="relative w-[1024px] h-[512px] overflow-hidden"
              style={{
                background: currentTheme.bgGradient,
              }}
            >
              {/* Decorative leaves - left */}
              <div className="absolute top-0 left-0 w-40 h-full opacity-15">
                <svg viewBox="0 0 120 200" className="w-full h-full">
                  {/* Main vine */}
                  <path d="M15,10 Q10,30 15,50 Q20,70 15,90 Q10,110 15,130 Q20,150 15,170 Q10,190 15,200"
                    stroke={currentTheme.secondary} strokeWidth="2.5" fill="none" opacity="0.4" />

                  {/* Leaves - varied sizes and rotations */}
                  <ellipse cx="15" cy="25" rx="18" ry="10" fill={currentTheme.secondary} opacity="0.25" transform="rotate(-50 15 25)" />
                  <ellipse cx="20" cy="45" rx="15" ry="8" fill={currentTheme.tertiary} opacity="0.3" transform="rotate(-35 20 45)" />
                  <ellipse cx="12" cy="65" rx="20" ry="11" fill={currentTheme.secondary} opacity="0.2" transform="rotate(-55 12 65)" />
                  <ellipse cx="18" cy="85" rx="16" ry="9" fill={currentTheme.accent} opacity="0.25" transform="rotate(-40 18 85)" />
                  <ellipse cx="13" cy="105" rx="19" ry="10" fill={currentTheme.secondary} opacity="0.3" transform="rotate(-48 13 105)" />
                  <ellipse cx="17" cy="125" rx="17" ry="9" fill={currentTheme.tertiary} opacity="0.25" transform="rotate(-42 17 125)" />
                  <ellipse cx="14" cy="145" rx="18" ry="10" fill={currentTheme.secondary} opacity="0.2" transform="rotate(-52 14 145)" />
                  <ellipse cx="19" cy="165" rx="16" ry="8" fill={currentTheme.accent} opacity="0.3" transform="rotate(-38 19 165)" />

                  {/* Small accent leaves */}
                  <ellipse cx="25" cy="35" rx="10" ry="6" fill={currentTheme.tertiary} opacity="0.2" transform="rotate(-25 25 35)" />
                  <ellipse cx="8" cy="75" rx="11" ry="6" fill={currentTheme.accent} opacity="0.2" transform="rotate(-60 8 75)" />
                  <ellipse cx="23" cy="115" rx="10" ry="5" fill={currentTheme.tertiary} opacity="0.25" transform="rotate(-30 23 115)" />
                  <ellipse cx="10" cy="155" rx="12" ry="6" fill={currentTheme.accent} opacity="0.2" transform="rotate(-55 10 155)" />
                </svg>
              </div>

              {/* Decorative leaves - right */}
              <div className="absolute top-0 right-0 w-40 h-full opacity-15">
                <svg viewBox="0 0 120 200" className="w-full h-full">
                  {/* Main vine */}
                  <path d="M105,10 Q110,30 105,50 Q100,70 105,90 Q110,110 105,130 Q100,150 105,170 Q110,190 105,200"
                    stroke={currentTheme.secondary} strokeWidth="2.5" fill="none" opacity="0.4" />

                  {/* Leaves - varied sizes and rotations */}
                  <ellipse cx="105" cy="25" rx="18" ry="10" fill={currentTheme.secondary} opacity="0.25" transform="rotate(50 105 25)" />
                  <ellipse cx="100" cy="45" rx="15" ry="8" fill={currentTheme.tertiary} opacity="0.3" transform="rotate(35 100 45)" />
                  <ellipse cx="108" cy="65" rx="20" ry="11" fill={currentTheme.secondary} opacity="0.2" transform="rotate(55 108 65)" />
                  <ellipse cx="102" cy="85" rx="16" ry="9" fill={currentTheme.accent} opacity="0.25" transform="rotate(40 102 85)" />
                  <ellipse cx="107" cy="105" rx="19" ry="10" fill={currentTheme.secondary} opacity="0.3" transform="rotate(48 107 105)" />
                  <ellipse cx="103" cy="125" rx="17" ry="9" fill={currentTheme.tertiary} opacity="0.25" transform="rotate(42 103 125)" />
                  <ellipse cx="106" cy="145" rx="18" ry="10" fill={currentTheme.secondary} opacity="0.2" transform="rotate(52 106 145)" />
                  <ellipse cx="101" cy="165" rx="16" ry="8" fill={currentTheme.accent} opacity="0.3" transform="rotate(38 101 165)" />

                  {/* Small accent leaves */}
                  <ellipse cx="95" cy="35" rx="10" ry="6" fill={currentTheme.tertiary} opacity="0.2" transform="rotate(25 95 35)" />
                  <ellipse cx="112" cy="75" rx="11" ry="6" fill={currentTheme.accent} opacity="0.2" transform="rotate(60 112 75)" />
                  <ellipse cx="97" cy="115" rx="10" ry="5" fill={currentTheme.tertiary} opacity="0.25" transform="rotate(30 97 115)" />
                  <ellipse cx="110" cy="155" rx="12" ry="6" fill={currentTheme.accent} opacity="0.2" transform="rotate(55 110 155)" />
                </svg>
              </div>

              {/* Content Container */}
              <div className="relative z-10 h-full flex flex-col p-8 pb-14">

                {/* Header with logos */}
                <div className="flex items-center gap-3 mb-4">
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
                  <div className="w-[580px] flex flex-col justify-start pt-1">

                    {/* Event Series Name */}
                    {event.eventSeriesName && (
                      <div className="mb-3">
                        <h1 className="text-4xl font-black leading-none mb-1" style={{ color: currentTheme.primary }}>
                          {event.eventSeriesName}
                        </h1>
                        <p className="text-md font-semibold tracking-wide" style={{ color: currentTheme.secondary }}>
                          (Gender-Related Initiative Talks)
                        </p>
                      </div>
                    )}


                    {/* Date, Time, QR Code Box - Side by side */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-white px-5 py-3 rounded-xl" style={{ backgroundColor: currentTheme.primary }}>
                        <div className="text-xl font-black leading-none">{formatDate(event.startDate).split(' ')[0]}</div>
                        <div className="text-xs font-bold mt-1">{formatDate(event.startDate).split(' ').slice(1).join(' ')}</div>
                        <div className="text-[10px] font-semibold mt-2">{formatTime(event.startDate)}</div>
                        <div className="text-[10px] font-medium mt-0.5">via {event.mode === 'Online' ? event.venue || 'Zoom' : 'In-person'}</div>
                      </div>

                      {qrCodeUrl && (
                        <div className="bg-white p-2 rounded-xl border-2" style={{ borderColor: currentTheme.secondary }}>
                          <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" />
                        </div>
                      )}
                    </div>

                    {/* Registration Link - Always show */}
                    <div className="text-white px-3 py-2 rounded-lg w-full" style={{ backgroundColor: currentTheme.primary }}>
                      <p className="text-[9px] font-black uppercase tracking-wide break-all leading-tight">
                        Register: {registrationUrl.replace('https://', '').replace('http://', '')}
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Speaker Info - Fixed Width */}
                  <div className="w-[340px] flex flex-col items-center justify-start pt-0 pr-1 -mt-2">

                    {/* Speaker Photo - Gradient border like original */}
                    <div className="relative w-52 h-52 mb-2">
                      <div
                        className="absolute inset-0 rounded-full p-1"
                        style={{
                          background: `linear-gradient(135deg, ${currentTheme.secondary} 0%, ${currentTheme.accent} 50%, ${currentTheme.tertiary} 100%)`
                        }}
                      >
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

                    {/* Speaker Info Box - Theme colors */}
                    <div
                      className="bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg max-w-full border-2"
                      style={{ borderColor: `${currentTheme.secondary}4D` }}
                    >
                      {/* Speaker Name */}
                      {event.speakerName && (
                        <h3 className="text-base font-black text-center leading-tight mb-1" style={{ color: currentTheme.primary }}>
                          {event.speakerName}
                        </h3>
                      )}

                      {/* Speaker Title */}
                      {event.speakerTitle && (
                        <p className="text-xs font-bold text-center mb-0.5" style={{ color: currentTheme.tertiary }}>
                          {event.speakerTitle}
                        </p>
                      )}

                      {/* Speaker Affiliation */}
                      {event.speakerAffiliation && (
                        <p className="text-[11px] italic text-center leading-snug" style={{ color: currentTheme.secondary }}>
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
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
          {/* Registration Link */}
          <div className="mb-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                  Registration Link
                </p>
                <p className="text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate">
                  {registrationUrl}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-gia-600 hover:bg-gia-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                {linkCopied ? (
                  <>
                    <Check size={12} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Download Actions */}
          <div className="flex items-center justify-between gap-3">
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
                onClick={handleCopyImage}
                disabled={isGenerating}
                className="px-5 py-2 bg-neutral-600 hover:bg-neutral-700 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
              >
                {isCopied ? (
                  <>
                    <Check size={13} /> Copied!
                  </>
                ) : isGenerating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Copying...
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Copy Image
                  </>
                )}
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
    </div>
  );
}
