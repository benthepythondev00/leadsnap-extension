import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, FileJson } from 'lucide-react';
import type { Lead, ExportFormat } from '../types/lead';
import { exportUtils } from '../lib/storage';

interface ExportModalProps {
  leads: Lead[];
  onClose: () => void;
}

export function ExportModal({ leads, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [copied, setCopied] = useState(false);

  const getExportContent = () => {
    return format === 'csv' 
      ? exportUtils.toCSV(leads)
      : exportUtils.toJSON(leads);
  };

  const handleDownload = () => {
    const content = getExportContent();
    const filename = `leadsnap-export-${new Date().toISOString().split('T')[0]}.${format}`;
    const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
    exportUtils.downloadFile(content, filename, mimeType);
  };

  const handleCopy = async () => {
    const content = getExportContent();
    await exportUtils.copyToClipboard(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Export Leads</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Export {leads.length} lead{leads.length !== 1 ? 's' : ''} to your preferred format.
          </p>

          {/* Format Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('csv')}
              className={`p-4 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${
                format === 'csv'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className={`w-8 h-8 ${format === 'csv' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="text-center">
                <div className={`font-medium ${format === 'csv' ? 'text-blue-600' : 'text-gray-700'}`}>
                  CSV
                </div>
                <div className="text-xs text-gray-500">For spreadsheets</div>
              </div>
            </button>

            <button
              onClick={() => setFormat('json')}
              className={`p-4 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${
                format === 'json'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileJson className={`w-8 h-8 ${format === 'json' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="text-center">
                <div className={`font-medium ${format === 'json' ? 'text-blue-600' : 'text-gray-700'}`}>
                  JSON
                </div>
                <div className="text-xs text-gray-500">For developers</div>
              </div>
            </button>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 overflow-auto max-h-32 font-mono">
              {getExportContent().substring(0, 500)}
              {getExportContent().length > 500 && '...'}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
