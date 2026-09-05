import React, { useState } from 'react';
import { GitCompare, X, Pin, Copy, Check, ArrowRight } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const ResponseDiffModal: React.FC = () => {
  const { isDiffModalOpen, setIsDiffModalOpen, tabs, activeTabId, history } = useStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const currentResponse = activeTab?.response;

  const [compareSource, setCompareSource] = useState<'last-history' | 'custom'>('last-history');
  const [baselineJson, setBaselineJson] = useState<string>('{\n  \"status\": \"old_value\"\n}');
  const [copied, setCopied] = useState(false);

  if (!isDiffModalOpen) return null;

  const currentJsonStr = currentResponse?.data 
    ? (typeof currentResponse.data === 'object' ? JSON.stringify(currentResponse.data, null, 2) : String(currentResponse.data))
    : '{\n  \"message\": \"No current response data\"\n}';

  const previousHistoryItem = history.find(h => h.url === activeTab?.url && h.snapshot.response);
  const previousJsonStr = previousHistoryItem?.snapshot.response?.data
    ? (typeof previousHistoryItem.snapshot.response.data === 'object' 
        ? JSON.stringify(previousHistoryItem.snapshot.response.data, null, 2)
        : String(previousHistoryItem.snapshot.response.data))
    : baselineJson;

  // Compute line-by-line diff
  const currentLines = currentJsonStr.split('\n');
  const baselineLines = (compareSource === 'last-history' ? previousJsonStr : baselineJson).split('\n');

  let added = 0;
  let removed = 0;

  const diffRows = currentLines.map((line, idx) => {
    const baseLine = baselineLines[idx];
    if (baseLine === undefined) {
      added++;
      return { type: 'added', current: line, base: '' };
    }
    if (line !== baseLine) {
      return { type: 'modified', current: line, base: baseLine };
    }
    return { type: 'same', current: line, base: baseLine };
  });

  if (baselineLines.length > currentLines.length) {
    removed = baselineLines.length - currentLines.length;
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
      <div className="w-full max-w-5xl bg-pulse-card border border-pulse-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-pulse-border flex items-center justify-between bg-[#111624]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">Visual Response Diff Engine</h3>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">Unique to Pulse</span>
              </div>
              <p className="text-[11px] text-slate-400">Compare current API response against past requests, environments, or baselines.</p>
            </div>
          </div>
          <button
            onClick={() => setIsDiffModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-pulse-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls & Diff Summary */}
        <div className="px-5 py-3 bg-[#090d16] border-b border-pulse-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Compare with:</span>
            <button
              onClick={() => setCompareSource('last-history')}
              className={'px-3 py-1 rounded-md font-medium transition-colors ' + (compareSource === 'last-history' ? 'bg-blue-600 text-white' : 'bg-pulse-panel text-slate-400 hover:text-slate-200')}
            >
              Previous Request (History)
            </button>
            <button
              onClick={() => setCompareSource('custom')}
              className={'px-3 py-1 rounded-md font-medium transition-colors ' + (compareSource === 'custom' ? 'bg-blue-600 text-white' : 'bg-pulse-panel text-slate-400 hover:text-slate-200')}
            >
              Custom / Pinned Baseline
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-400 font-bold">+{added} Added</span>
            {removed > 0 && <span className="text-rose-400 font-bold">-{removed} Removed</span>}
          </div>
        </div>

        {/* Diff Side-by-Side View */}
        <div className="flex-1 flex overflow-hidden divide-x divide-pulse-border bg-[#070a10]">
          {/* Left: Baseline */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-[#0c101a] border-b border-pulse-border text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>Baseline / Previous Response</span>
              {compareSource === 'custom' && <span className="text-[10px] text-cyan-400">(Editable)</span>}
            </div>
            {compareSource === 'custom' ? (
              <textarea
                value={baselineJson}
                onChange={(e) => setBaselineJson(e.target.value)}
                className="w-full flex-1 p-4 bg-transparent font-mono text-xs text-slate-300 resize-none focus:outline-none leading-relaxed"
              />
            ) : (
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-0.5 leading-relaxed">
                {diffRows.map((r, i) => (
                  <div
                    key={i}
                    className={'px-2 py-0.5 rounded ' + (r.type === 'modified' ? 'bg-amber-500/15 text-amber-300' : 'text-slate-400')}
                  >
                    {r.base || ' '}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Current Response */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-[#0c101a] border-b border-pulse-border text-xs font-semibold text-emerald-400 flex items-center justify-between">
              <span>Current Active Response</span>
              <span className="text-[10px] font-mono text-slate-400">{currentResponse?.timeMs}ms</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-0.5 leading-relaxed">
              {diffRows.map((r, i) => (
                <div
                  key={i}
                  className={'px-2 py-0.5 rounded ' + (r.type === 'added' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : r.type === 'modified' ? 'bg-amber-500/15 text-amber-200' : 'text-slate-200')}
                >
                  {r.current}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};