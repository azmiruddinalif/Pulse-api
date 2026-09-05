import React, { useState } from 'react';
import { 
  Send, 
  Square, 
  Bookmark, 
  ChevronDown, 
  Check, 
  Terminal,
  Code2,
  X,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { HttpMethod } from '../../types';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

export const RequestBar: React.FC = () => {
  const { 
    tabs, 
    activeTabId, 
    updateActiveTab, 
    sendCurrentRequest, 
    cancelCurrentRequest, 
    collections,
    saveCurrentRequestToCollection,
    setIsCodeModalOpen
  } = useStore();

  const tab = tabs.find(t => t.id === activeTabId);
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  if (!tab) return null;

  const handleCopyCurl = () => {
    let curl = 'curl -X ' + tab.method + ' "' + tab.url + '"';
    if (tab.headers && tab.headers.length) {
      tab.headers.filter(h => h.enabled && h.key).forEach(h => {
        curl += ' -H "' + h.key + ': ' + h.value + '"';
      });
    }
    if (tab.body && tab.bodyType !== 'none') {
      curl += ' -d \'' + tab.body.replace(/'/g, "'\\''") + '\'';
    }
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const getMethodBadgeClass = (m: HttpMethod) => {
    switch (m) {
      case 'GET': return 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20';
      case 'POST': return 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20';
      case 'PUT': return 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20';
      case 'DELETE': return 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20';
      case 'PATCH': return 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20';
      default: return 'text-slate-300 bg-slate-500/10 hover:bg-slate-500/20';
    }
  };

  return (
    <div className="p-2.5 bg-[#0d121d] border-b border-pulse-border flex items-center gap-2 min-w-0">
      {/* Unified Input Group: Method + URL + Dynamic Badge + Clear */}
      <div className="flex-1 min-w-0 flex items-center bg-[#070a10] border border-pulse-border rounded-lg overflow-hidden focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/40 shadow-inner transition-all">
        {/* Method Selector (only for REST) */}
        {tab.type === 'rest' && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsMethodOpen(!isMethodOpen)}
              className={'h-10 px-3 border-r border-pulse-border font-mono font-bold text-xs flex items-center gap-1.5 transition-colors ' + getMethodBadgeClass(tab.method)}
            >
              <span>{tab.method}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isMethodOpen && (
              <div className="absolute left-0 mt-1 w-32 bg-pulse-card border border-pulse-border rounded-lg shadow-2xl py-1 z-50">
                {METHODS.map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      updateActiveTab({ method: m });
                      setIsMethodOpen(false);
                    }}
                    className={'w-full text-left px-3 py-1.5 text-xs font-mono font-semibold hover:bg-pulse-hover transition-colors flex items-center justify-between ' + (tab.method === m ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300')}
                  >
                    <span>{m}</span>
                    {tab.method === m && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* URL Input */}
        <input
          type="text"
          value={tab.url}
          onChange={(e) => updateActiveTab({ url: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              sendCurrentRequest();
            }
          }}
          placeholder={tab.type === 'websocket' ? 'wss://echo.websocket.org' : 'https://api.example.com/v1/resource or {{base_url}}/endpoint'}
          className="flex-1 min-w-0 h-10 px-3 bg-transparent text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none"
        />

        {/* Dynamic Variable subtle pill */}
        {tab.url.includes('{{') && (
          <div className="hidden sm:flex items-center gap-1 mr-2 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-300 flex-shrink-0" title="Dynamic Environment Variable Interpolation Active">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>env</span>
          </div>
        )}

        {/* Clear URL button */}
        {tab.url.length > 0 && (
          <button
            onClick={() => updateActiveTab({ url: '' })}
            className="mr-2 text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"
            title="Clear URL"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Primary Action Button: Send / Cancel */}
      {tab.loading ? (
        <button
          onClick={cancelCurrentRequest}
          className="h-10 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all active:scale-95 flex-shrink-0"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Cancel</span>
        </button>
      ) : (
        <button
          onClick={sendCurrentRequest}
          className="h-10 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/25 transition-all active:scale-95 flex-shrink-0"
          title="Send Request (Ctrl+Enter)"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      )}

      {/* Secondary Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Save to Collection */}
        <div className="relative">
          <button
            onClick={() => setIsSaveOpen(!isSaveOpen)}
            className="h-10 px-2.5 rounded-lg bg-pulse-panel hover:bg-pulse-card border border-pulse-border text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
            title="Save to Collection"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Save</span>
          </button>

          {isSaveOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-pulse-card border border-pulse-border rounded-lg shadow-2xl p-2 z-50">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Save to Collection
              </div>
              {collections.length === 0 ? (
                <div className="px-2 py-3 text-xs text-slate-500 text-center">
                  No collections available.
                </div>
              ) : (
                collections.map(col => (
                  <button
                    key={col.id}
                    onClick={() => {
                      saveCurrentRequestToCollection(col.id, undefined, tab.title);
                      setIsSaveOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-slate-200 hover:bg-pulse-hover rounded flex items-center gap-2"
                  >
                    <Bookmark className="w-3 h-3 text-amber-400" />
                    <span className="truncate">{col.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Generate Code Snippet */}
        <button
          onClick={() => setIsCodeModalOpen(true)}
          className="h-10 px-2.5 rounded-lg bg-pulse-panel hover:bg-pulse-card border border-pulse-border text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
          title="Generate Code Snippet (Python, JS, cURL, Go...)"
        >
          <Code2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden xl:inline">Code</span>
        </button>

        {/* Copy as cURL */}
        <button
          onClick={handleCopyCurl}
          className="h-10 px-2.5 rounded-lg bg-pulse-panel hover:bg-pulse-card border border-pulse-border text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
          title="Copy Request as cURL command"
        >
          {copiedCurl ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 hidden xl:inline">Copied!</span>
            </>
          ) : (
            <>
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">cURL</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
