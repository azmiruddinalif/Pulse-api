import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, Clock, X, RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { CollectionItem, SavedRequest } from '../../types';

export const CollectionRunner: React.FC = () => {
  const { isRunnerModalOpen, setIsRunnerModalOpen, runnerCollection, collections, resolveVariables } = useStore();
  const [selectedColId, setSelectedColId] = useState<string>(runnerCollection?.id || collections[0]?.id || '');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Array<{ name: string; url: string; method: string; status: number; timeMs: number; success: boolean }>>([]);
  const [progress, setProgress] = useState(0);

  if (!isRunnerModalOpen) return null;

  const targetCol = collections.find(c => c.id === selectedColId) || collections[0];

  const gatherRequests = (col?: CollectionItem): SavedRequest[] => {
    if (!col) return [];
    const list: SavedRequest[] = [...col.requests];
    for (const f of col.folders) {
      list.push(...f.requests);
    }
    return list;
  };

  const handleRun = async () => {
    const requests = gatherRequests(targetCol);
    if (requests.length === 0) return;

    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const executedResults = [];

    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      const targetUrl = resolveVariables(req.url);

      const headers: Record<string, string> = {};
      req.headers?.filter(h => h.enabled).forEach(h => {
        headers[resolveVariables(h.key)] = resolveVariables(h.value);
      });

      let res: any;
      try {
        if (window.pulseAPI?.sendHttpRequest) {
          res = await window.pulseAPI.sendHttpRequest({
            method: req.method,
            url: targetUrl,
            headers,
            data: req.body ? resolveVariables(req.body) : undefined,
          });
        } else {
          const startTime = performance.now();
          const fetchRes = await fetch(targetUrl, { method: req.method });
          const dur = Math.round(performance.now() - startTime);
          res = { status: fetchRes.status, timeMs: dur };
        }

        const success = res.status >= 200 && res.status < 400;
        executedResults.push({
          name: req.name,
          url: targetUrl,
          method: req.method,
          status: res.status,
          timeMs: res.timeMs,
          success,
        });
      } catch (err: any) {
        executedResults.push({
          name: req.name,
          url: targetUrl,
          method: req.method,
          status: 0,
          timeMs: 0,
          success: false,
        });
      }

      setResults([...executedResults]);
      setProgress(Math.round(((i + 1) / requests.length) * 100));
    }

    setIsRunning(false);
  };

  const passedCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl bg-pulse-card border border-pulse-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Runner Header */}
        <div className="px-5 py-4 border-b border-pulse-border flex items-center justify-between bg-[#111624]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Play className="w-4 h-4 text-emerald-400 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Collection Test Runner</h3>
              <p className="text-[11px] text-slate-400">Sequentially execute all requests in a suite</p>
            </div>
          </div>
          <button
            onClick={() => setIsRunnerModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-pulse-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Runner Body */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Target Collection Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Target Suite:</span>
              <select
                value={selectedColId}
                onChange={(e) => setSelectedColId(e.target.value)}
                className="bg-[#090d16] border border-pulse-border px-3 py-1.5 rounded-lg text-xs text-slate-200 font-medium focus:outline-none"
              >
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
            >
              {isRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isRunning ? 'Running Suite...' : 'Start Run'}</span>
            </button>
          </div>

          {/* Progress Bar & Summary */}
          {results.length > 0 && (
            <div className="p-4 rounded-lg bg-[#090d16] border border-pulse-border space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Progress: {progress}%</span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">{passedCount} Passed</span>
                  <span className="text-rose-400 font-bold">{failedCount} Failed</span>
                </div>
              </div>
              <div className="w-full h-2 rounded bg-pulse-border overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Execution Log Table */}
          <div className="border border-pulse-border rounded-lg overflow-hidden bg-[#090d16]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#101522] text-slate-400 border-b border-pulse-border uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-3 py-2 w-10">Status</th>
                  <th className="px-3 py-2">Request</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pulse-border">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500 font-sans text-xs">
                      Ready to execute. Click &quot;Start Run&quot; above.
                    </td>
                  </tr>
                ) : (
                  results.map((r, idx) => (
                    <tr key={idx} className="hover:bg-pulse-hover/50">
                      <td className="px-3 py-2 text-center">
                        {r.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 inline" />
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        <span className="font-bold text-blue-400 mr-2">{r.method}</span>
                        <span>{r.name}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-300">{r.status || 'ERR'}</td>
                      <td className="px-3 py-2 text-slate-400">{r.timeMs} ms</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
