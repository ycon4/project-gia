import React, { useState } from 'react';
import { X, FileText, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export default function ReportGeneratorModal({
  isOpen,
  onClose,
  charts,
  academicPeriod,
  datasetName,
  captureChartFn
}) {
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [reportTitle, setReportTitle] = useState(`${datasetName} Report`);
  const [includeDate, setIncludeDate] = useState(true);
  const [includeInstitution, setIncludeInstitution] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const toggleChart = (index) => {
    setSelectedCharts(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index].sort((a, b) => a - b)
    );
  };

  const selectAll = () => {
    setSelectedCharts(charts.map((_, i) => i));
  };

  const clearAll = () => {
    setSelectedCharts([]);
  };

  const generateDOCX = async () => {
    if (selectedCharts.length === 0) {
      alert('Please select at least one chart to include in the report.');
      return;
    }

    setIsGenerating(true);

    try {
      const sections = [];

      // Cover Page Section
      const coverChildren = [
        new Paragraph({
          text: reportTitle,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { before: 1200, after: 400 },
        }),
      ];

      if (includeInstitution) {
        coverChildren.push(
          new Paragraph({
            text: 'Mindanao State University - Iligan Institute of Technology',
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Gender and Development Office',
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          })
        );
      }

      coverChildren.push(
        new Paragraph({
          text: academicPeriod,
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      if (includeDate) {
        const dateStr = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        coverChildren.push(
          new Paragraph({
            text: `Generated: ${dateStr}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          })
        );
      }

      sections.push({
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: coverChildren,
      });

      // Charts Section - 2 column layout using table
      const chartsChildren = [];

      // Process charts in pairs for 2-column layout
      for (let i = 0; i < selectedCharts.length; i += 2) {
        const leftChartIndex = selectedCharts[i];
        const rightChartIndex = i + 1 < selectedCharts.length ? selectedCharts[i + 1] : null;

        const leftChart = charts[leftChartIndex];
        const rightChart = rightChartIndex !== null ? charts[rightChartIndex] : null;

        // Create table row with 2 cells
        const leftCellChildren = await createChartCell(leftChart, leftChartIndex);
        const rightCellChildren = rightChart ? await createChartCell(rightChart, rightChartIndex) : [];

        const tableRow = new TableRow({
          children: [
            new TableCell({
              children: leftCellChildren,
              width: { size: 48, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
            new TableCell({
              children: rightCellChildren.length > 0 ? rightCellChildren : [new Paragraph({ text: '' })],
              width: { size: 48, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
          ],
        });

        const table = new Table({
          rows: [tableRow],
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
        });

        chartsChildren.push(table);

        // Add spacing between rows
        chartsChildren.push(new Paragraph({ text: '', spacing: { after: 200 } }));
      }

      sections.push({
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: chartsChildren,
      });

      // Helper function to create chart cell content
      async function createChartCell(chart, chartIndex) {
        const cellChildren = [];

        // Title
        cellChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: chart.title,
                bold: true,
                size: 20,
              }),
            ],
            spacing: { after: 100 },
          })
        );

        // Description
        cellChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: chart.desc,
                italics: true,
                size: 16,
              }),
            ],
            spacing: { after: 100 },
          })
        );

        // Summary stats
        if (chart.summary && chart.summary.length > 0) {
          const summaryText = chart.summary.map(s => `${s.label}: ${s.value}`).join(' • ');
          cellChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: summaryText,
                  size: 16,
                }),
              ],
              spacing: { after: 150 },
            })
          );
        }

        // Capture and add chart image
        try {
          const canvas = await captureChartFn(chartIndex);
          if (canvas) {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const arrayBuffer = await blob.arrayBuffer();

            // Calculate dimensions to fit in column (max width ~3 inches)
            const maxWidth = 250; // pixels for DOCX
            const aspectRatio = canvas.height / canvas.width;
            const width = maxWidth;
            const height = maxWidth * aspectRatio;

            cellChildren.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: arrayBuffer,
                    transformation: {
                      width: width,
                      height: height,
                    },
                  }),
                ],
                spacing: { after: 200 },
              })
            );
          }
        } catch (error) {
          console.error(`Failed to capture chart ${chartIndex}:`, error);
        }

        return cellChildren;
      }

      // Create document
      const doc = new Document({
        sections: sections,
      });

      // Generate and save
      const blob = await Packer.toBlob(doc);
      const timestamp = new Date().toISOString().slice(0, 10);
      saveAs(blob, `${reportTitle.replace(/\s+/g, '-')}-${timestamp}.docx`);

    } catch (error) {
      console.error('Failed to generate DOCX:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] border border-neutral-200 dark:border-neutral-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gia-100 dark:bg-gia-900/40 rounded-lg">
              <FileText size={20} className="text-gia-600 dark:text-gia-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Generate Report
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Select charts to include in your Word document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Report Settings */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Report Title
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-gia-500 focus:border-gia-500 outline-none"
              placeholder="Enter report title"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDate}
                onChange={(e) => setIncludeDate(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-gia-600 focus:ring-gia-500"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Include generation date</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInstitution}
                onChange={(e) => setIncludeInstitution(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-gia-600 focus:ring-gia-500"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Include institution information</span>
            </label>
          </div>

          {/* Chart Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Select Charts ({selectedCharts.length} of {charts.length})
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs font-semibold text-gia-600 dark:text-gia-400 hover:text-gia-700 dark:hover:text-gia-300 px-2 py-1 rounded hover:bg-gia-50 dark:hover:bg-gia-900/20 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg p-3">
              {charts.map((chart, index) => (
                <label
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={selectedCharts.includes(index)}
                      onChange={() => toggleChart(index)}
                      className="w-4 h-4 rounded border-neutral-300 text-gia-600 focus:ring-gia-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {index + 1}. {chart.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {chart.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0 flex items-center justify-between">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {selectedCharts.length === 0 ? 'No charts selected' : `${selectedCharts.length} chart${selectedCharts.length !== 1 ? 's' : ''} selected • 2-column layout`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={generateDOCX}
              disabled={isGenerating || selectedCharts.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gia-600 hover:bg-gia-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg text-sm font-bold transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Generate Word Doc
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
