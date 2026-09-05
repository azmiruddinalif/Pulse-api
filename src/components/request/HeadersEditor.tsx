import React from 'react';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { KeyValuePair } from '../../types';

export const HeadersEditor: React.FC = () => {
  const { tabs, activeTabId, updateActiveTab } = useStore();
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return null;
  const headers = tab.headers || [];

  const handleUpdate = (id: string, field: keyof KeyValuePair, value: any) => {
    const updated = headers.map(h => h.id === id ? { ...h, [field]: value } : h);
    updateActiveTab({ headers: updated });
  };

  const handleAdd = (key = '', value = '') => {
    const newHeader: KeyValuePair = {
      id: 'h_' + Math.random().toString(36).substring(2, 8),
      key,
      value,
      enabled: true,
    };
    updateActiveTab({ headers: [...headers, newHeader] });
  };

  const handleDelete = (id: string) => {
    updateActiveTab({ headers: headers.filter(h => h.id !== id) });
  };

  return (
    <div className="p-3.5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Headers ({headers.filter(h => h.enabled && h.key).length})
          </span>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span className="text-slate-500 hidden sm:inline">Presets:</span>
            <button
              onClick={() => handleAdd('Content-Type', 'application/json')}
              className="px-2 py-0.5 rounded bg-pulse-card hover:bg-pulse-hover border border-pulse-border text-slate-300 transition-colors"
            >
              + JSON
            </button>
            <button
              onClick={() => handleAdd('Authorization', 'Bearer {{api_token}}')}
              className="px-2 py-0.5 rounded bg-pulse-card hover:bg-pulse-hover border border-pulse-border text-slate-300 transition-colors"
            >
              + Bearer
            </button>
            <button
              onClick={() => handleAdd('Accept', 'application/json')}
              className="px-2 py-0.5 rounded bg-pulse-card hover:bg-pulse-hover border border-pulse-border text-slate-300 transition-colors"
            >
              + Accept
            </button>
          </div>
        </div>
        <button
          onClick={() => handleAdd()}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Header</span>
        </button>
      </div>

      <div className="border border-pulse-border rounded-lg overflow-hidden bg-pulse-panel shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#090d16] text-slate-400 border-b border-pulse-border uppercase text-[10px] font-semibold tracking-wider">
            <tr>
              <th className="w-10 px-3 py-2 text-center">Active</th>
              <th className="px-3 py-2 w-1/2">Header Key</th>
              <th className="px-3 py-2 w-1/2">Header Value</th>
              <th className="w-10 px-3 py-2 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pulse-border">
            {headers.map(h => (
              <tr key={h.id} className="hover:bg-pulse-hover/50 transition-colors">
                <td className="px-3 py-1.5 text-center">
                  <button
                    onClick={() => handleUpdate(h.id, 'enabled', !h.enabled)}
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    {h.enabled ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    value={h.key}
                    onChange={(e) => handleUpdate(h.id, 'key', e.target.value)}
                    placeholder="Content-Type, Authorization..."
                    className="w-full bg-transparent px-2 py-1 rounded text-slate-200 font-mono focus:bg-pulse-card focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    value={h.value}
                    onChange={(e) => handleUpdate(h.id, 'value', e.target.value)}
                    placeholder="application/json or {{token}}"
                    className="w-full bg-transparent px-2 py-1 rounded text-slate-200 font-mono focus:bg-pulse-card focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            <tr className="hover:bg-pulse-hover/30 bg-[#070a10]/50">
              <td className="px-3 py-1.5 text-center text-slate-600">
                <Square className="w-4 h-4 opacity-40 mx-auto" />
              </td>
              <td className="px-2 py-1">
                <input
                  type="text"
                  value=""
                  onChange={(e) => {
                    const newH: KeyValuePair = {
                      id: 'h_' + Math.random().toString(36).substring(2, 8),
                      key: e.target.value,
                      value: '',
                      enabled: true,
                    };
                    updateActiveTab({ headers: [...headers, newH] });
                  }}
                  placeholder="+ Type new header key..."
                  className="w-full bg-transparent px-2 py-1 rounded text-slate-400 font-mono placeholder-slate-600 focus:bg-pulse-card focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="text"
                  disabled
                  placeholder="Header Value"
                  className="w-full bg-transparent px-2 py-1 rounded text-slate-600 font-mono placeholder-slate-700 cursor-not-allowed"
                />
              </td>
              <td className="px-3 py-1.5 text-center"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};