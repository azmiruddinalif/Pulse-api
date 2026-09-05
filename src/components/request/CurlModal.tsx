import React, { useState } from 'react';
import { Terminal, X, ArrowRight, ClipboardPaste } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const CurlModal: React.FC = () => {
  const { isCurlModalOpen, setIsCurlModalOpen, importCurl } = useStore();
  const [curlText, setCurlText] = useState('');

  if (!isCurlModalOpen) return null;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCurlText(text);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImport = () => {
    if (!curlText.trim()) return;
    importCurl(curlText);
    setCurlText('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-pulse-card border border-pulse-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-pulse-border flex items-center justify-between bg-[#111624]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Import cURL Command</h3>
              <p className="text-[11px] text-slate-400">Paste any raw cURL command copied from browser or docs</p>
            </div>
          </div>
          <button
            onClick={() => setIsCurlModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-pulse-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">cURL syntax (e.g. Chrome &quot;Copy as cURL&quot;):</span>
            <button
              onClick={handlePaste}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste Clipboard</span>
            </button>
          </div>

          <textarea
            value={curlText}
            onChange={(e) => setCurlText(e.target.value)}
            placeholder={`curl -X POST https://api.example.com/v1/users -H "Content-Type: application/json" -d '{"name": "Pulse"}'`}
            rows={8}
            className="w-full p-3.5 rounded-lg bg-[#090d16] border border-pulse-border text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none leading-relaxed"
            autoFocus
          />
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-pulse-border flex items-center justify-end gap-2.5 bg-[#111624]">
          <button
            onClick={() => setIsCurlModalOpen(false)}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-pulse-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!curlText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-medium shadow-lg shadow-blue-600/25 transition-all"
          >
            <span>Import to Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
