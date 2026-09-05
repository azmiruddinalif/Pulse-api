import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Globe, Radio, FileCode2, Copy, ChevronDown, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { HttpMethod } from '../../types';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab, createTab, duplicateTab, updateTabById } = useStore();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active tab
  useEffect(() => {
    const activeEl = tabsContainerRef.current?.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeTabId, tabs.length]);

  // Close add menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    if (isAddMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAddMenuOpen]);

  const getMethodBadgeClass = (method: HttpMethod) => {
    switch (method) {
      case 'GET': return 'text-emerald-400';
      case 'POST': return 'text-blue-400';
      case 'PUT': return 'text-amber-400';
      case 'DELETE': return 'text-rose-400';
      case 'PATCH': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  const startRename = (tabId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTabId(tabId);
    setEditingTitle(currentTitle);
  };

  const saveRename = (tabId: string) => {
    if (editingTitle.trim()) {
      updateTabById(tabId, { title: editingTitle.trim() });
    }
    setEditingTabId(null);
  };

  return (
    <div className="h-10 bg-[#0d121d] border-b border-pulse-border flex items-center px-2 select-none min-w-0 relative z-30">
      {/* Scrollable & Auto-Resizing Tabs Strip */}
      <div 
        ref={tabsContainerRef}
        onWheel={(e) => {
          if (tabsContainerRef.current) {
            tabsContainerRef.current.scrollLeft += e.deltaY;
          }
        }}
        className="flex-1 flex items-center gap-1.5 overflow-x-auto min-w-0 py-1 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId;
          const isEditing = editingTabId === tab.id;

          return (
            <div
              key={tab.id}
              data-active={isActive ? 'true' : 'false'}
              onClick={() => setActiveTab(tab.id)}
              onDoubleClick={(e) => startRename(tab.id, tab.title, e)}
              onAuxClick={(e) => {
                // Middle click closes tab
                if (e.button === 1 && tabs.length > 1) {
                  e.preventDefault();
                  closeTab(tab.id);
                }
              }}
              className={'group flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all border shrink-0 min-w-[120px] max-w-[220px] ' + (
                isActive 
                  ? 'bg-pulse-card border-pulse-border text-slate-100 shadow-sm ring-1 ring-blue-500/20' 
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-pulse-panel hover:text-slate-200'
              )}
              title={tab.title + ' (Double-click to rename, middle-click to close)'}
            >
              {/* Protocol / Method Badge */}
              {tab.type === 'rest' && (
                <span className={'font-bold font-mono text-[10px] flex-shrink-0 ' + getMethodBadgeClass(tab.method)}>
                  {tab.method}
                </span>
              )}
              {tab.type === 'graphql' && (
                <span className="font-bold font-mono text-[10px] text-pink-400 flex items-center gap-0.5 flex-shrink-0">
                  <FileCode2 className="w-3 h-3" />
                  GQL
                </span>
              )}
              {tab.type === 'websocket' && (
                <span className="font-bold font-mono text-[10px] text-cyan-400 flex items-center gap-0.5 flex-shrink-0">
                  <Radio className="w-3 h-3" />
                  WS
                </span>
              )}

              {/* Title / Inline Rename Input */}
              {isEditing ? (
                <input
                  type="text"
                  value={editingTitle}
                  autoFocus
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => saveRename(tab.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveRename(tab.id);
                    if (e.key === 'Escape') setEditingTabId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-[#0a0d14] border border-blue-500 rounded px-1.5 py-0.5 text-xs text-slate-100 outline-none font-mono"
                />
              ) : (
                <span className="truncate text-slate-200 flex-1 font-mono text-xs">
                  {tab.title || 'Untitled Request'}
                </span>
              )}

              {/* Loading Spinner */}
              {tab.loading && (
                <div className="w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}

              {/* Hover Actions: Duplicate & Close */}
              <div className={'flex items-center gap-0.5 transition-opacity flex-shrink-0 ' + (isActive ? 'opacity-70 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateTab(tab.id);
                  }}
                  className="p-0.5 hover:bg-pulse-hover rounded text-slate-400 hover:text-slate-200 transition-colors"
                  title="Duplicate Tab"
                >
                  <Copy className="w-2.5 h-2.5" />
                </button>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="p-0.5 hover:bg-rose-500/20 hover:text-rose-400 rounded text-slate-400 transition-colors"
                    title="Close Tab (Ctrl+W)"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* The Instant + Button (Placed directly next to tabs like Chrome / Postman) */}
        <div ref={addMenuRef} className="flex items-center flex-shrink-0 relative">
          <button
            onClick={() => createTab('rest', 'New Request')}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-blue-400 bg-pulse-panel/80 hover:bg-blue-600/20 border border-pulse-border hover:border-blue-500/40 transition-all active:scale-90 shadow-sm"
            title="New HTTP Request (Ctrl+T)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Quick Dropdown for GraphQL / WebSocket */}
          <button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="h-7 w-4 flex items-center justify-center rounded-r text-slate-400 hover:text-slate-200 hover:bg-pulse-card transition-colors -ml-1 border-y border-r border-pulse-border"
            title="Choose Protocol (HTTP, GraphQL, WebSocket)"
          >
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {isAddMenuOpen && (
            <div className="absolute left-0 top-8 w-48 bg-pulse-card border border-pulse-border rounded-lg shadow-2xl p-1 z-50 animate-in fade-in duration-100">
              <button
                onClick={() => {
                  createTab('rest', 'New Request');
                  setIsAddMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-pulse-hover rounded flex items-center gap-2 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>HTTP Request</span>
              </button>
              <button
                onClick={() => {
                  createTab('graphql', 'GraphQL Query');
                  setIsAddMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-pulse-hover rounded flex items-center gap-2 transition-colors"
              >
                <FileCode2 className="w-3.5 h-3.5 text-pink-400" />
                <span>GraphQL Query</span>
              </button>
              <button
                onClick={() => {
                  createTab('websocket', 'WebSocket Stream');
                  setIsAddMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-pulse-hover rounded flex items-center gap-2 transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>WebSocket Stream</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
