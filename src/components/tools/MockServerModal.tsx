import React, { useState, useEffect } from 'react';
import { Server, Play, Square, Plus, Trash2, Globe, ExternalLink, X, Check, Clock, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { MockRoute, HttpMethod } from '../../types';

export const MockServerModal: React.FC = () => {
  const { isMockModalOpen, setIsMockModalOpen, createTab } = useStore();

  const [isRunning, setIsRunning] = useState(false);
  const [port, setPort] = useState(3500);
  const [routes, setRoutes] = useState<MockRoute[]>([
    {
      id: 'r1',
      method: 'GET',
      path: '/api/v1/users',
      statusCode: 200,
      delayMs: 150,
      enabled: true,
      responseBody: JSON.stringify([
        { id: 1, name: 'Alice Walker', email: 'alice@pulse.dev', role: 'admin' },
        { id: 2, name: 'Bob Vance', email: 'bob@pulse.dev', role: 'engineer' }
      ], null, 2),
    },
    {
      id: 'r2',
      method: 'POST',
      path: '/api/v1/auth/login',
      statusCode: 200,
      delayMs: 300,
      enabled: true,
      responseBody: JSON.stringify({
        token: 'pulse_jwt_mock_token_998877',
        user: { id: 1, email: 'developer@pulse.dev' }
      }, null, 2),
    },
    {
      id: 'r3',
      method: 'GET',
      path: '/api/v1/health',
      statusCode: 200,
      delayMs: 50,
      enabled: true,
      responseBody: JSON.stringify({ status: 'ok', uptime: 3600, version: '1.0.0' }, null, 2),
    }
  ]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('r1');

  useEffect(() => {
    if (window.pulseAPI?.mockStatus) {
      window.pulseAPI.mockStatus().then((status: any) => {
        if (status) {
          setIsRunning(status.isRunning);
          setPort(status.port || 3500);
          if (status.routes?.length) setRoutes(status.routes);
        }
      });
    }
  }, [isMockModalOpen]);

  if (!isMockModalOpen) return null;

  const handleToggleServer = async () => {
    if (isRunning) {
      if (window.pulseAPI?.mockStop) await window.pulseAPI.mockStop();
      setIsRunning(false);
    } else {
      if (window.pulseAPI?.mockStart) {
        const res = await window.pulseAPI.mockStart(port);
        if (res.success) {
          setIsRunning(true);
          if (window.pulseAPI?.mockSetRoutes) {
            window.pulseAPI.mockSetRoutes(routes);
          }
        }
      } else {
        setIsRunning(true);
      }
    }
  };

  const handleUpdateRoute = (id: string, updates: Partial<MockRoute>) => {
    const updated = routes.map(r => r.id === id ? { ...r, ...updates } : r);
    setRoutes(updated);
    if (window.pulseAPI?.mockSetRoutes) {
      window.pulseAPI.mockSetRoutes(updated);
    }
  };

  const handleAddRoute = () => {
    const newR: MockRoute = {
      id: 'r_' + Math.random().toString(36).substring(2, 8),
      method: 'GET',
      path: '/api/v1/new-endpoint',
      statusCode: 200,
      delayMs: 100,
      enabled: true,
      responseBody: '{\n  "message": "Mock response from Pulse"\n}',
    };
    const updated = [...routes, newR];
    setRoutes(updated);
    setSelectedRouteId(newR.id);
    if (window.pulseAPI?.mockSetRoutes) {
      window.pulseAPI.mockSetRoutes(updated);
    }
  };

  const handleDeleteRoute = (id: string) => {
    if (routes.length <= 1) return;
    const updated = routes.filter(r => r.id !== id);
    setRoutes(updated);
    setSelectedRouteId(updated[0].id);
    if (window.pulseAPI?.mockSetRoutes) {
      window.pulseAPI.mockSetRoutes(updated);
    }
  };

  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  const testRouteInPulse = (r: MockRoute) => {
    setIsMockModalOpen(false);
    const mockUrl = 'http://localhost:' + port + r.path;
    createTab('rest', r.method + ' ' + r.path);
    setTimeout(() => {
      useStore.getState().updateActiveTab({
        method: r.method as HttpMethod,
        url: mockUrl,
      });
    }, 30);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
      <div className="w-full max-w-4xl bg-pulse-card border border-pulse-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-pulse-border flex items-center justify-between bg-[#111624]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Server className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">Zero-Cloud Local Mock Server</h3>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">Unique to Pulse</span>
              </div>
              <p className="text-[11px] text-slate-400">Simulate APIs locally on your machine with custom routes, status codes, and latency.</p>
            </div>
          </div>
          <button
            onClick={() => setIsMockModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-pulse-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Server Controls Bar */}
        <div className="px-5 py-3 bg-[#090d16] border-b border-pulse-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleServer}
              className={'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-lg transition-all active:scale-95 ' + (isRunning ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25')}
            >
              {isRunning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isRunning ? 'Stop Server' : 'Start Mock Server'}</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-mono">
              <div className={'w-2.5 h-2.5 rounded-full ' + (isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600')} />
              <span className={isRunning ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {isRunning ? 'RUNNING on http://localhost:' + port : 'OFFLINE'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Port:</span>
            <input
              type="number"
              value={port}
              disabled={isRunning}
              onChange={(e) => setPort(Number(e.target.value))}
              className="w-18 h-7 px-2 rounded bg-pulse-panel border border-pulse-border text-slate-200 text-xs font-mono focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Layout: Left Route List + Right Route Configuration */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Route List */}
          <div className="w-72 border-r border-pulse-border p-3 space-y-2 bg-[#0d121d] flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mock Endpoints ({routes.length})</span>
              <button
                onClick={handleAddRoute}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5">
              {routes.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className={'p-2.5 rounded-lg border cursor-pointer transition-all text-xs ' + (r.id === selectedRouteId ? 'bg-blue-600/15 border-blue-500/40 text-blue-300' : 'bg-pulse-panel border-pulse-border text-slate-300 hover:bg-pulse-card')}
                >
                  <div className="flex items-center justify-between mb-1 font-mono text-[10px]">
                    <span className="font-bold text-emerald-400">{r.method}</span>
                    <span className="text-slate-400">{r.statusCode}</span>
                  </div>
                  <div className="font-mono text-xs truncate text-slate-200">{r.path}</div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                    <span>{r.delayMs}ms delay</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        testRouteInPulse(r);
                      }}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                      title="Test in Pulse Workspace"
                    >
                      <span>Test</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Route Editor */}
          {activeRoute && (
            <div className="flex-1 p-5 flex flex-col overflow-y-auto space-y-4 bg-[#070a10]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Endpoint Configuration</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testRouteInPulse(activeRoute)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                  >
                    <span>Test in Pulse</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoute(activeRoute.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-pulse-panel transition-colors"
                    title="Delete Route"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Route Parameters Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Method</label>
                  <select
                    value={activeRoute.method}
                    onChange={(e) => handleUpdateRoute(activeRoute.id, { method: e.target.value as HttpMethod })}
                    className="w-full h-8 px-2 rounded bg-pulse-panel border border-pulse-border text-xs font-mono text-slate-200 focus:outline-none"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Status Code</label>
                  <select
                    value={activeRoute.statusCode}
                    onChange={(e) => handleUpdateRoute(activeRoute.id, { statusCode: Number(e.target.value) })}
                    className="w-full h-8 px-2 rounded bg-pulse-panel border border-pulse-border text-xs font-mono text-slate-200 focus:outline-none"
                  >
                    <option value="200">200 OK</option>
                    <option value="201">201 Created</option>
                    <option value="204">204 No Content</option>
                    <option value="400">400 Bad Request</option>
                    <option value="401">401 Unauthorized</option>
                    <option value="404">404 Not Found</option>
                    <option value="500">500 Internal Server Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Simulated Latency</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={activeRoute.delayMs}
                      onChange={(e) => handleUpdateRoute(activeRoute.id, { delayMs: Number(e.target.value) })}
                      className="w-full h-8 px-2 rounded bg-pulse-panel border border-pulse-border text-xs font-mono text-slate-200 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500 font-mono">ms</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Route Path</label>
                <input
                  type="text"
                  value={activeRoute.path}
                  onChange={(e) => handleUpdateRoute(activeRoute.id, { path: e.target.value })}
                  placeholder="/api/v1/resource"
                  className="w-full h-8 px-3 rounded bg-pulse-panel border border-pulse-border text-xs font-mono text-slate-200 focus:outline-none"
                />
              </div>

              {/* Response Body Editor */}
              <div className="flex-1 flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-400">Mock Response Body (JSON)</label>
                  <button
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(activeRoute.responseBody);
                        handleUpdateRoute(activeRoute.id, { responseBody: JSON.stringify(parsed, null, 2) });
                      } catch {}
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Prettify</span>
                  </button>
                </div>
                <textarea
                  value={activeRoute.responseBody}
                  onChange={(e) => handleUpdateRoute(activeRoute.id, { responseBody: e.target.value })}
                  rows={10}
                  className="w-full flex-1 p-3 rounded bg-[#0b0f19] border border-pulse-border text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};