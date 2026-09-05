import React, { useState } from 'react';
import { Sparkles, BookOpen, Layers, Play, Check, ChevronRight, ChevronDown, Code } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const GraphQLEditor: React.FC = () => {
  const { tabs, activeTabId, updateActiveTab, sendCurrentRequest } = useStore();
  const tab = tabs.find(t => t.id === activeTabId);

  const [activeSubTab, setActiveSubTab] = useState<'query' | 'variables' | 'schema'>('query');
  const [schemaTypes, setSchemaTypes] = useState<any[]>([]);
  const [isIntrospecting, setIsIntrospecting] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  if (!tab) return null;

  const handleIntrospect = async () => {
    setIsIntrospecting(true);
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          types {
            name
            kind
            description
            fields {
              name
              description
              type {
                name
                kind
              }
            }
          }
        }
      }
    `;

    try {
      let res: any;
      if (window.pulseAPI?.sendHttpRequest) {
        res = await window.pulseAPI.sendHttpRequest({
          method: 'POST',
          url: tab.url,
          headers: { 'Content-Type': 'application/json' },
          data: { query: introspectionQuery }
        });
      } else {
        const fetchRes = await fetch(tab.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: introspectionQuery })
        });
        res = { data: await fetchRes.json() };
      }

      if (res.data?.data?.__schema?.types) {
        const filtered = res.data.data.__schema.types.filter((t: any) => !t.name.startsWith('__'));
        setSchemaTypes(filtered);
        setActiveSubTab('schema');
      }
    } catch (e) {
      console.error('Introspection failed:', e);
    } finally {
      setIsIntrospecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d111a]">
      {/* GraphQL Sub-Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-pulse-panel border-b border-pulse-border">
        <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-lg border border-pulse-border">
          <button
            onClick={() => setActiveSubTab('query')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeSubTab === 'query' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Query / Mutation
          </button>
          <button
            onClick={() => setActiveSubTab('variables')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              activeSubTab === 'variables' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Variables</span>
            {tab.graphqlVariables && tab.graphqlVariables.trim() !== '{}' && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('schema')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              activeSubTab === 'schema' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Schema Explorer {schemaTypes.length > 0 && `(${schemaTypes.length})`}</span>
          </button>
        </div>

        {/* Introspection & Format Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleIntrospect}
            disabled={isIntrospecting}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-pulse-card hover:bg-pulse-hover border border-pulse-border text-xs text-pink-400 font-medium transition-colors"
          >
            {isIntrospecting ? (
              <div className="w-3 h-3 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span>{schemaTypes.length > 0 ? 'Refresh Schema' : 'Introspect Schema'}</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeSubTab === 'query' && (
          <div className="h-full flex flex-col">
            <div className="text-[11px] text-slate-500 mb-2 flex items-center justify-between">
              <span>Write GraphQL Query or Mutation below:</span>
              <span className="font-mono text-[10px] text-slate-600">POST requests only</span>
            </div>
            <textarea
              value={tab.graphqlQuery}
              onChange={(e) => updateActiveTab({ graphqlQuery: e.target.value })}
              placeholder={`query MyQuery {\n  ...\n}`}
              rows={16}
              className="w-full flex-1 p-4 rounded-lg bg-[#090d16] border border-pulse-border text-slate-200 font-mono text-xs focus:outline-none focus:border-pink-500 leading-relaxed resize-none"
              spellCheck={false}
            />
          </div>
        )}

        {activeSubTab === 'variables' && (
          <div className="h-full flex flex-col">
            <div className="text-[11px] text-slate-500 mb-2">
              Query Variables (JSON format):
            </div>
            <textarea
              value={tab.graphqlVariables}
              onChange={(e) => updateActiveTab({ graphqlVariables: e.target.value })}
              placeholder={`{\n  "limit": 10\n}`}
              rows={16}
              className="w-full flex-1 p-4 rounded-lg bg-[#090d16] border border-pulse-border text-slate-200 font-mono text-xs focus:outline-none focus:border-pink-500 leading-relaxed resize-none"
              spellCheck={false}
            />
          </div>
        )}

        {activeSubTab === 'schema' && (
          <div className="space-y-3">
            {schemaTypes.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-pulse-border rounded-lg">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Schema has not been introspected yet</p>
                <p className="text-[11px] text-slate-600 mt-1">Click the Introspect Schema button above to automatically fetch available types, queries, and mutations.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Discovered Types & Objects ({schemaTypes.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {schemaTypes.map(t => (
                    <div
                      key={t.name}
                      className="border border-pulse-border rounded-lg bg-[#090d16] p-3 text-xs"
                    >
                      <div
                        onClick={() => setExpandedType(expandedType === t.name ? null : t.name)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {expandedType === t.name ? (
                            <ChevronDown className="w-3.5 h-3.5 text-pink-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span className="font-mono font-semibold text-slate-200">{t.name}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-pulse-card text-slate-400 font-mono">
                          {t.kind}
                        </span>
                      </div>

                      {expandedType === t.name && t.fields && (
                        <div className="mt-3 pt-2 border-t border-pulse-border/60 space-y-1 pl-4 font-mono text-[11px]">
                          {t.fields.map((f: any) => (
                            <div key={f.name} className="flex items-center justify-between text-slate-400">
                              <span className="text-cyan-300">{f.name}</span>
                              <span className="text-slate-500">{f.type?.name || f.type?.kind}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
