import React, { useState } from 'react';
import { Plus, Trash2, CheckSquare, Square, AlignLeft, Table } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { KeyValuePair } from '../../types';

export const ParamsEditor: React.FC = () => {
  const { tabs, activeTabId, updateActiveTab } = useStore();
  const tab = tabs.find(t => t.id === activeTabId);
  const [isBulkEdit, setIsBulkEdit] = useState(false);

  if (!tab) return null;
  const params = tab.params || [];

  const handleUpdate = (id: string, field: keyof KeyValuePair, value: any) => {
    const updated = params.map(p => p.id === id ? { ...p, [field]: value } : p);
    updateActiveTab({ params: updated });
  };

  const handleAdd = () => {
    const newParam: KeyValuePair = {
      id: 'p_' + Math.random().toString(36).substring(2, 8),
      key: '',
      value: '',
      enabled: true,
      description: '',
    };
    updateActiveTab({ params: [...params, newParam] });
  };

  const handleDelete = (id: string) => {
    updateActiveTab({ params: params.filter(p => p.id !== id) });
  };

  const handleBulkChange = (text: string) => {
    const lines = text.split('\n');
    const newParams: KeyValuePair[] = lines.map((l, i) => {
      const parts = l.split(/:(.*)/s);
      return {
        id: 'p_' + i + '_' + Math.random().toString(36).substring(2, 6),
        key: parts[0]?.trim() || '',
        value: parts[1]?.trim() || '',
        enabled: true,
      };
    }).filter(p => p.key || p.value);
    updateActiveTab({ params: newParams });
  };

  const bulkText = params.filter(p => p.enabled && p.key).map(p => p.key + ': ' + p.value).join('\n');

  return (
    <div className="p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Query Parameters ({params.filter(p => p.enabled && p.key).length})
          </span>
          <button
            onClick={() => setIsBulkEdit(!isBulkEdit)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-pulse-card border border-pulse-border transition-colors"
          >
            {isBulkEdit ? <Table className="w-3 h-3 text-blue-400" /> : <AlignLeft className="w-3 h-3 text-blue-400" />}
            <span>{isBulkEdit ? 'Key-Value View' : 'Bulk Edit'}</span>
          </button>
        </div>
        {!isBulkEdit && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        )}
      </div>

      {isBulkEdit ? (
        <div className="border border-pulse-border rounded-lg p-2 bg-[#090d16]">
          <textarea
            defaultValue={bulkText}
            onChange={(e) => handleBulkChange(e.target.value)}
            placeholder="key: value\nlimit: 20\npage: 1"
            rows={8}
            className="w-full bg-transparent text-xs font-mono text-slate-200 p-2 focus:outline-none resize-none leading-relaxed"
          />
        </div>
      ) : (
        <div className="border border-pulse-border rounded-lg overflow-hidden bg-pulse-panel shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 border-b border-pulse-border uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="w-10 px-3 py-2 text-center">Active</th>
                <th className="px-3 py-2 w-1/3">Key</th>
                <th className="px-3 py-2 w-1/3">Value</th>
                <th className="px-3 py-2">Description</th>
                <th className="w-10 px-3 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pulse-border">
              {params.map(p => (
                <tr key={p.id} className="hover:bg-pulse-hover/50 transition-colors">
                  <td className="px-3 py-1.5 text-center">
                    <button
                      onClick={() => handleUpdate(p.id, 'enabled', !p.enabled)}
                      className="text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      {p.enabled ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={p.key}
                      onChange={(e) => handleUpdate(p.id, 'key', e.target.value)}
                      placeholder="key (e.g. limit)"
                      className="w-full bg-transparent px-2 py-1 rounded text-slate-200 font-mono focus:bg-pulse-card focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={p.value}
                      onChange={(e) => handleUpdate(p.id, 'value', e.target.value)}
                      placeholder="value or {{var}}"
                      className="w-full bg-transparent px-2 py-1 rounded text-slate-200 font-mono focus:bg-pulse-card focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={p.description || ''}
                      onChange={(e) => handleUpdate(p.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full bg-transparent px-2 py-1 rounded text-slate-400 focus:bg-pulse-card focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Parameter"
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
                      const newParam: KeyValuePair = {
                        id: 'p_' + Math.random().toString(36).substring(2, 8),
                        key: e.target.value,
                        value: '',
                        enabled: true,
                      };
                      updateActiveTab({ params: [...params, newParam] });
                    }}
                    placeholder="+ Type new parameter key..."
                    className="w-full bg-transparent px-2 py-1 rounded text-slate-400 font-mono placeholder-slate-600 focus:bg-pulse-card focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    disabled
                    placeholder="Value"
                    className="w-full bg-transparent px-2 py-1 rounded text-slate-600 font-mono placeholder-slate-700 cursor-not-allowed"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    disabled
                    placeholder="Description"
                    className="w-full bg-transparent px-2 py-1 rounded text-slate-600 placeholder-slate-700 cursor-not-allowed"
                  />
                </td>
                <td className="px-3 py-1.5 text-center"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};