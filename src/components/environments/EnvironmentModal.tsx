import React, { useState } from 'react';
import { Layers, Plus, Trash2, Shield, Eye, EyeOff, X, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Environment, EnvVariable } from '../../types';

export const EnvironmentModal: React.FC = () => {
  const { 
    isEnvModalOpen, 
    setIsEnvModalOpen, 
    environments, 
    activeEnvId, 
    setActiveEnvId, 
    addEnvironment, 
    updateEnvironment, 
    deleteEnvironment 
  } = useStore();

  const [selectedEnvId, setSelectedEnvId] = useState<string>(activeEnvId || 'global');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  if (!isEnvModalOpen) return null;

  const currentEnv = environments.find(e => e.id === selectedEnvId) || environments[0];

  const handleAddVar = () => {
    const newVar: EnvVariable = {
      id: 'v_' + Math.random().toString(36).substring(2, 8),
      key: '',
      value: '',
      isSecret: false,
      enabled: true,
    };
    updateEnvironment({
      ...currentEnv,
      variables: [...currentEnv.variables, newVar]
    });
  };

  const handleUpdateVar = (varId: string, field: keyof EnvVariable, value: any) => {
    const updated = currentEnv.variables.map(v => v.id === varId ? { ...v, [field]: value } : v);
    updateEnvironment({ ...currentEnv, variables: updated });
  };

  const handleDeleteVar = (varId: string) => {
    updateEnvironment({
      ...currentEnv,
      variables: currentEnv.variables.filter(v => v.id !== varId)
    });
  };

  const toggleSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl bg-pulse-card border border-pulse-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-pulse-border flex items-center justify-between bg-[#111624]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Environment & Secret Variables</h3>
              <p className="text-[11px] text-slate-400">Variables are referenced via <code className="text-cyan-300 font-mono">{"{{variable}}"}</code></p>
            </div>
          </div>
          <button
            onClick={() => setIsEnvModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-pulse-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Layout: Left List + Right Variables Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Environments List */}
          <div className="w-56 border-r border-pulse-border p-3 space-y-2 bg-[#0d121d]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Environments</span>
              <button
                onClick={() => {
                  const name = prompt('Enter environment name:');
                  if (name) addEnvironment(name);
                }}
                className="text-blue-400 hover:text-blue-300"
                title="Add Environment"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {environments.map(env => (
              <div
                key={env.id}
                onClick={() => setSelectedEnvId(env.id)}
                className={`px-3 py-2 rounded-lg cursor-pointer text-xs font-medium flex items-center justify-between transition-colors ${
                  env.id === selectedEnvId
                    ? 'bg-blue-600/15 border border-blue-500/30 text-blue-300'
                    : 'text-slate-400 hover:bg-pulse-card hover:text-slate-200'
                }`}
              >
                <span>{env.name}</span>
                {env.id === activeEnvId && (
                  <span className="text-[9px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-1 rounded">Active</span>
                )}
              </div>
            ))}
          </div>

          {/* Right Variables Editor */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{currentEnv.name}</h4>
                <p className="text-[11px] text-slate-500">Encrypted locally with Windows DPAPI</p>
              </div>

              <div className="flex items-center gap-2">
                {currentEnv.id !== activeEnvId && (
                  <button
                    onClick={() => setActiveEnvId(currentEnv.id)}
                    className="px-3 py-1 rounded bg-pulse-panel hover:bg-pulse-hover border border-pulse-border text-xs text-slate-300"
                  >
                    Set as Active
                  </button>
                )}
                <button
                  onClick={handleAddVar}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-xs text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Variable</span>
                </button>
              </div>
            </div>

            <div className="border border-pulse-border rounded-lg overflow-hidden bg-[#090d16]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#101522] text-slate-400 border-b border-pulse-border uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-3 py-2 w-1/3">Variable Name</th>
                    <th className="px-3 py-2">Initial Value</th>
                    <th className="px-3 py-2 w-16 text-center">Secret</th>
                    <th className="px-3 py-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pulse-border">
                  {currentEnv.variables.map(v => (
                    <tr key={v.id} className="hover:bg-pulse-hover/50">
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={v.key}
                          onChange={(e) => handleUpdateVar(v.id, 'key', e.target.value)}
                          placeholder="base_url"
                          className="w-full bg-transparent px-2 py-1 rounded font-mono text-slate-200 focus:bg-pulse-card focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <div className="relative flex items-center">
                          <input
                            type={v.isSecret && !showSecrets[v.id] ? 'password' : 'text'}
                            value={v.value}
                            onChange={(e) => handleUpdateVar(v.id, 'value', e.target.value)}
                            placeholder="value..."
                            className="w-full bg-transparent px-2 py-1 rounded font-mono text-slate-200 focus:bg-pulse-card focus:outline-none pr-8"
                          />
                          {v.isSecret && (
                            <button
                              type="button"
                              onClick={() => toggleSecret(v.id)}
                              className="absolute right-2 text-slate-500 hover:text-slate-300"
                            >
                              {showSecrets[v.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={v.isSecret}
                          onChange={(e) => handleUpdateVar(v.id, 'isSecret', e.target.checked)}
                          className="rounded text-blue-600 focus:ring-0"
                          title="Encrypt with safeStorage"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          onClick={() => handleDeleteVar(v.id)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
