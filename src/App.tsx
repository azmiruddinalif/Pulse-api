import React, { useEffect, useState, useRef } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { TabBar } from './components/layout/TabBar';
import { RequestBar } from './components/request/RequestBar';
import { ParamsEditor } from './components/request/ParamsEditor';
import { HeadersEditor } from './components/request/HeadersEditor';
import { BodyEditor } from './components/request/BodyEditor';
import { AuthEditor } from './components/request/AuthEditor';
import { CurlModal } from './components/request/CurlModal';
import { CodeSnippetModal } from './components/request/CodeSnippetModal';
import { GraphQLEditor } from './components/graphql/GraphQLEditor';
import { WebSocketClient } from './components/websocket/WebSocketClient';
import { ResponseViewer } from './components/response/ResponseViewer';
import { CommandPalette } from './components/layout/CommandPalette';
import { CollectionRunner } from './components/collections/CollectionRunner';
import { DocPreviewModal } from './components/collections/DocPreviewModal';
import { EnvironmentModal } from './components/environments/EnvironmentModal';
import { MockServerModal } from './components/tools/MockServerModal';
import { ResponseDiffModal } from './components/tools/ResponseDiffModal';
import { LoadTestModal } from './components/tools/LoadTestModal';
import { useStore } from './store/useStore';

