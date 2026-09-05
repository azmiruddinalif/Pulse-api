import React, { useState, useEffect } from 'react';
import { Search, Globe, FileCode2, Radio, Terminal, BookOpen, Layers, Play, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const CommandPalette: React.FC = () => {
  const { 
    isCommandPaletteOpen, 
    setIsCommandPaletteOpen, 
    createTab, 
    setIsCurlModalOpen, 
    setIsEnvModalOpen, 
    setIsRunnerModalOpen,
    collections,
    setIsDocModalOpen
  } = useStore();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const actions = [
    {
      id: 'new_http',
      title: 'New HTTP Request',
      category: 'Requests',
      icon: Globe,
      run: () => createTab('rest', 'HTTP Request'),
    },
    {
      id: 'new_gql',
      title: 'New GraphQL Query',
      category: 'Requests',
      icon: FileCode2,
      run: () => createTab('graphql', 'GraphQL Query'),
    },
    {
      id: 'new_ws',
      title: 'New WebSocket Connection',
      category: 'Requests',
      icon: Radio,
      run: () => createTab('websocket', 'WebSocket Stream'),
    },
    {
      id: 'import_curl',
      title: 'Import from cURL Command',
      category: 'Tools',
      icon: Terminal,
      run: () => setIsCurlModalOpen(true),
    },
    {
      id: 'run_suite',
      title: 'Run Collection Suite',
      category: 'Testing',
      icon: Play,
      run: () => setIsRunnerModalOpen(true, collections[0] || null),
    },
    {
      id: 'gen_docs',
      title: 'Generate API Documentation',
      category: 'Documentation',
      icon: BookOpen,
      run: () => setIsDocModalOpen(true, collections[0] || null),
    },
    {
      id: 'manage_env',
      title: 'Manage Environment Variables',
      category: 'Configuration',
      icon: Layers,
      run: () => setIsEnvModalOpen(true),
    },
  ];

  const filtered = actions.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) || 
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 p-4 z-50 animate-in fade-in duration-100">
      <div className="w-full max-w-xl bg-pulse-card border border-pulse-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-3 border-b border-pulse-border flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search endpoints, or actions..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setIsCommandPaletteOpen(false);
                  item.run();
                }}
                className="w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-left text-xs text-slate-200 hover:bg-pulse-hover hover:text-white transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-pulse-panel group-hover:bg-blue-600/20 text-blue-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{item.title}</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  {item.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
