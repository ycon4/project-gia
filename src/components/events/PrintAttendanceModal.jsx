import { useState } from 'react';
import { X, Printer, Check } from 'lucide-react';
import {
  Document, Packer, Paragraph, Table, TableCell, TableRow,
  WidthType, AlignmentType, BorderStyle, TextRun, PageOrientation, ShadingType
} from 'docx';
import { saveAs } from 'file-saver';

const HEADER_COLORS = {
  black: { name: 'Black', value: '#000000', rgb: '000000' },
  maroon: { name: 'Maroon', value: '#991b1b', rgb: '991b1b' },
  darkMaroon: { name: 'Dark Maroon', value: '#7f1d1d', rgb: '7f1d1d' },
  maroon: { name: 'Maroon', value: '#741112', rgb: '741112' },
  lilac: { name: 'Lilac', value: '#a855f7', rgb: 'a855f7' },
};

export default function PrintAttendanceModal({ event, attendanceData, sessions, onClose }) {
  const [selectedColumns, setSelectedColumns] = useState(['number', 'name', 'sex', 'office_college', 'sector']);
  const [selectedColor, setSelectedColor] = useState('maroon');
  const [selectedSessions, setSelectedSessions] = useState(['all']);
  const [isGenerating, setIsGenerating] = useState(false);

  // Build available columns based on event's formConfig
  const AVAILABLE_COLUMNS = (() => {
    const baseColumns = [
      { id: 'number', label: 'No.', width: 5, field: null },
      { id: 'name', label: 'Name', width: 25, field: 'fullName' },
      { id: 'sex', label: 'Sex (M/F)', width: 10, field: 'sex' },
    ];

    // Map of formConfig field IDs to column definitions
    const optionalColumns = {
      age: { id: 'age', label: 'Age', width: 8, field: 'age' },
      home_address: { id: 'home_address', label: 'Home Address', width: 20, field: 'home_address' },
      id_number: { id: 'id_number', label: 'ID Number', width: 15, field: 'id_number' },
      email: { id: 'email', label: 'Email', width: 20, field: 'email' },
      phone: { id: 'phone', label: 'Phone', width: 15, field: 'phone' },
      emergency_contact: { id: 'emergency_contact', label: 'Emergency Contact', width: 20, field: 'emergency_contact' },
      office_college: { id: 'office_college', label: 'College/Dept', width: 20, field: 'office_college' },
      department: { id: 'department', label: 'Department', width: 20, field: 'department' },
      designation: { id: 'designation', label: 'Designation', width: 15, field: 'designation' },
      sector: { id: 'sector', label: 'Sector', width: 12, field: 'sector' },
      year_level: { id: 'year_level', label: 'Year Level', width: 12, field: 'year_level' },
      pwd_status: { id: 'pwd_status', label: 'PWD Status', width: 12, field: 'pwd_status' },
      ethnic_group: { id: 'ethnic_group', label: 'Ethnic Group', width: 15, field: 'ethnic_group' },
      employment_status: { id: 'employment_status', label: 'Employment Status', width: 15, field: 'employment_status' },
    };

    // Add columns based on event's formConfig
    if (event?.formConfig) {
      Object.keys(event.formConfig).forEach(fieldId => {
        if (event.formConfig[fieldId] && optionalColumns[fieldId]) {
          baseColumns.push(optionalColumns[fieldId]);
        }
      });
    }

    return baseColumns;
  })();

  // Debug: Log the data
  console.log('?? Print Modal Data:', {
    event,
    attendanceData,
    attendanceCount: attendanceData?.length,
    sessions,
    sampleAttendee: attendanceData?.[0]
  });

  const availableSessions = (() => {
    const sessionList = [];

    // Add Pre-Registration if event has it
    if (event?.hasPreReg) {
      sessionList.push('Pre-Registration');
    }

    // Add all other sessions
    if (sessions && sessions.length > 0) {
      sessionList.push(...sessions);
    }

    // Fallback if no sessions at all
    if (sessionList.length === 0) {
      sessionList.push('General Attendance');
    }

    return sessionList;
  })();

  const toggleColumn = (columnId) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const toggleSession = (session) => {
    if (session === 'all') {
      setSelectedSessions(['all']);
    } else {
      setSelectedSessions(prev => {
        const filtered = prev.filter(s => s !== 'all');
        if (filtered.includes(session)) {
          const newSessions = filtered.filter(s => s !== session);
          return newSessions.length === 0 ? ['all'] : newSessions;
        } else {
          return [...filtered, session];
        }
      });
    }
  };

  // Format date from YYYY-MM-DD to "Month DD, YYYY" format
  const formatEventDate = (startDate, endDate) => {
    if (!startDate) return 'Date TBA';

    try {
      const start = new Date(startDate + 'T00:00:00');
      const startFormatted = start.toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric'
      });

      // If there's an end date and it's different from start date
      if (endDate && endDate !== startDate) {
        const end = new Date(endDate + 'T00:00:00');
        const endFormatted = end.toLocaleDateString('en-US', {
          month: 'long',
          day: '2-digit',
          year: 'numeric'
        });
        return `${startFormatted} - ${endFormatted}`;
      }

      return startFormatted;
    } catch (error) {
      return startDate; // Fallback to original if parsing fails
    }
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    try {
      // Debug color selection
      console.log('?? BEFORE: selectedColor state =', selectedColor);
      console.log('?? BEFORE: HEADER_COLORS =', HEADER_COLORS);

      const color = HEADER_COLORS[selectedColor];

      console.log('?? AFTER: color object =', color);
      console.log('?? AFTER: color.rgb =', color?.rgb);

      if (!color) {
        console.error('? Color not found! Using maroon as fallback');
        const fallbackColor = HEADER_COLORS.maroon;
        console.log('?? Fallback color:', fallbackColor);
      }

      const selectedCols = AVAILABLE_COLUMNS.filter(col => selectedColumns.includes(col.id));

      const sessionsToInclude = selectedSessions.includes('all')
        ? availableSessions
        : selectedSessions;

      const sections = sessionsToInclude.map((session) => {
        // Normalize session names for comparison
        const normalizeSession = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
        const targetSession = normalizeSession(session);

        // Try to filter by session with normalized comparison
        let sessionAttendance = attendanceData.filter(a => {
          const recordSession = normalizeSession(a.session_name || a.session || '');

          // Match by normalized session name
          if (recordSession === targetSession) return true;

          // Special case: Pre-Registration
          if (targetSession === 'pre-registration' && recordSession === 'pre-registration') return true;

          // Special case: General Attendance (records with no session)
          if (targetSession === 'general attendance' && !recordSession) return true;

          return false;
        });

        // If no data matched, use all attendance data as fallback
        if (sessionAttendance.length === 0) {
          console.warn(`?? No data matched session "${session}", using all data`);
          sessionAttendance = attendanceData;
        }

        console.log(`?? Session "${session}":`, {
          totalAttendance: attendanceData.length,
          filteredCount: sessionAttendance.length,
          sampleRecord: sessionAttendance[0],
          sessionField: attendanceData[0]?.session_name || attendanceData[0]?.session,
          selectedColor: selectedColor,
          colorRGB: HEADER_COLORS[selectedColor]?.rgb,
        });

        const headerParagraphs = [
          // Empty paragraph with colored background for top padding
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: '', size: 1 })],
            shading: {
              fill: color.rgb,
              type: ShadingType.SOLID,
              color: color.rgb,
            },
            border: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: event.title || 'Event Attendance',
                bold: true,
                size: 32,
                color: 'FFFFFF',
                font: {
                  name: 'Arial',
                },
              }),
            ],
            shading: {
              fill: color.rgb,
              type: ShadingType.SOLID,
              color: color.rgb,
            },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 200 },
            children: [
              new TextRun({
                text: `${event.venue || 'Venue TBA'} | ${formatEventDate(event.startDate, event.endDate)}`,
                size: 22,
                color: 'FFFFFF',
                font: {
                  name: 'Arial',
                },
              }),
            ],
            shading: {
              fill: color.rgb,
              type: ShadingType.SOLID,
              color: color.rgb,
            },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 400 },
            children: [
              new TextRun({
                text: session,
                bold: true,
                size: 24,
                color: 'FFFFFF',
                font: {
                  name: 'Arial',
                },
              }),
            ],
            shading: {
              fill: color.rgb,
              type: ShadingType.SOLID,
              color: color.rgb,
            },
          }),
          // Empty paragraph with colored background for bottom padding
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: '', size: 1 })],
            shading: {
              fill: color.rgb,
              type: ShadingType.SOLID,
              color: color.rgb,
            },
            border: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
        ];

        const headerCells = selectedCols.map(col =>
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: col.label,
                    bold: true,
                    size: 20,
                    font: {
                      name: 'Arial',
                    },
                  }),
                ],
              })
            ],
            shading: { fill: 'F5E6D3' },
            width: { size: col.width, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
          })
        );

        const dataRows = sessionAttendance.map((attendee, index) => {
          const dataCells = selectedCols.map(col => {
            let value = '';
            if (col.id === 'number') {
              value = String(index + 1);
            } else if (col.field) {
              // Special handling for sex field - check both 'sex' and 'gender'
              if (col.id === 'sex') {
                value = attendee.sex || attendee.gender || '';
              } else {
                value = attendee[col.field] || '';
              }
            }
            return new TableCell({
              children: [
                new Paragraph({
                  alignment: col.id === 'number' ? AlignmentType.CENTER : AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: String(value),
                      size: 20,
                      font: {
                        name: 'Arial',
                      },
                    }),
                  ],
                })
              ],
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
            });
          });

          return new TableRow({
            children: dataCells,
            height: { value: 400, rule: 'atLeast' },
          });
        });

        const table = new Table({
          rows: [
            new TableRow({
              children: headerCells,
              tableHeader: true,
              height: { value: 500, rule: 'atLeast' },
            }),
            ...dataRows,
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
          },
        });

        return {
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
              size: { orientation: PageOrientation.LANDSCAPE },
            },
          },
          children: [...headerParagraphs, table],
        };
      });

      const doc = new Document({ sections: sections });
      const blob = await Packer.toBlob(doc);
      const fileName = `${event.title || 'Event'}_Attendance_${new Date().toISOString().slice(0, 10)}.docx`;
      saveAs(blob, fileName);

      onClose();
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <Printer size={16} className="text-gia-600" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Print Attendance</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body - No scrolling, compact layout */}
        <div className="px-4 py-3 space-y-3 shrink-0">
          {/* Event Info */}
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2.5">
            <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{event.title}</h3>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              {attendanceData.length} participant{attendanceData.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Sessions */}
          <div>
            <h3 className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wider">Select Sessions</h3>
            <div className="grid grid-cols-3 gap-1.5">
              <label className="flex items-center gap-1.5 p-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedSessions.includes('all')}
                  onChange={() => toggleSession('all')}
                  className="w-3 h-3 text-gia-600 rounded focus:ring-gia-500"
                />
                <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">All Sessions</span>
              </label>
              {availableSessions.map(session => (
                <label
                  key={session}
                  className="flex items-center gap-1.5 p-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedSessions.includes(session)}
                    onChange={() => toggleSession(session)}
                    className="w-3 h-3 text-gia-600 rounded focus:ring-gia-500"
                  />
                  <span className="text-[10px] text-neutral-700 dark:text-neutral-300 truncate">{session}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div>
            <h3 className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wider">Select Columns</h3>
            <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
              {AVAILABLE_COLUMNS.map(col => (
                <label
                  key={col.id}
                  className="flex items-center gap-1.5 p-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col.id)}
                    onChange={() => toggleColumn(col.id)}
                    className="w-3 h-3 text-gia-600 rounded focus:ring-gia-500"
                  />
                  <span className="text-[10px] text-neutral-700 dark:text-neutral-300 truncate">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <h3 className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wider">
              Header Color
              <span className="ml-1.5 text-[9px] font-normal text-neutral-500">
                ({HEADER_COLORS[selectedColor]?.name})
              </span>
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.entries(HEADER_COLORS).map(([key, color]) => (
                <button
                  key={key}
                  onClick={() => setSelectedColor(key)}
                  className={`relative h-9 rounded-lg transition-all ${selectedColor === key ? 'ring-2 ring-offset-2 ring-gia-600 scale-105' : 'hover:scale-105'
                    }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {selectedColor === key && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check size={14} className="text-white drop-shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generateDocument}
            disabled={isGenerating || selectedColumns.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gia-600 hover:bg-gia-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Printer size={13} />
            {isGenerating ? 'Generating...' : 'Generate Document'}
          </button>
        </div>
      </div>
    </div>
  );
}