export const App: React.FC = () => {
  const { 
    tabs, 
    activeTabId, 
    loadSavedState, 
    isSidebarOpen, 
    toggleSidebar, 
    layoutMode, 
    toggleLayoutMode, 
    sendCurrentRequest, 
    createTab, 
    closeTab 
  } = useStore();

  const tab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const [activeReqSubTab, setActiveReqSubTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');

  // Resizable Panel States (with localStorage persistence)

  const [splitPercent, setSplitPercent] = useState(() => {
    const saved = localStorage.getItem('pulse_split_percent');
    return saved ? Math.max(20, Math.min(Number(saved), 80)) : 50;
  });

  const [verticalSplitPercent, setVerticalSplitPercent] = useState(() => {
    const saved = localStorage.getItem('pulse_vertical_split_percent');
    return saved ? Math.max(20, Math.min(Number(saved), 80)) : 50;
  });

  const [isDragging, setIsDragging] = useState<'pane' | 'vertical' | null>(null);
  const isResizingPane = useRef(false);
  const isResizingVerticalPane = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

    // 1. Load saved state ONLY ONCE on mount
  useEffect(() => {
    loadSavedState();
  }, []);

  // 2. Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        sendCurrentRequest();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        toggleLayoutMode();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        createTab('rest', 'New Request');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w' && tabs.length > 1) {
        e.preventDefault();
        closeTab(activeTabId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabs.length]);

  // 3. Resizable panels mouse listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingPane.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offset = e.clientX - rect.left;
        const pct = Math.max(20, Math.min((offset / rect.width) * 100, 80));
        setSplitPercent(pct);
        localStorage.setItem('pulse_split_percent', String(pct));
      }
      if (isResizingVerticalPane.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offset = e.clientY - rect.top;
        const pct = Math.max(20, Math.min((offset / rect.height) * 100, 80));
        setVerticalSplitPercent(pct);
        localStorage.setItem('pulse_vertical_split_percent', String(pct));
      }
    };

    const handleMouseUp = () => {
      isResizingPane.current = false;
      isResizingVerticalPane.current = false;
      setIsDragging(null);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 4. WebSocket global incoming event listener
  useEffect(() => {
    if (window.pulseAPI?.onWsEvent) {
      const unsub = window.pulseAPI.onWsEvent((event: any) => {
        if (event.type === 'message') {
          useStore.getState().addWsMessage(event.id, {
            id: Math.random().toString(),
            direction: event.direction,
            data: event.data,
            size: event.size,
            timestamp: event.timestamp || Date.now(),
          });
        }
      });
      return () => unsub();
    }
  }, []);

  const startPaneResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingPane.current = true;
    setIsDragging('pane');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const startVerticalPaneResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingVerticalPane.current = true;
    setIsDragging('vertical');
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0d14] text-slate-200 font-sans relative">
      {/* Invisible overlay while dragging to guarantee smooth 60fps movement without iframe/editor event drops */}
      {isDragging && (
        <div 
          className={'fixed inset-0 z-[9999] select-none ' + (isDragging === 'vertical' ? 'cursor-row-resize' : 'cursor-col-resize')}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Static Fixed Sidebar (w-64, no resize needed) */}
        {isSidebarOpen && (
          <div className="w-64 flex-shrink-0 h-full border-r border-pulse-border overflow-hidden bg-[#0a0d14]">
            <Sidebar />
          </div>
        )}

        {/* Center Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TabBar />

          {tab && (
            <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden min-w-0">
              {tab.type === 'websocket' ? (
                <div className="flex-1 overflow-hidden">
                  <WebSocketClient />
                </div>
              ) : tab.type === 'graphql' ? (
                <div className={'flex-1 overflow-hidden ' + (layoutMode === 'horizontal' ? 'flex flex-row' : 'flex flex-col')}>
                  <div 
                    className="flex flex-col overflow-hidden"
                    style={layoutMode === 'horizontal' ? { width: splitPercent + '%' } : { height: verticalSplitPercent + '%' }}
                  >
                    <RequestBar />
                    <div className="flex-1 overflow-hidden">
                      <GraphQLEditor />
                    </div>
                  </div>

                  {/* Resizable Divider for GraphQL */}
                  {layoutMode === 'horizontal' ? (
                    <div
                      onMouseDown={startPaneResize}
                      onDoubleClick={() => setSplitPercent(50)}
                      className="w-2 cursor-col-resize hover:bg-blue-500 bg-pulse-border/70 hover:ring-2 hover:ring-blue-500/30 transition-all z-20 flex-shrink-0 flex items-center justify-center group select-none"
                      title="Drag to resize panels (Double-click to reset 50/50)"
                    >
                      <div className="w-1 h-8 bg-slate-500 group-hover:bg-white rounded-full transition-colors flex flex-col items-center justify-center gap-0.5">
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                      </div>
                    </div>
                  ) : (
                    <div
                      onMouseDown={startVerticalPaneResize}
                      onDoubleClick={() => setVerticalSplitPercent(50)}
                      className="h-2 cursor-row-resize hover:bg-blue-500 bg-pulse-border/70 hover:ring-2 hover:ring-blue-500/30 transition-all z-20 flex-shrink-0 flex items-center justify-center group select-none"
                      title="Drag to resize panels (Double-click to reset 50/50)"
                    >
                      <div className="h-1 w-8 bg-slate-500 group-hover:bg-white rounded-full transition-colors flex items-center justify-center gap-0.5">
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                      </div>
                    </div>
                  )}

                  <div 
                    className="overflow-hidden"
                    style={layoutMode === 'horizontal' ? { width: (100 - splitPercent) + '%' } : { height: (100 - verticalSplitPercent) + '%' }}
                  >
                    <ResponseViewer />
                  </div>
                </div>
              ) : (
                /* REST API Workspace with Draggable Resizers */
                <div className={'flex-1 overflow-hidden min-w-0 ' + (layoutMode === 'horizontal' ? 'flex flex-row' : 'flex flex-col')}>
                  {/* Request Builder */}
                  <div 
                    className="flex flex-col overflow-hidden bg-[#0d121d] min-w-0"
                    style={layoutMode === 'horizontal' ? { width: splitPercent + '%' } : { height: verticalSplitPercent + '%' }}
                  >
                    <RequestBar />

                    {/* Sub-tabs: Params, Headers, Body, Auth */}
                    <div className="px-3.5 py-1.5 bg-[#090d16] border-b border-pulse-border flex items-center gap-1 text-xs flex-shrink-0">
                      <button
                        onClick={() => setActiveReqSubTab('params')}
                        className={'px-3 py-1 rounded font-medium transition-colors ' + (activeReqSubTab === 'params' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200')}
                      >
                        Params {tab.params.filter(p => p.enabled && p.key).length > 0 && '(' + tab.params.filter(p => p.enabled && p.key).length + ')'}
                      </button>
                      <button
                        onClick={() => setActiveReqSubTab('headers')}
                        className={'px-3 py-1 rounded font-medium transition-colors ' + (activeReqSubTab === 'headers' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200')}
                      >
                        Headers {tab.headers.filter(h => h.enabled && h.key).length > 0 && '(' + tab.headers.filter(h => h.enabled && h.key).length + ')'}
                      </button>
                      <button
                        onClick={() => setActiveReqSubTab('body')}
                        className={'px-3 py-1 rounded font-medium transition-colors ' + (activeReqSubTab === 'body' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200')}
                      >
                        Body {tab.bodyType !== 'none' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block ml-1" />}
                      </button>
                      <button
                        onClick={() => setActiveReqSubTab('auth')}
                        className={'px-3 py-1 rounded font-medium transition-colors ' + (activeReqSubTab === 'auth' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200')}
                      >
                        Auth {tab.auth.type !== 'none' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block ml-1" />}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {activeReqSubTab === 'params' && <ParamsEditor />}
                      {activeReqSubTab === 'headers' && <HeadersEditor />}
                      {activeReqSubTab === 'body' && <BodyEditor />}
                      {activeReqSubTab === 'auth' && <AuthEditor />}
                    </div>
                  </div>

                  {/* Interactive Draggable Divider between Request & Response */}
                  {layoutMode === 'horizontal' ? (
                    <div
                      onMouseDown={startPaneResize}
                      onDoubleClick={() => setSplitPercent(50)}
                      className="w-2 cursor-col-resize hover:bg-blue-500 bg-pulse-border/70 hover:ring-2 hover:ring-blue-500/30 transition-all z-20 flex-shrink-0 flex items-center justify-center group select-none"
                      title="Drag to resize panels (Double-click to reset 50/50)"
                    >
                      <div className="w-1 h-8 bg-slate-500 group-hover:bg-white rounded-full transition-colors flex flex-col items-center justify-center gap-0.5">
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                      </div>
                    </div>
                  ) : (
                    <div
                      onMouseDown={startVerticalPaneResize}
                      onDoubleClick={() => setVerticalSplitPercent(50)}
                      className="h-2 cursor-row-resize hover:bg-blue-500 bg-pulse-border/70 hover:ring-2 hover:ring-blue-500/30 transition-all z-20 flex-shrink-0 flex items-center justify-center group select-none"
                      title="Drag to resize panels (Double-click to reset 50/50)"
                    >
                      <div className="h-1 w-8 bg-slate-500 group-hover:bg-white rounded-full transition-colors flex items-center justify-center gap-0.5">
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                      </div>
                    </div>
                  )}

                  {/* Response Inspector */}
                  <div 
                    className="overflow-hidden min-w-0"
                    style={layoutMode === 'horizontal' ? { width: (100 - splitPercent) + '%' } : { height: (100 - verticalSplitPercent) + '%' }}
                  >
                    <ResponseViewer />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CurlModal />
      <CodeSnippetModal />
      <CommandPalette />
      <CollectionRunner />
      <DocPreviewModal />
      <EnvironmentModal />
      <MockServerModal />
      <ResponseDiffModal />
      <LoadTestModal />
    </div>
  );
};
