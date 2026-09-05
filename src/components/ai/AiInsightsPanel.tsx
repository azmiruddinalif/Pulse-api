import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  Clock, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  ChevronRight, 
  ArrowUpRight,
  Code2,
  Gauge,
  FileDown
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { analyzeApiResponse, AuditItem } from './aiAnalyzer';

export const AiInsightsPanel: React.FC = () => {
  const { tabs, activeTabId, updateActiveTab, setIsLoadTestModalOpen } = useStore();
  const tab = tabs.find(t => t.id === activeTabId);
  const response = tab?.response;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'pass'>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!tab || !response) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
        <Sparkles className="w-10 h-10 text-blue-400 mb-3 opacity-60 animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-200">No API Response to Analyze</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Send a request first. Pulse AI will automatically audit response latency, payload compression, caching headers, and backend performance.
        </p>
      </div>
    );
  }

  const report = analyzeApiResponse(tab, response);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAction = (audit: AuditItem) => {
    if (audit.actionType === 'add_header') {
      const existingHeaders = [...tab.headers];
      const hasEncoding = existingHeaders.some(h => h.key.toLowerCase() === 'accept-encoding');
      if (!hasEncoding) {
        existingHeaders.push({
          id: 'h_ai_' + Date.now(),
          key: 'Accept-Encoding',
          value: 'gzip, deflate, br',
          enabled: true,
          description: 'Added by Pulse AI Doctor'
        });
        updateActiveTab({ headers: existingHeaders });
        setActionSuccess('Added Accept-Encoding header to request!');
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } else if (audit.actionType === 'add_cache_header') {
      const existingHeaders = [...tab.headers];
      const hasCache = existingHeaders.some(h => h.key.toLowerCase() === 'cache-control');
      if (!hasCache) {
        existingHeaders.push({
          id: 'h_ai_' + Date.now(),
          key: 'Cache-Control',
          value: 'no-cache',
          enabled: true,
          description: 'Added by Pulse AI Doctor'
        });
        updateActiveTab({ headers: existingHeaders });
        setActionSuccess('Added Cache-Control header to request!');
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } else if (audit.actionType === 'run_blast') {
      setIsLoadTestModalOpen(true);
    }
  };

  const filteredAudits = report.audits.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'critical') return a.severity === 'critical';
    if (filter === 'warning') return a.severity === 'warning';
    if (filter === 'pass') return a.severity === 'pass';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#0a0d14] overflow-y-auto p-4 space-y-4 font-sans text-slate-200 select-text">
      {/* Action Notification */}
      {actionSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Top Banner: Score & Executive Summary */}
      <div className="bg-gradient-to-r from-pulse-card to-[#121927] border border-pulse-border rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Performance Grade Badge */}
          <div className={'w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-2xl border shadow-inner ' + report.gradeColor}>
            {report.grade}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Pulse AI Performance Doctor
              </h2>
              <span className={'text-[10px] font-mono px-2 py-0.5 rounded-full border ' + report.gradeColor}>
                Score: {report.score}/100
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {report.summary}
            </p>
          </div>
        </div>

        {/* Quick Speed Pill */}
        <div className="flex items-center gap-2 bg-pulse-panel/70 border border-pulse-border px-3 py-2 rounded-lg">
          <Clock className="w-4 h-4 text-cyan-400" />
          <div className="text-left">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Speed Category</div>
            <div className="text-xs font-mono font-bold text-slate-100">{report.speedCategory} ({report.stats.durationMs}ms)</div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-pulse-card/80 border border-pulse-border rounded-lg p-3">
          <div className="text-[10px] text-slate-400 font-medium">Response Latency</div>
          <div className="text-sm font-mono font-bold text-cyan-400 mt-1 flex items-baseline gap-1">
            {report.stats.durationMs} <span className="text-[10px] text-slate-400 font-normal">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {report.stats.durationMs > 2000 ? '🔴 Needs backend fix' : report.stats.durationMs > 500 ? '🟡 Moderate' : '🟢 Fast'}
          </div>
        </div>

        <div className="bg-pulse-card/80 border border-pulse-border rounded-lg p-3">
          <div className="text-[10px] text-slate-400 font-medium">Payload Size</div>
          <div className="text-sm font-mono font-bold text-purple-400 mt-1 flex items-baseline gap-1">
            {report.stats.sizeKb} <span className="text-[10px] text-slate-400 font-normal">KB</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {report.stats.sizeKb > 100 ? '🟡 Consider pagination' : '🟢 Lightweight'}
          </div>
        </div>

        <div className="bg-pulse-card/80 border border-pulse-border rounded-lg p-3">
          <div className="text-[10px] text-slate-400 font-medium">Compression</div>
          <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
            {report.stats.isCompressed ? 'Active (gzip/br)' : 'None'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {report.stats.isCompressed ? '🟢 Bandwidth saved' : '🔴 Uncompressed'}
          </div>
        </div>

        <div className="bg-pulse-card/80 border border-pulse-border rounded-lg p-3">
          <div className="text-[10px] text-slate-400 font-medium">Caching Policy</div>
          <div className="text-sm font-mono font-bold text-amber-400 mt-1">
            {report.stats.hasCaching ? 'Configured' : 'Missing'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {report.stats.hasCaching ? '🟢 CDN ready' : '🟡 Origin overhead'}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-pulse-border pb-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={'px-2.5 py-1 rounded-md transition-colors ' + (filter === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200')}
          >
            All Findings ({report.audits.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={'px-2.5 py-1 rounded-md transition-colors ' + (filter === 'critical' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200')}
          >
            Bottlenecks ({report.audits.filter(a => a.severity === 'critical').length})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={'px-2.5 py-1 rounded-md transition-colors ' + (filter === 'warning' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200')}
          >
            Optimizations ({report.audits.filter(a => a.severity === 'warning').length})
          </button>
          <button
            onClick={() => setFilter('pass')}
            className={'px-2.5 py-1 rounded-md transition-colors ' + (filter === 'pass' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200')}
          >
            Passed ({report.audits.filter(a => a.severity === 'pass').length})
          </button>
        </div>

        <button
          onClick={() => setIsLoadTestModalOpen(true)}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Benchmark with Pulse Blast</span>
        </button>
      </div>

      {/* Audit Items List */}
      <div className="space-y-3 pb-6">
        {filteredAudits.map(audit => {
          const isCritical = audit.severity === 'critical';
          const isWarning = audit.severity === 'warning';
          const isPass = audit.severity === 'pass';

          return (
            <div 
              key={audit.id}
              className={'rounded-xl border p-3.5 transition-all ' + (
                isCritical 
                  ? 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50' 
                  : isWarning 
                  ? 'bg-amber-950/10 border-amber-500/30 hover:border-amber-500/50' 
                  : isPass 
                  ? 'bg-emerald-950/10 border-emerald-500/20' 
                  : 'bg-pulse-card border-pulse-border'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {isCritical ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  ) : isPass ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  )}

                  <div>
                    <h4 className={'text-xs font-bold ' + (isCritical ? 'text-rose-300' : isWarning ? 'text-amber-300' : isPass ? 'text-emerald-300' : 'text-slate-200')}>
                      {audit.title}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {audit.message}
                    </p>
                    <div className="text-[11px] text-slate-400 mt-1 italic">
                      Impact: {audit.impact}
                    </div>
                  </div>
                </div>

                {audit.actionLabel && (
                  <button
                    onClick={() => handleAction(audit)}
                    className="flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 hover:text-blue-100 transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <span>{audit.actionLabel}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Code Fix Snippet */}
              {audit.codeFix && (
                <div className="mt-3 bg-[#05080f] rounded-lg border border-pulse-border/60 p-2.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5 pb-1 border-b border-pulse-border/40">
                    <span className="flex items-center gap-1 text-blue-400">
                      <Code2 className="w-3 h-3" />
                      Backend Solution ({audit.codeFix.language})
                    </span>
                    <button
                      onClick={() => handleCopy(audit.id, audit.codeFix!.code)}
                      className="hover:text-slate-200 flex items-center gap-1"
                    >
                      {copiedId === audit.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === audit.id ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
                    {audit.codeFix.code}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
