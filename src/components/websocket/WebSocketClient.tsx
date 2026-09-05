import React, { useState, useRef, useEffect } from 'react';
import { 
  Radio, 
  Play, 
  Square, 
  Send, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Copy, 
  Check,
  Zap
} from 'lucide-react';
import { useStore } from '../../store/useStore';

export const WebSocketClient: React.FC = () => {
  const { tabs, activeTabId, connectWs, disconnectWs, sendWsMessage, updateTabById } = useStore();
  const tab = tabs.find(t => t.id === activeTabId);

  const [messageInput, setMessageInput] = useState('{\n  "event": "ping",\n  "timestamp": 1725514000\n}');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = tab?.wsMessages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!tab) return null;

  const handleSend = () => {
    if (!messageInput.trim()) return;
    sendWsMessage(tab.id, messageInput);
  };

  const handleClear = () => {
    updateTabById(tab.id, { wsMessages: [] });
  };

  const copyPayload = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d14]">
      {/* WS Status & Controls Bar */}
      <div className="p-3 bg-pulse-panel border-b border-pulse-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-pulse-card border border-pulse-border text-xs">
            <div className={`w-2.5 h-2.5 rounded-full ${
              tab.wsConnected ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
            }`} />
            <span className={`font-medium ${tab.wsConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
              {tab.wsConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono truncate max-w-sm">
            {tab.url}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {tab.wsConnected ? (
            <button
              onClick={() => disconnectWs(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={() => connectWs(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-600/20 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Connect</span>
            </button>
          )}

          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-pulse-hover transition-colors"
            title="Clear Messages"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2.5 font-mono text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Radio className="w-8 h-8 mb-2 opacity-50 text-cyan-400" />
            <p>No messages received yet.</p>
            <p className="text-[11px] mt-1 text-slate-600">Connect to a WebSocket endpoint above to start listening.</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg border transition-all ${
                msg.direction === 'incoming'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-blue-500/5 border-blue-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 text-[10px]">
                <div className="flex items-center gap-1.5">
                  {msg.direction === 'incoming' ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      <ArrowDownLeft className="w-3 h-3" />
                      RECEIVED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      <ArrowUpRight className="w-3 h-3" />
                      SENT
                    </span>
                  )}
                  <span className="text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}.{String(msg.timestamp % 1000).padStart(3, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{msg.size} bytes</span>
                  <button
                    onClick={() => copyPayload(msg.id, msg.data)}
                    className="p-1 hover:bg-pulse-hover rounded text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy payload"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
              <pre className="text-slate-200 whitespace-pre-wrap break-all leading-relaxed">
                {msg.data}
              </pre>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer Area */}
      <div className="p-3 bg-pulse-panel border-t border-pulse-border flex gap-2">
        <textarea
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleSend();
            }
          }}
          placeholder="Type message to send over WebSocket..."
          rows={3}
          className="flex-1 p-2.5 rounded-lg bg-[#090d16] border border-pulse-border text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={!tab.wsConnected || !messageInput.trim()}
          className="px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex flex-col items-center justify-center gap-1 shadow-lg shadow-cyan-600/20 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
