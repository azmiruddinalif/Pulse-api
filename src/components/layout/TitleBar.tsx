import React, { useState } from 'react';
import { 
  Activity,
  Server,
  Zap, 
  Terminal, 
  Play, 
  Layers, 
  Minus, 
  Square, 
  X, 
  ChevronDown,
  ShieldCheck,
  Search,
  Columns2,
  Rows2,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useStore } from '../../store/useStore';

export const TitleBar: React.FC = () => {
  const { 
    environments, 
    activeEnvId, 
    setActiveEnvId, 
    setIsEnvModalOpen, 
    setIsCurlModalOpen,
    setIsCommandPaletteOpen,
    setIsRunnerModalOpen,
    setIsMockModalOpen,
    setIsLoadTestModalOpen,
    collections,
    isSidebarOpen,
    toggleSidebar,
    layoutMode,
    toggleLayoutMode
  } = useStore();

  const [isEnvDropdownOpen, setIsEnvDropdownOpen] = useState(false);
  const activeEnv = environments.find(e => e.id === activeEnvId) || environments[0];

  const handleMinimize = () => window.pulseAPI?.minimize();
  const handleMaximize = () => window.pulseAPI?.maximize();
  const handleClose = () => window.pulseAPI?.close();

  return (
    <div className="h-11 bg-[#090d16] border-b border-pulse-border flex items-center justify-between px-3 select-none app-drag z-50">
      {/* Left: Brand & Sidebar Toggle */}
      <div className="flex items-center gap-2.5 no-drag">
        {/* Toggle Sidebar Button */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-pulse-panel transition-colors"
          title={isSidebarOpen ? 'Hide Sidebar (Ctrl+B)' : 'Show Sidebar (Ctrl+B)'}
        >
          {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4 text-blue-400" />}
        </button>

        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-xs tracking-wider text-slate-100 flex items-center gap-1.5">
            PULSE
            <span className="text-[9px] uppercase tracking-wider font-semibold px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              v1.0
            </span>
          </span>
        </div>

        {/* DPAPI Hardware Encryption Badge */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>DPAPI Encrypted</span>
        </div>
      </div>

      {/* Center: Command Palette Search & Quick Actions */}
      <div className="flex items-center gap-2 no-drag">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1 text-xs text-slate-400 bg-pulse-panel hover:bg-pulse-card border border-pulse-border rounded-md shadow-inner transition-colors duration-150"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Quick Jump...</span>
          <kbd className="text-[10px] bg-[#1a2233] text-slate-300 px-1.5 py-0.5 rounded font-mono border border-pulse-border">
            Ctrl+K
          </kbd>
        </button>

        {/* Quick cURL Import */}
        <button
          onClick={() => setIsCurlModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-pulse-panel hover:bg-pulse-hover border border-pulse-border rounded-md transition-colors"
          title="Import cURL command"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Import cURL</span>
        </button>

                {/* Local Mock Server (Unique!) */}
        <button
          onClick={() => setIsMockModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-pulse-panel hover:bg-pulse-hover border border-pulse-border rounded-md transition-colors"
          title="Zero-Cloud Local Mock Server"
        >
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Mock Server</span>
        </button>

        {/* Pulse Blast (Load Test - Unique!) */}
        <button
          onClick={() => setIsLoadTestModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-pulse-panel hover:bg-pulse-hover border border-pulse-border rounded-md transition-colors"
          title="Pulse Blast Micro Load & Benchmark Tester"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span className="hidden md:inline">Blast</span>
        </button>

        {/* Runner Suite */}
        <button
          onClick={() => setIsRunnerModalOpen(true, collections[0] || null)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-pulse-panel hover:bg-pulse-hover border border-pulse-border rounded-md transition-colors"
          title="Run Collection Suite"
        >
          <Play className="w-3 h-3 text-emerald-400 fill-current" />
          <span className="hidden sm:inline">Runner</span>
        </button>
      </div>

      {/* Right: Layout Toggle, Environment Switcher & Window Controls */}
      <div className="flex items-center gap-2 no-drag">
        {/* Layout Toggle (Columns vs Rows) */}
        <button
          onClick={toggleLayoutMode}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-pulse-panel border border-pulse-border transition-colors flex items-center gap-1 text-xs"
          title={layoutMode === 'horizontal' ? 'Switch to Stacked View (Ctrl+L)' : 'Switch to Side-by-Side View (Ctrl+L)'}
        >
          {layoutMode === 'horizontal' ? (
            <Rows2 className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <Columns2 className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span className="hidden xl:inline text-[11px] text-slate-300">
            {layoutMode === 'horizontal' ? 'Side-by-Side' : 'Stacked'}
          </span>
        </button>

        {/* Environment Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsEnvDropdownOpen(!isEnvDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-200 bg-pulse-panel hover:bg-pulse-card border border-pulse-border rounded-md transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="max-w-[80px] truncate font-medium">{activeEnv?.name || 'No Env'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isEnvDropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-pulse-card border border-pulse-border rounded-md shadow-2xl py-1 z-50">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Environments
              </div>
              {environments.map(env => (
                <button
                  key={env.id}
                  onClick={() => {
                    setActiveEnvId(env.id);
                    setIsEnvDropdownOpen(false);
                  }}
                  className={'w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-pulse-hover transition-colors ' + (env.id === activeEnvId ? 'text-cyan-400 font-medium bg-cyan-500/10' : 'text-slate-300')}
                >
                  <span>{env.name}</span>
                  {env.id === activeEnvId && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </button>
              ))}
              <div className="border-t border-pulse-border my-1" />
              <button
                onClick={() => {
                  setIsEnvDropdownOpen(false);
                  setIsEnvModalOpen(true);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-blue-400 hover:bg-pulse-hover flex items-center gap-1.5"
              >
                <Layers className="w-3 h-3" />
                <span>Manage Environments</span>
              </button>
            </div>
          )}
        </div>

        {/* Frameless Window Controls */}
        <div className="flex items-center ml-1 border-l border-pulse-border/50 pl-1">
          <button
            onClick={handleMinimize}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-pulse-hover rounded transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-pulse-hover rounded transition-colors"
            title="Maximize / Restore"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 rounded transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
