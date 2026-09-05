import { AiInsightsPanel } from '../ai/AiInsightsPanel';
import React, { useState } from 'react';
import { 
  Check,
  Sparkles, 
  Copy, 
  Download, 
  Search, 
  Code, 
  Clock, 
  Layers, 
  Play,
  Trash2,
  GitCompare
} from 'lucide-react';
import { useStore } from '../../store/useStore';

export const ResponseViewer: React.FC = () => {
  const { tabs, activeTabId, sendCurrentRequest, updateActiveTab, setIsDiffModalOpen } = useStore();
  const tab = tabs.find(t => t.id === activeTabId);
  const response = tab?.response;

  const [activeTab, setActiveTab] = useState<'pretty' | 'raw' | 'preview' | 'headers' | 'timing' | 'ai'>('pretty');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  if (!tab) return null;

  if (tab.loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#070a10] text-slate-400 p-6">
        <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-200">Sending Request...</p>
        <p className="text-[11px] text-slate-500 mt-1">Waiting for network response</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#070a10] text-slate-500 p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-pulse-card border border-pulse-border flex items-center justify-center mb-3 text-blue-400 shadow-lg">
          <Code className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">No Response Yet</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mb-4">
          Click Send or press <kbd className="px-1.5 py-0.5 rounded bg-pulse-panel border border-pulse-border font-mono text-[10px] text-slate-300">Ctrl+Enter</kbd> to inspect response data, headers, and timings.
        </p>
        <button
          onClick={sendCurrentRequest}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-lg shadow-blue-600/25 transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Send Request Now</span>
        </button>
      </div>
    );
  }

  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (code >= 300 && code < 400) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (code >= 400 && code < 500) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  };

  const getStatusLabel = (code: number) => {
    if (code === 200) return 'OK';
    if (code === 201) return 'Created';
    if (code === 204) return 'No Content';
    if (code === 400) return 'Bad Request';
    if (code === 401) return 'Unauthorized';
    if (code === 403) return 'Forbidden';
    if (code === 404) return 'Not Found';
    if (code >= 500) return 'Server Error';
    return response.statusText || 'Response';
  };

  const formattedData = typeof response.data === 'object'
    ? JSON.stringify(response.data, null, 2)
    : String(response.data || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'response_' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d14]">
      <div className="px-4 py-2.5 bg-pulse-panel border-b border-pulse-border flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className={'px-2.5 py-1 rounded-md border text-xs font-mono font-bold flex items-center gap-1.5 ' + getStatusBadge(response.status)}>
            <span>{response.status}</span>
            <span>{getStatusLabel(response.status)}</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono text-slate-400 bg-pulse-card px-2 py-1 rounded border border-pulse-border">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className={response.timeMs < 300 ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>{response.timeMs} ms</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono text-slate-400 bg-pulse-card px-2 py-1 rounded border border-pulse-border">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{(response.sizeBytes / 1024).toFixed(2)} KB</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
                    <button
            onClick={() => setIsDiffModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-pulse-card hover:bg-blue-600/20 text-blue-400 border border-pulse-border transition-colors"
            title="Visual Response Diff (Compare with previous response)"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">Diff</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-pulse-card hover:bg-pulse-hover border border-pulse-border text-xs text-slate-300 transition-colors"
            title="Copy Response"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-md bg-pulse-card hover:bg-pulse-hover border border-pulse-border text-slate-300 transition-colors"
            title="Download Response JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateActiveTab({ response: null })}
            className="p-1.5 rounded-md bg-pulse-card hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-pulse-border transition-colors"
            title="Clear Response"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-1.5 bg-[#0d121d] border-b border-pulse-border flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab('pretty')}
            className={'px-3 py-1 rounded font-medium transition-colors ' + (activeTab === 'pretty' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200')}
          >
            Pretty
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={'px-3 py-1 rounded font-medium transition-colors ' + (activeTab === 'raw' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200')}
          >
            Raw
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={'px-3 py-1 rounded font-medium transition-colors ' + (activeTab === 'preview' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200')}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={'px-3 py-1 rounded font-medium transition-colors ' + (activeTab === 'headers' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200')}
          >
            Headers ({Object.keys(response.headers || {}).length})
          </button>
          <button
            onClick={() => setActiveTab('timing')}
            className={'px-3 py-1 rounded font-medium transition-colors ' + (activeTab === 'timing' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200')}
          >
            Timing
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={'px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1.5 ' + (activeTab === 'ai' ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 border border-blue-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-pulse-hover')}
          >
            <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
            <span>AI Doctor</span>
            {response.timeMs > 1000 && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />}
          </button>
        </div>

        {activeTab === 'pretty' && (
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search response..."
              className="h-7 pl-7 pr-2 rounded bg-pulse-panel border border-pulse-border text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-[#070a10]">
        {activeTab === 'pretty' && (
          <pre className="font-mono text-xs text-slate-200 whitespace-pre leading-relaxed">
            {formattedData}
          </pre>
        )}

        {activeTab === 'raw' && (
          <textarea
            readOnly
            value={formattedData}
            rows={20}
            className="w-full h-full bg-transparent font-mono text-xs text-slate-300 resize-none focus:outline-none leading-relaxed"
          />
        )}

        {activeTab === 'preview' && (
          <div className="h-full border border-pulse-border rounded-lg overflow-hidden bg-white">
            <iframe
              srcDoc={typeof response.data === 'string' ? response.data : formattedData}
              title="Response Preview"
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="border border-pulse-border rounded-lg overflow-hidden bg-pulse-panel">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090d16] text-slate-400 border-b border-pulse-border uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 w-1/3">Header Key</th>
                  <th className="px-4 py-2.5">Header Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pulse-border">
                {Object.entries(response.headers || {}).map(([k, v]) => (
                  <tr key={k} className="hover:bg-pulse-hover/50">
                    <td className="px-4 py-2 text-cyan-300 font-semibold">{k}</td>
                    <td className="px-4 py-2 text-slate-300 break-all">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ai' && <AiInsightsPanel />}
        {activeTab === 'timing' && (
          <div className="p-4 space-y-4 max-w-lg">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Network Performance Breakdown
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Time to First Byte (TTFB)</span>
                  <span>{response.timings?.ttfb || Math.round(response.timeMs * 0.75)} ms</span>
                </div>
                <div className="w-full h-2 rounded bg-pulse-border overflow-hidden">
                  <div className="h-full bg-blue-500 rounded" style={{ width: '75%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Content Download</span>
                  <span>{response.timings?.download || Math.round(response.timeMs * 0.25)} ms</span>
                </div>
                <div className="w-full h-2 rounded bg-pulse-border overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded" style={{ width: '25%' }} />
                </div>
              </div>
              <div className="pt-2 border-t border-pulse-border flex justify-between text-xs font-mono font-bold text-slate-100">
                <span>Total Duration</span>
                <span>{response.timeMs} ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};