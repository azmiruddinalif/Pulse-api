import React, { useState } from 'react';
import { Code2, X, Copy, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const CodeSnippetModal: React.FC = () => {
  const { isCodeModalOpen, setIsCodeModalOpen, tabs, activeTabId, resolveVariables } = useStore();
  const tab = tabs.find(t => t.id === activeTabId);

  const [language, setLanguage] = useState<'curl' | 'js-fetch' | 'js-axios' | 'python' | 'go'>('curl');
  const [copied, setCopied] = useState(false);

  if (!isCodeModalOpen || !tab) return null;

  const resolvedUrl = resolveVariables(tab.url);
  const activeHeaders = (tab.headers || []).filter(h => h.enabled && h.key);
  const resolvedBody = tab.body && tab.bodyType !== 'none' ? resolveVariables(tab.body) : '';

  const generateSnippet = () => {
    switch (language) {
      case 'curl': {
        let curl = 'curl -X ' + tab.method + ' "' + resolvedUrl + '"';
        activeHeaders.forEach(h => {
          curl += ' \\\n  -H "' + resolveVariables(h.key) + ': ' + resolveVariables(h.value) + '"';
        });
        if (resolvedBody) {
          curl += ' \\\n  -d \'' + resolvedBody.replace(/'/g, "'\\''") + '\'';
        }
        return curl;
      }

      case 'js-fetch': {
        const headersObj: Record<string, string> = {};
        activeHeaders.forEach(h => {
          headersObj[resolveVariables(h.key)] = resolveVariables(h.value);
        });
        const opts: any = {
          method: tab.method,
          headers: headersObj,
        };
        if (resolvedBody && tab.method !== 'GET' && tab.method !== 'HEAD') {
          opts.body = tab.bodyType === 'json' ? JSON.parse(resolvedBody || '{}') : resolvedBody;
        }

        return 'const response = await fetch("' + resolvedUrl + '", ' + JSON.stringify(opts, null, 2) + ');\nconst data = await response.json();\nconsole.log(data);';
      }

      case 'js-axios': {
        const headersObj: Record<string, string> = {};
        activeHeaders.forEach(h => {
          headersObj[resolveVariables(h.key)] = resolveVariables(h.value);
        });

        let code = 'import axios from "axios";\n\n';
        code += 'const response = await axios({\n';
        code += '  method: "' + tab.method.toLowerCase() + '",\n';
        code += '  url: "' + resolvedUrl + '",\n';
        if (Object.keys(headersObj).length) {
          code += '  headers: ' + JSON.stringify(headersObj, null, 4).replace(/\n/g, '\n  ') + ',\n';
        }
        if (resolvedBody && tab.method !== 'GET') {
          code += '  data: ' + (tab.bodyType === 'json' ? resolvedBody : JSON.stringify(resolvedBody)) + ',\n';
        }
        code += '});\nconsole.log(response.data);';
        return code;
      }

      case 'python': {
        let py = 'import requests\n\nurl = "' + resolvedUrl + '"\n';
        if (activeHeaders.length) {
          const hMap: Record<string, string> = {};
          activeHeaders.forEach(h => {
            hMap[resolveVariables(h.key)] = resolveVariables(h.value);
          });
          py += 'headers = ' + JSON.stringify(hMap, null, 4) + '\n';
        } else {
          py += 'headers = {}\n';
        }

        if (resolvedBody && tab.method !== 'GET') {
          py += 'payload = ' + (tab.bodyType === 'json' ? resolvedBody : JSON.stringify(resolvedBody)) + '\n';
          py += 'response = requests.' + tab.method.toLowerCase() + '(url, headers=headers, json=payload)\n';
        } else {
          py += 'response = requests.' + tab.method.toLowerCase() + '(url, headers=headers)\n';
        }
        py += 'print(response.json())';
        return py;
      }

      case 'go': {
        return 'package main\n\nimport (\n\t"fmt"\n\t"net/http"\n\t"io"\n)\n\nfunc main() {\n\treq, _ := http.NewRequest("' + tab.method + '", "' + resolvedUrl + '", nil)\n\tres, err := http.DefaultClient.Do(req)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer res.Body.Close()\n\tbody, _ := io.ReadAll(res.Body)\n\tfmt.Println(string(body))\n}';
      }

      default:
        return '';
    }
  };

  const snippet = generateSnippet();

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages: { id: typeof language; label: string }[] = [
    { id: 'curl', label: 'cURL' },
    { id: 'js-fetch', label: 'JS Fetch' },
    { id: 'js-axios', label: 'JS Axios' },
    { id: 'python', label: 'Python Requests' },
    { id: 'go', label: 'Go (net/http)' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
      <div className="w-full max-w-2xl bg-pulse-card border border-pulse-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-pulse-border flex items-center justify-between bg-[#111624]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Generate Client Code</h3>
              <p className="text-[11px] text-slate-400">Copy ready-to-run code for your application</p>
            </div>
          </div>
          <button
            onClick={() => setIsCodeModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-pulse-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="px-5 py-2.5 bg-[#090d16] border-b border-pulse-border flex items-center justify-between">
          <div className="flex items-center gap-1">
            {languages.map(l => (
              <button
                key={l.id}
                onClick={() => setLanguage(l.id)}
                className={'px-3 py-1 rounded-md text-xs font-medium transition-colors ' + (language === l.id ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-pulse-panel')}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-pulse-panel hover:bg-pulse-hover border border-pulse-border text-xs text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-5 bg-[#06080e] max-h-96 overflow-y-auto">
          <pre className="text-xs font-mono text-slate-200 whitespace-pre leading-relaxed">
            {snippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
