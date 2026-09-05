import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Key, Lock, User } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { AuthType } from '../../types';

export const AuthEditor: React.FC = () => {
  const { tabs, activeTabId, updateActiveTab } = useStore();
  const tab = tabs.find(t => t.id === activeTabId);
  const [showSecret, setShowSecret] = useState(false);

  if (!tab) return null;
  const auth = tab.auth || { type: 'none' };

  const handleTypeChange = (type: AuthType) => {
    updateActiveTab({ auth: { ...auth, type } });
  };

  const authOptions: { label: string; value: AuthType; desc: string }[] = [
    { label: 'No Auth', value: 'none', desc: 'No authorization header will be attached' },
    { label: 'Bearer Token', value: 'bearer', desc: 'Adds Authorization: Bearer <token>' },
    { label: 'Basic Auth', value: 'basic', desc: 'Adds Authorization: Basic <base64(user:pass)>' },
    { label: 'API Key', value: 'apikey', desc: 'Injects an API key in headers or query parameters' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Auth Mode Radio Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {authOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleTypeChange(opt.value)}
            className={`p-3 rounded-lg border text-left transition-all ${
              auth.type === opt.value
                ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-md'
                : 'bg-pulse-panel border-pulse-border text-slate-400 hover:bg-pulse-hover hover:text-slate-200'
            }`}
          >
            <div className="text-xs font-semibold">{opt.label}</div>
            <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* Auth Input Fields */}
      <div className="border border-pulse-border rounded-lg p-4 bg-pulse-panel space-y-3">
        {auth.type === 'none' && (
          <div className="text-xs text-slate-500 py-4 text-center">
            No authorization configured for this request.
          </div>
        )}

        {auth.type === 'bearer' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-400" />
              <span>Token</span>
            </label>
            <div className="relative flex items-center">
              <input
                type={showSecret ? 'text' : 'password'}
                value={auth.bearerToken || ''}
                onChange={(e) => updateActiveTab({ auth: { ...auth, bearerToken: e.target.value } })}
                placeholder="Bearer token or {{token_variable}}"
                className="w-full h-9 px-3 pr-10 rounded-md bg-[#090d16] border border-pulse-border text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2.5 text-slate-500 hover:text-slate-300"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              The token will be prefixed with &quot;Bearer &quot; and sent in the Authorization header.
            </p>
          </div>
        )}

        {auth.type === 'basic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Username</span>
              </label>
              <input
                type="text"
                value={auth.basicUser || ''}
                onChange={(e) => updateActiveTab({ auth: { ...auth, basicUser: e.target.value } })}
                placeholder="username or {{user}}"
                className="w-full h-9 px-3 rounded-md bg-[#090d16] border border-pulse-border text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Password</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={auth.basicPassword || ''}
                  onChange={(e) => updateActiveTab({ auth: { ...auth, basicPassword: e.target.value } })}
                  placeholder="password or {{password}}"
                  className="w-full h-9 px-3 pr-10 rounded-md bg-[#090d16] border border-pulse-border text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {auth.type === 'apikey' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Key Name</label>
                <input
                  type="text"
                  value={auth.apiKeyName || ''}
                  onChange={(e) => updateActiveTab({ auth: { ...auth, apiKeyName: e.target.value } })}
                  placeholder="X-API-KEY or api_key"
                  className="w-full h-9 px-3 rounded-md bg-[#090d16] border border-pulse-border text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Key Value</label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={auth.apiKeyValue || ''}
                  onChange={(e) => updateActiveTab({ auth: { ...auth, apiKeyValue: e.target.value } })}
                  placeholder="key value or {{api_key}}"
                  className="w-full h-9 px-3 rounded-md bg-[#090d16] border border-pulse-border text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">Add to:</span>
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="apiKeyAddTo"
                  checked={auth.apiKeyAddTo !== 'query'}
                  onChange={() => updateActiveTab({ auth: { ...auth, apiKeyAddTo: 'header' } })}
                  className="text-blue-600 focus:ring-0"
                />
                <span>Header</span>
              </label>
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="apiKeyAddTo"
                  checked={auth.apiKeyAddTo === 'query'}
                  onChange={() => updateActiveTab({ auth: { ...auth, apiKeyAddTo: 'query' } })}
                  className="text-blue-600 focus:ring-0"
                />
                <span>Query Parameter</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
