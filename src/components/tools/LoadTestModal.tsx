import React, { useState } from 'react';
import { Zap, Play, Square, X, CheckCircle2, AlertTriangle, TrendingUp, Clock, Gauge } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { LoadTestResult } from '../../types';

export const LoadTestModal: React.FC = () => {
  const { isLoadTestModalOpen, setIsLoadTestModalOpen, tabs, activeTabId, resolveVariables } = useStore();
  const tab = tabs.find(t => t.id === activeTabId);

  const [totalRequests, setTotalRequests] = useState(50);
  const [concurrency, setConcurrency] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<LoadTestResult | null>(null);
  const [progress, setProgress] = useState(0);

  if (!isLoadTestModalOpen || !tab) return null;

  const targetUrl = resolveVariables(tab.url);

  const handleStartBlast = async () => {
    setIsRunning(true);
    setResult(null);
    setProgress(0);

    const headers: Record<string, string> = {};
    (tab.headers || []).filter(h => h.enabled && h.key).forEach(h => {
      headers[resolveVariables(h.key)] = resolveVariables(h.value);
    });

    const config = {
      method: tab.method,
      url: targetUrl,
      headers,
      body: tab.body && tab.bodyType !== 'none' ? resolveVariables(tab.body) : undefined,
      totalRequests,
      concurrency,
    };

    try {
      let res: LoadTestResult;
      if (window.pulseAPI?.runLoadTest) {
        res = await window.pulseAPI.runLoadTest(config);
      } else {
        // Browser mock simulation
        const start = performance.now();
        const lats = Array.from({ length: totalRequests }, () => Math.round(50 + Math.random() * 80));
        lats.sort((a, b) => a - b);
        const totalMs = Math.round(performance.now() - start + 450);
        res = {
          totalRequests,
          successfulRequests: totalRequests,
          failedRequests: 0,
          totalDurationMs: totalMs,
          requestsPerSecond: Math.round((totalRequests / (totalMs / 1000)) * 10) / 10,
          latencies: lats,
          minMs: lats[0],
          maxMs: lats[lats.length - 1],
          avgMs: 78,
          p50Ms: lats[Math.floor(lats.length * 0.5)],
          p90Ms: lats[Math.floor(lats.length * 0.9)],
          p95Ms: lats[Math.floor(lats.length * 0.95)],
          statusCodes: { 200: totalRequests },
        };
      }
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
      <div className="w-full max-w-3xl bg-pulse-card border border-pulse-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-pulse-border flex items-center justify-between bg-[#111624]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">Pulse Blast — Load & Stress Tester</h3>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">Unique to Pulse</span>
              </div>
              <p className="text-[11px] text-slate-400">Benchmark throughput, latency percentiles (p50, p95), and error rates instantly.</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoadTestModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-pulse-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Endpoint & Configuration */}
        <div className="p-5 space-y-4 bg-[#090d16] border-b border-pulse-border">
          <div className="flex items-center gap-2 font-mono text-xs bg-[#070a10] p-2.5 rounded-lg border border-pulse-border">
            <span className="font-bold text-blue-400">{tab.method}</span>
            <span className="text-slate-200 truncate flex-1">{targetUrl}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Total Requests</label>
              <select
                value={totalRequests}
                disabled={isRunning}
                onChange={(e) => setTotalRequests(Number(e.target.value))}
                className="w-full h-8 px-2.5 rounded bg-pulse-panel border border-pulse-border text-xs text-slate-200 font-mono focus:outline-none"
              >
                <option value="10">10 requests (quick)</option>
                <option value="25">25 requests</option>
                <option value="50">50 requests (standard)</option>
                <option value="100">100 requests</option>
                <option value="200">200 requests (stress)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Concurrency (Workers)</label>
              <select
                value={concurrency}
                disabled={isRunning}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="w-full h-8 px-2.5 rounded bg-pulse-panel border border-pulse-border text-xs text-slate-200 font-mono focus:outline-none"
              >
                <option value="1">1 worker (sequential)</option>
                <option value="5">5 concurrent workers</option>
                <option value="10">10 concurrent workers</option>
                <option value="20">20 concurrent workers</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleStartBlast}
                disabled={isRunning}
                className="w-full h-8 px-4 rounded bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Blasting...' : 'Start Blast'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Dashboard */}
        <div className="p-5 flex-1 overflow-y-auto bg-[#070a10]">
          {isRunning && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-semibold text-slate-200">Executing {totalRequests} concurrent requests...</p>
              <p className="text-[11px] text-slate-500 mt-1">Measuring latency percentiles & throughput</p>
            </div>
          )}

          {!isRunning && !result && (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Gauge className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-400" />
              <p>Configure parameters above and click &quot;Start Blast&quot; to test performance.</p>
            </div>
          )}

          {!isRunning && result && (
            <div className="space-y-4">
              {/* Top Key Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-pulse-panel border border-pulse-border">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Throughput</span>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1">{result.requestsPerSecond} <span className="text-xs font-normal text-slate-400">req/s</span></div>
                </div>
                <div className="p-3 rounded-lg bg-pulse-panel border border-pulse-border">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Median (p50)</span>
                  <div className="text-lg font-mono font-bold text-blue-400 mt-1">{result.p50Ms} <span className="text-xs font-normal text-slate-400">ms</span></div>
                </div>
                <div className="p-3 rounded-lg bg-pulse-panel border border-pulse-border">
                  <span className="text-[10px] uppercase font-bold text-slate-400">95th Percentile (p95)</span>
                  <div className="text-lg font-mono font-bold text-purple-400 mt-1">{result.p95Ms} <span className="text-xs font-normal text-slate-400">ms</span></div>
                </div>
                <div className="p-3 rounded-lg bg-pulse-panel border border-pulse-border">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Success Rate</span>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                    {Math.round((result.successfulRequests / result.totalRequests) * 100)}%
                  </div>
                </div>
              </div>

              {/* Detailed Latency Breakdown */}
              <div className="p-4 rounded-lg bg-pulse-panel border border-pulse-border space-y-2">
                <div className="text-xs font-semibold text-slate-300">Latency Distribution</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-300 pt-1">
                  <div><span className="text-slate-500">Min:</span> {result.minMs} ms</div>
                  <div><span className="text-slate-500">Avg:</span> {result.avgMs} ms</div>
                  <div><span className="text-slate-500">p90:</span> {result.p90Ms} ms</div>
                  <div><span className="text-slate-500">Max:</span> {result.maxMs} ms</div>
                </div>
              </div>

              {/* Status Codes Breakdown */}
              <div className="p-4 rounded-lg bg-pulse-panel border border-pulse-border space-y-2">
                <div className="text-xs font-semibold text-slate-300">HTTP Status Codes</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(result.statusCodes).map(([code, count]) => (
                    <div key={code} className="px-2.5 py-1 rounded bg-[#070a10] border border-pulse-border text-xs font-mono flex items-center gap-1.5">
                      <span className={Number(code) >= 200 && Number(code) < 300 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {code === '0' ? 'Network Error' : code}
                      </span>
                      <span className="text-slate-500">x</span>
                      <span className="text-slate-200 font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};