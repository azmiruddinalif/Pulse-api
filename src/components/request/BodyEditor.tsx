import React, { useState } from 'react';
import { Check, Sparkles, AlertCircle, Copy, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { BodyType } from '../../types';

export const BodyEditor: React.FC = () => {
  const { tabs, activeTabId, updateActiveTab } = useStore();
  const tab = tabs.find(t => t.id === activeTabId);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [formatSuccess, setFormatSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!tab) return null;

  const handleTypeChange = (type: BodyType) => {
    updateActiveTab({ bodyType: type });
    if (type === 'json' && (!tab.body || tab.body.trim() === '')) {
      updateActiveTab({ body: '{\n  \n}' });
    }
  };

  const handlePrettifyJson = () => {
    try {
      const parsed = JSON.parse(tab.body);
      updateActiveTab({ body: JSON.stringify(parsed, null, 2) });
      setJsonError(null);
      setFormatSuccess(true);
      setTimeout(() => setFormatSuccess(false), 2000);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tab.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    updateActiveTab({ body: '' });
    setJsonError(null);
  };

  const bodyTypes: { label: string; value: BodyType }[] = [
    { label: 'None', value: 'none' },
    { label: 'JSON', value: 'json' },
    { label: 'Form URL Encoded', value: 'x-www-form-urlencoded' },
    { label: 'Raw', value: 'raw' },
  ];

  return (
    <div className="p-3.5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-pulse-panel p-1 rounded-lg border border-pulse-border">
          {bodyTypes.map(t => (
            <button
              key={t.value}
              onClick={() => handleTypeChange(t.value)}
              className={'px-3 py-1 rounded-md text-xs font-medium transition-colors ' + (tab.bodyType === t.value ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-pulse-hover')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab.bodyType !== 'none' && (
          <div className="flex items-center gap-2">
            {tab.bodyType === 'json' && (
              <>
                {jsonError ? (
                  <span className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Invalid JSON
                  </span>
                ) : tab.body.trim() ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Valid JSON
                  </span>
                ) : null}
                <button
                  onClick={handlePrettifyJson}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-pulse-panel hover:bg-pulse-hover border border-pulse-border rounded-md transition-colors"
                  title="Format JSON with indentation"
                >
                  {formatSuccess ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Formatted!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Prettify</span>
                    </>
                  )}
                </button>
              </>
            )}

            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-pulse-panel transition-colors"
              title="Copy Body"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-pulse-panel transition-colors"
              title="Clear Body"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {tab.bodyType === 'none' ? (
        <div className="border border-dashed border-pulse-border rounded-lg p-10 text-center text-slate-500 text-xs">
          This request has no payload body. Select "JSON" or "Raw" above to compose a body.
        </div>
      ) : (
        <div className="relative border border-pulse-border rounded-lg overflow-hidden bg-[#070a10] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <textarea
            value={tab.body}
            onChange={(e) => {
              updateActiveTab({ body: e.target.value });
              if (tab.bodyType === 'json') {
                try {
                  JSON.parse(e.target.value);
                  setJsonError(null);
                } catch (err: any) {
                  setJsonError(err.message);
                }
              }
            }}
            placeholder={tab.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Write request payload here...'}
            rows={12}
            className="w-full p-3.5 bg-transparent text-slate-200 font-mono text-xs focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
};