import { useState, useRef } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function EventReportExporter({ event, attendanceData, isOpen, onClose }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef(null);

  if (!isOpen || !event) return null;

  const totalParticipants = attendanceData?.length || 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: '2-digit', day: '2-digit', year: '2-digit'
    });
  };

  const handleExportPDF = async () => {
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
      pdf.save(`${event.title.replace(/\s+/g, '_')}_GAD_Report.pdf`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const cellStyle = {
    border: '1px solid black',
    padding: '12px 10px', // Increased padding for vertical breathing room
    fontSize: '11px',
    verticalAlign: 'top',
    color: '#000',
    fontFamily: 'Arial, sans-serif'
  };

  const labelStyle = { fontWeight: 'bold' };

  return (
    <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh] border border-neutral-200">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-sm font-black text-neutral-800 uppercase tracking-widest">Document Preview</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isGenerating}
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-2"
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              EXPORT PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Paper Container */}
        <div className="flex-1 overflow-y-auto bg-neutral-100 p-8">
          <div className="flex justify-center">
            <div
              ref={reportRef}
              className="bg-white shadow-xl"
              style={{
                width: '210mm',
                height: '297mm', // Fixed height to match A4 precisely
                padding: '12mm 18mm',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* HEADER IMAGE */}
              <img src="/report_header.png" alt="Header" className="w-full h-auto mb-4" />

              <h1 className="text-center font-bold text-[14px] mb-6 tracking-[0.2em] uppercase">
                GAD Report & Documentation
              </h1>

              {/* MAIN DATA TABLE - Stretches to fill space */}
              <table className="w-full border-collapse border-[1.5px] border-black" style={{ flex: 1 }}>
                <tbody>
                  <tr>
                    <td style={{ ...cellStyle, width: '70%' }}>
                      <span style={labelStyle}>Event Title:</span> {event.title}
                    </td>
                    <td style={{ ...cellStyle, width: '30%' }}>
                      <span style={labelStyle}>Event Status:</span> {event.status || 'Done'}
                    </td>
                  </tr>

                  <tr>
                    <td colSpan="2" style={cellStyle}>
                      <span style={labelStyle}>Event Series:</span> {event.eventSeriesName || 'N/A'}
                    </td>
                  </tr>

                  <tr>
                    <td colSpan="2" style={cellStyle}>
                      <span style={labelStyle}>Description:</span> {event.description}
                    </td>
                  </tr>

                  <tr>
                    <td colSpan="2" style={cellStyle}>
                      <span style={labelStyle}>GAD Mandate:</span> {event.gadMandate}
                    </td>
                  </tr>

                  {/* Organizer/Date/Venue Row */}
                  <tr style={{ height: '60px' }}>
                    <td colSpan="2" className="p-0 border-none">
                      <table className="w-full h-full border-collapse">
                        <tbody>
                          <tr>
                            <td style={{ ...cellStyle, borderTop: 'none', borderLeft: 'none', width: '33.3%' }}>
                              <span style={labelStyle}>Organizer:</span><br />{event.organizer}
                            </td>
                            <td style={{ ...cellStyle, borderTop: 'none', width: '33.3%' }}>
                              <span style={labelStyle}>Date:</span><br />{formatDate(event.startDate)} - {formatDate(event.endDate)}
                            </td>
                            <td style={{ ...cellStyle, borderTop: 'none', borderRight: 'none', width: '33.4%' }}>
                              <span style={labelStyle}>Venue Platform:</span><br />{event.venue}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* Stats Row */}
                  <tr>
                    <td colSpan="2" className="p-0 border-none">
                      <table className="w-full border-collapse">
                        <tbody>
                          <tr>
                            <td style={{ ...cellStyle, borderTop: 'none', borderLeft: 'none', width: '33.3%' }}>
                              <span style={labelStyle}>Total Participants:</span> {totalParticipants}
                            </td>
                            <td style={{ ...cellStyle, borderTop: 'none', width: '33.3%' }}>
                              <span style={labelStyle}>Target Participants:</span> {event.targetParticipants}
                            </td>
                            <td style={{ ...cellStyle, borderTop: 'none', borderRight: 'none', width: '33.4%' }}>
                              <span style={labelStyle}>Event type:</span> {event.eventType}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* Group/Budget Row */}
                  <tr>
                    <td colSpan="2" className="p-0 border-none">
                      <table className="w-full border-collapse">
                        <tbody>
                          <tr>
                            <td style={{ ...cellStyle, borderTop: 'none', borderLeft: 'none', width: '33.3%' }}>
                              <span style={labelStyle}>Target Group:</span> {event.targetGroup}
                            </td>
                            <td style={{ ...cellStyle, borderTop: 'none', width: '33.3%' }}>
                              <span style={labelStyle}>Budget Allocation:</span> {event.budget}
                            </td>
                            <td style={{ ...cellStyle, borderTop: 'none', borderRight: 'none', width: '33.4%' }}>
                              <span style={labelStyle}>Funding Source:</span> {event.fundingSource}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan="2" style={cellStyle}>
                      <span style={labelStyle}>Speaker/s:</span> {event.speakers}
                    </td>
                  </tr>

                  {/* THE STRETCH ROWS: These soak up the remaining page height */}
                  <tr>
                    <td colSpan="2" style={{ ...cellStyle, height: '150px' }}>
                      <span style={labelStyle}>Objectives/Expected Output:</span>
                      <div className="mt-3 ml-4 whitespace-pre-wrap text-[10.5px] leading-relaxed">
                        {event.objectives}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan="2" style={{ ...cellStyle, height: '200px' }}>
                      <span style={labelStyle}>Accomplishment Notes:</span>
                      <div className="mt-3 ml-4 whitespace-pre-wrap text-[10.5px] leading-relaxed">
                        {event.accomplishmentNotes}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* FOOTER IMAGE */}
              <div className="mt-6">
                <img src="/report_footer.png" alt="Footer" className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}