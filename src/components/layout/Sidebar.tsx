import React, { useState } from 'react';
import { 
  Folder, 
  FolderPlus, 
  FileText, 
  History, 
  Layers, 
  Plus, 
  MoreVertical, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  BookOpen, 
  Share2, 
  Trash2, 
  Search,
  Clock,
  Radio,
  FileCode2,
  Download,
  Upload
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { CollectionItem, SavedRequest, FolderItem, HttpMethod } from '../../types';

export const Sidebar: React.FC = () => {
  const { 
    sidebarTab, 
    setSidebarTab, 
    collections, 
    addCollection, 
    deleteCollection,
    loadSavedRequest,
    history, 
    restoreHistory, 
    clearHistory,
    environments,
    activeEnvId,
    setActiveEnvId,
    setIsEnvModalOpen,
    setIsDocModalOpen,
    setIsRunnerModalOpen,
    exportCollection,
    exportCollectionOpenApi,
    addRequestToCollection,
    importCollectionData
  } = useStore();

  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({
    'sample-col': true
  });
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'f1': true
  });
  const [searchFilter, setSearchFilter] = useState('');

  const toggleCollection = (id: string) => {
    setExpandedCollections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleImportFile = async () => {
    if (window.pulseAPI?.importFromFile) {
      const res = await window.pulseAPI.importFromFile(['json']);
      if (res?.content) {
        try {
          const parsed = JSON.parse(res.content);
          importCollectionData(parsed);
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const parsed = JSON.parse(evt.target?.result as string);
              importCollectionData(parsed);
            } catch (err) {
              console.error(err);
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    }
  };

  const getMethodColor = (m: HttpMethod) => {
    switch (m) {
      case 'GET': return 'text-emerald-400';
      case 'POST': return 'text-blue-400';
      case 'PUT': return 'text-amber-400';
      case 'DELETE': return 'text-rose-400';
      case 'PATCH': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="w-72 bg-[#090d16] border-r border-pulse-border flex flex-col h-full select-none">
      {/* Navigation Top Icons Rail */}
      <div className="flex items-center border-b border-pulse-border bg-pulse-panel p-1">
        <button
          onClick={() => setSidebarTab('collections')}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            sidebarTab === 'collections'
              ? 'bg-pulse-card text-blue-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Collections</span>
        </button>
        <button
          onClick={() => setSidebarTab('history')}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            sidebarTab === 'history'
              ? 'bg-pulse-card text-blue-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
        </button>
        <button
          onClick={() => setSidebarTab('environments')}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            sidebarTab === 'environments'
              ? 'bg-pulse-card text-blue-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Envs</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-2 border-b border-pulse-border">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={`Filter ${sidebarTab}...`}
            className="w-full h-8 pl-8 pr-2.5 rounded-md bg-[#101522] border border-pulse-border text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Panel 1: Collections */}
      {sidebarTab === 'collections' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Action Row */}
          <div className="p-2 flex items-center justify-between border-b border-pulse-border/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Workspaces ({collections.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleImportFile}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-pulse-hover transition-colors"
                title="Import Collection (Postman or Pulse JSON)"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              <button
                onClick={() => {
                  const name = prompt('Enter new collection name:');
                  if (name) addCollection(name);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-pulse-hover transition-colors"
                title="Create New Collection"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
              </button>
            </div>
          </div>

          {/* Collections Tree */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {collections.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No collections. Click &quot;+&quot; or import one.
              </div>
            ) : (
              collections.map(col => {
                const isExpanded = !!expandedCollections[col.id];
                return (
                  <div key={col.id} className="rounded-md overflow-hidden">
                    {/* Collection Header */}
                    <div className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-pulse-card cursor-pointer transition-colors text-xs font-medium text-slate-200">
                      <div
                        onClick={() => toggleCollection(col.id)}
                        className="flex items-center gap-1.5 flex-1 truncate"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        )}
                        <Folder className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="truncate">{col.name}</span>
                      </div>

                      {/* Collection Context Actions */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          onClick={() => setIsRunnerModalOpen(true, col)}
                          className="p-1 hover:bg-pulse-hover rounded text-emerald-400"
                          title="Run Collection"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setIsDocModalOpen(true, col)}
                          className="p-1 hover:bg-pulse-hover rounded text-cyan-400"
                          title="Generate API Docs"
                        >
                          <BookOpen className="w-3 h-3" />
                        </button>
                                                <button
                          onClick={() => exportCollectionOpenApi(col.id)}
                          className="p-1 hover:bg-pulse-hover rounded text-amber-400"
                          title="Export as OpenAPI 3.0 (Swagger)"
                        >
                          <FileCode2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => exportCollection(col.id, 'postman')}
                          className="p-1 hover:bg-pulse-hover rounded text-purple-400"
                          title="Export to Postman / Pulse JSON"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteCollection(col.id)}
                          className="p-1 hover:bg-pulse-hover rounded text-rose-400"
                          title="Delete Collection"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Collection Children (Folders & Requests) */}
                    {isExpanded && (
                      <div className="pl-4 mt-0.5 space-y-0.5 border-l border-pulse-border/40 ml-3">
                        {/* Folders */}
                        {col.folders.map(folder => {
                          const isFoldOpen = !!expandedFolders[folder.id];
                          return (
                            <div key={folder.id}>
                              <div
                                onClick={() => toggleFolder(folder.id)}
                                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-pulse-card cursor-pointer text-xs text-slate-300"
                              >
                                {isFoldOpen ? (
                                  <ChevronDown className="w-3 h-3 text-slate-500" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-slate-500" />
                                )}
                                <Folder className="w-3 h-3 text-amber-400" />
                                <span className="truncate">{folder.name}</span>
                              </div>

                              {isFoldOpen && (
                                <div className="pl-4 space-y-0.5 border-l border-pulse-border/40 ml-2">
                                  {folder.requests.map(req => (
                                    <div
                                      key={req.id}
                                      onClick={() => loadSavedRequest(req)}
                                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-pulse-card cursor-pointer text-xs group"
                                    >
                                      <span className={`font-mono text-[9px] font-bold ${getMethodColor(req.method)}`}>
                                        {req.method}
                                      </span>
                                      <span className="text-slate-300 truncate">{req.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Top-level requests in collection */}
                        {col.requests.map(req => (
                          <div
                            key={req.id}
                            onClick={() => loadSavedRequest(req)}
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-pulse-card cursor-pointer text-xs group"
                          >
                            {req.type === 'graphql' ? (
                              <span className="font-mono text-[9px] font-bold text-pink-400">GQL</span>
                            ) : req.type === 'websocket' ? (
                              <span className="font-mono text-[9px] font-bold text-cyan-400">WS</span>
                            ) : (
                              <span className={`font-mono text-[9px] font-bold ${getMethodColor(req.method)}`}>
                                {req.method}
                              </span>
                            )}
                            <span className="text-slate-300 truncate">{req.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Panel 2: History */}
      {sidebarTab === 'history' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 flex items-center justify-between border-b border-pulse-border/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Recent Requests ({history.length})
            </span>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-[11px] text-rose-400 hover:text-rose-300"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {history.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <Clock className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
                <span>No requests sent yet</span>
              </div>
            ) : (
              history
                .filter(h => h.url.toLowerCase().includes(searchFilter.toLowerCase()))
                .map(item => (
                  <div
                    key={item.id}
                    onClick={() => restoreHistory(item)}
                    className="p-2 rounded-lg bg-[#111624] hover:bg-pulse-card border border-pulse-border cursor-pointer transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-[10px] font-bold ${getMethodColor(item.method)}`}>
                          {item.method}
                        </span>
                        <span className={`text-[10px] px-1 rounded font-mono ${
                          item.status >= 200 && item.status < 300 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.timeMs}ms
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300 truncate">
                      {item.url}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Panel 3: Environments Quick Summary */}
      {sidebarTab === 'environments' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Active Environment</span>
            <button
              onClick={() => setIsEnvModalOpen(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Configure
            </button>
          </div>

          <div className="space-y-2">
            {environments.map(env => (
              <div
                key={env.id}
                onClick={() => setActiveEnvId(env.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                  env.id === activeEnvId
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                    : 'bg-pulse-panel border-pulse-border text-slate-300 hover:bg-pulse-card'
                }`}
              >
                <div className="flex items-center justify-between font-medium mb-1">
                  <span>{env.name}</span>
                  {env.id === activeEnvId && <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-1 rounded">Active</span>}
                </div>
                <div className="text-[11px] text-slate-500">
                  {env.variables.length} variable{env.variables.length === 1 ? '' : 's'} defined
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
