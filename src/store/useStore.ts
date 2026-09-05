import { create } from 'zustand';
import { 
  TabItem, 
  Environment, 
  CollectionItem, 
  HistoryItem, 
  RequestType, 
  HttpMethod, 
  KeyValuePair,
  WSMessage,
  SavedRequest
} from '../types';

declare global {
  interface Window {
    pulseAPI?: any;
  }
}

function createDefaultTab(type: RequestType = 'rest', title = 'New Request'): TabItem {
  const id = 'tab_' + Math.random().toString(36).substring(2, 9);
  return {
    id,
    type,
    title,
    method: 'GET',
    url: '',
    params: [
      { id: 'p_' + Math.random().toString(36).substring(2, 6), key: '', value: '', enabled: true, description: '' }
    ],
    headers: [
      { id: 'h_' + Math.random().toString(36).substring(2, 6), key: 'Accept', value: 'application/json', enabled: true }
    ],
    bodyType: 'none',
    body: '',
    auth: { type: 'none' },
    graphqlQuery: 'query GetItems {\n  items {\n    id\n    name\n  }\n}',
    graphqlVariables: '{}',
    wsConnected: false,
    wsMessages: [],
    loading: false,
    response: null,
  };
}

interface PulseStoreState {
  tabs: TabItem[];
  activeTabId: string;
  environments: Environment[];
  activeEnvId: string;
  collections: CollectionItem[];
  history: HistoryItem[];
  sidebarTab: 'collections' | 'history' | 'environments';
  searchQuery: string;

  // Layout & UI
  isSidebarOpen: boolean;
  layoutMode: 'horizontal' | 'vertical';

  // Modals
  isCurlModalOpen: boolean;
  isEnvModalOpen: boolean;
  isDocModalOpen: boolean;
  isRunnerModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  isCodeModalOpen: boolean;
  isMockModalOpen: boolean;
  isDiffModalOpen: boolean;
  isLoadTestModalOpen: boolean;
  docCollection: CollectionItem | null;
  runnerCollection: CollectionItem | null;

  // Actions - UI Layout
  toggleSidebar: () => void;
  setLayoutMode: (mode: 'horizontal' | 'vertical') => void;
  toggleLayoutMode: () => void;

  // Actions - Tabs
  createTab: (type?: RequestType, title?: string) => void;
  addRequestToCollection: (collectionId: string, folderId?: string, title?: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateActiveTab: (updates: Partial<TabItem>) => void;
  updateTabById: (id: string, updates: Partial<TabItem>) => void;
  duplicateTab: (id: string) => void;

  // Variable Interpolation
  resolveVariables: (text: string) => string;

  // Request Execution
  sendCurrentRequest: () => Promise<void>;
  cancelCurrentRequest: () => void;

  // WebSocket
  connectWs: (tabId: string) => Promise<void>;
  disconnectWs: (tabId: string) => Promise<void>;
  sendWsMessage: (tabId: string, message: string) => Promise<void>;
  addWsMessage: (tabId: string, message: WSMessage) => void;

  // Environments
  setActiveEnvId: (id: string) => void;
  addEnvironment: (name: string) => void;
  updateEnvironment: (env: Environment) => void;
  deleteEnvironment: (id: string) => void;

  // Collections
  addCollection: (name: string, description?: string) => void;
  updateCollection: (col: CollectionItem) => void;
  deleteCollection: (id: string) => void;
  saveCurrentRequestToCollection: (collectionId: string, folderId?: string, name?: string) => void;
  loadSavedRequest: (req: SavedRequest) => void;

  // Import / Export
  importCurl: (curlCmd: string) => void;
  exportCollection: (collectionId: string, format: 'pulse' | 'postman') => Promise<void>;
  importCollectionData: (data: any) => void;

  // History
  addHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  restoreHistory: (item: HistoryItem) => void;

  // UI State
  setSidebarTab: (tab: 'collections' | 'history' | 'environments') => void;
  setSearchQuery: (q: string) => void;
  setIsCurlModalOpen: (open: boolean) => void;
  setIsEnvModalOpen: (open: boolean) => void;
  setIsDocModalOpen: (open: boolean, col?: CollectionItem | null) => void;
  setIsRunnerModalOpen: (open: boolean, col?: CollectionItem | null) => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setIsCodeModalOpen: (open: boolean) => void;
  setIsMockModalOpen: (open: boolean) => void;
  setIsDiffModalOpen: (open: boolean) => void;
  setIsLoadTestModalOpen: (open: boolean) => void;
  exportCollectionOpenApi: (collectionId: string) => Promise<void>;

  // Persistence
  loadSavedState: () => Promise<void>;
  persistState: () => void;
}

const defaultTab = createDefaultTab('rest', 'Echo GET');

export const useStore = create<PulseStoreState>((set, get) => ({
  tabs: [defaultTab],
  activeTabId: defaultTab.id,
  environments: [
    {
      id: 'global',
      name: 'Global',
      variables: [
        { id: '1', key: 'base_url', value: 'https://httpbin.org', isSecret: false, enabled: true },
      ]
    },
    {
      id: 'dev',
      name: 'Development',
      variables: [
        { id: '2', key: 'base_url', value: 'https://httpbin.org', isSecret: false, enabled: true },
        { id: '3', key: 'api_token', value: 'pulse_secret_key_8899', isSecret: true, enabled: true },
      ]
    }
  ],
  activeEnvId: 'global',
  collections: [
    {
      id: 'sample-col',
      name: 'Pulse Showcase APIs',
      description: 'Pre-configured endpoints to test REST, cURL, GraphQL, and WebSocket features.',
      folders: [
        {
          id: 'f1',
          name: 'HTTPBin REST Suite',
          description: 'Basic HTTP verbs and echo tests',
          requests: [
            {
              id: 'req1',
              type: 'rest',
              name: 'GET Sample Data',
              title: 'GET Sample Data',
              method: 'GET',
              url: '{{base_url}}/get',
              params: [{ id: 'p1', key: 'framework', value: 'Pulse', enabled: true, description: 'Client framework' }],
              headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
              bodyType: 'none',
              body: '',
              auth: { type: 'none' },
              graphqlQuery: '',
              graphqlVariables: '',
            },
            {
              id: 'req2',
              type: 'rest',
              name: 'POST JSON Payload',
              title: 'POST JSON Payload',
              method: 'POST',
              url: '{{base_url}}/post',
              params: [],
              headers: [
                { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
                { id: 'h2', key: 'Authorization', value: 'Bearer {{api_token}}', enabled: true }
              ],
              bodyType: 'json',
              body: '{\n  "client": "Pulse",\n  "timestamp": 1725514000,\n  "status": "active"\n}',
              auth: { type: 'none' },
              graphqlQuery: '',
              graphqlVariables: '',
            }
          ]
        }
      ],
      requests: [
        {
          id: 'req_gql',
          type: 'graphql',
          name: 'Countries GraphQL Query',
          title: 'Countries GraphQL Query',
          method: 'POST',
          url: 'https://countries.trevorblades.com/',
          params: [],
          headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
          bodyType: 'json',
          body: '',
          auth: { type: 'none' },
          graphqlQuery: 'query GetCountry {\n  country(code: "US") {\n    name\n    native\n    capital\n    currency\n    languages {\n      code\n      name\n    }\n  }\n}',
          graphqlVariables: '{}',
        },
        {
          id: 'req_ws',
          type: 'websocket',
          name: 'Public Echo WebSocket',
          title: 'Public Echo WebSocket',
          method: 'GET',
          url: 'wss://echo.websocket.org',
          params: [],
          headers: [],
          bodyType: 'none',
          body: '',
          auth: { type: 'none' },
          graphqlQuery: '',
          graphqlVariables: '',
        }
      ]
    }
  ],
  history: [],
  sidebarTab: 'collections',
  searchQuery: '',

  // Layout default
  isSidebarOpen: true,
  layoutMode: 'horizontal',

  isCurlModalOpen: false,
  isEnvModalOpen: false,
  isDocModalOpen: false,
  isRunnerModalOpen: false,
  isCommandPaletteOpen: false,
  isCodeModalOpen: false,
  isMockModalOpen: false,
  isDiffModalOpen: false,
  isLoadTestModalOpen: false,
  docCollection: null,
  runnerCollection: null,

  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  toggleLayoutMode: () => set(state => ({
    layoutMode: state.layoutMode === 'horizontal' ? 'vertical' : 'horizontal'
  })),

  createTab: (type = 'rest', title) => {
    const defaultTitle = type === 'rest' ? 'New Request' : type === 'graphql' ? 'New GraphQL' : 'New WebSocket';
    const newTab = createDefaultTab(type, title || defaultTitle);
    if (type === 'graphql') {
      newTab.method = 'POST';
      newTab.url = 'https://countries.trevorblades.com/';
    } else if (type === 'websocket') {
      newTab.url = 'wss://echo.websocket.org';
    }
    set(state => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
    get().persistState();
  },
  addRequestToCollection: (collectionId: string, folderId?: string, title = 'New Request') => {
    const { createTab, collections, persistState } = get();
    const newReqId = 'req_' + Math.random().toString(36).substring(2, 9);
    const newSavedReq: SavedRequest = {
      id: newReqId,
      name: title,
      title: title,
      method: 'GET',
      url: '',
      params: [{ id: 'p1', key: '', value: '', enabled: true }],
      headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
      bodyType: 'none',
      body: '',
      auth: { type: 'none' },
      type: 'rest',
      graphqlQuery: '',
      graphqlVariables: '{}',
      wsConnected: false,
      wsMessages: [],
      loading: false,
      response: null
    };

    const updatedCols = collections.map(col => {
      if (col.id !== collectionId) return col;
      if (folderId) {
        return {
          ...col,
          folders: col.folders.map(f => {
            if (f.id === folderId) {
              return { ...f, requests: [...f.requests, newSavedReq] };
            }
            return f;
          })
        };
      } else {
        return { ...col, requests: [...col.requests, newSavedReq] };
      }
    });

    set(state => {
      const newTab: TabItem = {
        id: 'tab_' + Math.random().toString(36).substring(2, 9),
        type: 'rest',
        title: title,
        method: 'GET',
        url: '',
        params: [{ id: 'p1', key: '', value: '', enabled: true }],
        headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
        bodyType: 'none',
        body: '',
        auth: { type: 'none' },
        graphqlQuery: '',
        graphqlVariables: '{}',
        wsConnected: false,
        wsMessages: [],
        loading: false,
        response: null
      };
      return {
        collections: updatedCols,
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id
      };
    });
    persistState();
  },

  closeTab: (id: string) => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) {
      const freshTab = createDefaultTab();
      set({ tabs: [freshTab], activeTabId: freshTab.id });
      get().persistState();
      return;
    }

    const newTabs = tabs.filter(t => t.id !== id);
    let newActiveId = activeTabId;
    if (activeTabId === id) {
      const closingIndex = tabs.findIndex(t => t.id === id);
      const nextTab = newTabs[closingIndex] || newTabs[closingIndex - 1] || newTabs[0];
      newActiveId = nextTab.id;
    }
    set({ tabs: newTabs, activeTabId: newActiveId });
    get().persistState();
  },

  setActiveTab: (id: string) => {
    set({ activeTabId: id });
    get().persistState();
  },

  updateActiveTab: (updates: Partial<TabItem>) => {
    const { activeTabId, tabs } = get();
    set({
      tabs: tabs.map(t => t.id === activeTabId ? { ...t, ...updates } : t)
    });
    get().persistState();
  },

  updateTabById: (id: string, updates: Partial<TabItem>) => {
    const { tabs } = get();
    set({
      tabs: tabs.map(t => t.id === id ? { ...t, ...updates } : t)
    });
  },

  duplicateTab: (id: string) => {
    const { tabs } = get();
    const source = tabs.find(t => t.id === id);
    if (!source) return;

    const copy: TabItem = {
      ...JSON.parse(JSON.stringify(source)),
      id: 'tab_' + Math.random().toString(36).substring(2, 9),
      title: source.title + ' (Copy)',
      wsConnected: false,
      wsMessages: [],
      response: null,
      loading: false,
    };

    set({ tabs: [...tabs, copy], activeTabId: copy.id });
    get().persistState();
  },

  resolveVariables: (template: string) => {
    if (!template) return '';
    const { environments, activeEnvId } = get();
    const activeEnv = environments.find(e => e.id === activeEnvId);
    const globalEnv = environments.find(e => e.id === 'global');

    const varMap = new Map<string, string>();
    if (globalEnv) {
      for (const v of globalEnv.variables) {
        if (v.enabled && v.key) varMap.set(v.key, v.value);
      }
    }
    if (activeEnv && activeEnv.id !== 'global') {
      for (const v of activeEnv.variables) {
        if (v.enabled && v.key) varMap.set(v.key, v.value);
      }
    }

    return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (match, varName) => {
      if (varMap.has(varName)) {
        return varMap.get(varName)!;
      }
      return match;
    });
  },

  sendCurrentRequest: async () => {
    const { tabs, activeTabId, resolveVariables, updateActiveTab, addHistory } = get();
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;

    if (tab.type === 'websocket') {
      await get().connectWs(tab.id);
      return;
    }

    updateActiveTab({ loading: true, response: null });

    const rawUrl = resolveVariables(tab.url.trim());
    let targetUrl = rawUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const queryParams: Record<string, string> = {};
    for (const p of tab.params) {
      if (p.enabled && p.key) {
        queryParams[resolveVariables(p.key)] = resolveVariables(p.value);
      }
    }

    const requestHeaders: Record<string, string> = {};
    for (const h of tab.headers) {
      if (h.enabled && h.key) {
        requestHeaders[resolveVariables(h.key)] = resolveVariables(h.value);
      }
    }

    if (tab.auth.type === 'bearer' && tab.auth.bearerToken) {
      requestHeaders['Authorization'] = 'Bearer ' + resolveVariables(tab.auth.bearerToken);
    } else if (tab.auth.type === 'basic' && tab.auth.basicUser) {
      const creds = btoa(resolveVariables(tab.auth.basicUser) + ':' + resolveVariables(tab.auth.basicPassword || ''));
      requestHeaders['Authorization'] = 'Basic ' + creds;
    } else if (tab.auth.type === 'apikey' && tab.auth.apiKeyName && tab.auth.apiKeyValue) {
      const keyName = resolveVariables(tab.auth.apiKeyName);
      const keyVal = resolveVariables(tab.auth.apiKeyValue);
      if (tab.auth.apiKeyAddTo === 'query') {
        queryParams[keyName] = keyVal;
      } else {
        requestHeaders[keyName] = keyVal;
      }
    }

    let payload: any = undefined;
    if (tab.type === 'graphql') {
      requestHeaders['Content-Type'] = 'application/json';
      let vars: any = {};
      try {
        vars = tab.graphqlVariables ? JSON.parse(resolveVariables(tab.graphqlVariables)) : {};
      } catch {}
      payload = {
        query: resolveVariables(tab.graphqlQuery),
        variables: vars,
      };
    } else if (tab.method !== 'GET' && tab.method !== 'HEAD') {
      if (tab.bodyType === 'json' && tab.body) {
        requestHeaders['Content-Type'] = 'application/json';
        try {
          payload = JSON.parse(resolveVariables(tab.body));
        } catch {
          payload = resolveVariables(tab.body);
        }
      } else if (tab.bodyType === 'raw' || tab.bodyType === 'x-www-form-urlencoded') {
        payload = resolveVariables(tab.body);
      }
    }

    try {
      let responseData: any;
      if (window.pulseAPI?.sendHttpRequest) {
        responseData = await window.pulseAPI.sendHttpRequest({
          id: tab.id,
          method: tab.method,
          url: targetUrl,
          headers: requestHeaders,
          params: queryParams,
          data: payload,
          timeout: 30000,
        });
      } else {
        const startTime = performance.now();
        const res = await fetch(targetUrl + (Object.keys(queryParams).length ? '?' + new URLSearchParams(queryParams) : ''), {
          method: tab.method,
          headers: requestHeaders,
          body: payload ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : undefined,
        });
        const duration = Math.round(performance.now() - startTime);
        let parsed: any;
        const text = await res.text();
        try { parsed = JSON.parse(text); } catch { parsed = text; }
        responseData = {
          status: res.status,
          statusText: res.statusText || 'OK',
          headers: Object.fromEntries(res.headers.entries()),
          data: parsed,
          timeMs: duration,
          sizeBytes: text.length,
        };
      }

      updateActiveTab({
        loading: false,
        response: responseData,
      });

      addHistory({
        method: tab.method,
        url: targetUrl,
        status: responseData.status,
        timeMs: responseData.timeMs,
        snapshot: JSON.parse(JSON.stringify(tab)),
      });
    } catch (err: any) {
      updateActiveTab({
        loading: false,
        response: {
          status: 0,
          statusText: 'Error',
          headers: {},
          data: err.message || 'Network Request Failed',
          timeMs: 0,
          sizeBytes: 0,
        }
      });
    }
  },

  cancelCurrentRequest: () => {
    const { activeTabId, updateActiveTab } = get();
    if (window.pulseAPI?.cancelHttpRequest) {
      window.pulseAPI.cancelHttpRequest(activeTabId);
    }
    updateActiveTab({ loading: false });
  },

  connectWs: async (tabId: string) => {
    const { tabs, resolveVariables, updateTabById, addWsMessage } = get();
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    const url = resolveVariables(tab.url.trim());
    updateTabById(tabId, { loading: true });

    if (window.pulseAPI?.wsConnect) {
      await window.pulseAPI.wsConnect(tabId, url);
      updateTabById(tabId, { loading: false, wsConnected: true });
    } else {
      setTimeout(() => {
        updateTabById(tabId, { loading: false, wsConnected: true });
        addWsMessage(tabId, {
          id: Math.random().toString(),
          direction: 'incoming',
          data: '[Connected to ' + url + ']',
          size: url.length,
          timestamp: Date.now(),
        });
      }, 500);
    }
  },

  disconnectWs: async (tabId: string) => {
    const { updateTabById } = get();
    if (window.pulseAPI?.wsDisconnect) {
      await window.pulseAPI.wsDisconnect(tabId);
    }
    updateTabById(tabId, { wsConnected: false });
  },

  sendWsMessage: async (tabId: string, message: string) => {
    const { addWsMessage } = get();
    if (!message.trim()) return;

    if (window.pulseAPI?.wsSend) {
      await window.pulseAPI.wsSend(tabId, message);
    } else {
      addWsMessage(tabId, {
        id: Math.random().toString(),
        direction: 'outgoing',
        data: message,
        size: message.length,
        timestamp: Date.now(),
      });
      setTimeout(() => {
        addWsMessage(tabId, {
          id: Math.random().toString(),
          direction: 'incoming',
          data: 'Echo: ' + message,
          size: message.length + 6,
          timestamp: Date.now(),
        });
      }, 300);
    }
  },

  addWsMessage: (tabId: string, msg: WSMessage) => {
    const { tabs, updateTabById } = get();
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    const current = tab.wsMessages || [];
    updateTabById(tabId, { wsMessages: [...current.slice(-100), msg] });
  },

  setActiveEnvId: (id: string) => {
    set({ activeEnvId: id });
    get().persistState();
  },

  addEnvironment: (name: string) => {
    const newEnv: Environment = {
      id: 'env_' + Math.random().toString(36).substring(2, 8),
      name: name || 'New Environment',
      variables: [
        { id: '1', key: 'base_url', value: 'https://api.example.com', isSecret: false, enabled: true }
      ]
    };
    set(state => ({
      environments: [...state.environments, newEnv],
      activeEnvId: newEnv.id,
    }));
    get().persistState();
  },

  updateEnvironment: (env: Environment) => {
    set(state => ({
      environments: state.environments.map(e => e.id === env.id ? env : e)
    }));
    get().persistState();
  },

  deleteEnvironment: (id: string) => {
    if (id === 'global') return;
    set(state => ({
      environments: state.environments.filter(e => e.id !== id),
      activeEnvId: state.activeEnvId === id ? 'global' : state.activeEnvId,
    }));
    get().persistState();
  },

  addCollection: (name: string, description?: string) => {
    const newCol: CollectionItem = {
      id: 'col_' + Math.random().toString(36).substring(2, 8),
      name: name || 'New Collection',
      description: description || '',
      folders: [],
      requests: []
    };
    set(state => ({
      collections: [...state.collections, newCol]
    }));
    get().persistState();
  },

  updateCollection: (col: CollectionItem) => {
    set(state => ({
      collections: state.collections.map(c => c.id === col.id ? col : c)
    }));
    get().persistState();
  },

  deleteCollection: (id: string) => {
    set(state => ({
      collections: state.collections.filter(c => c.id !== id)
    }));
    get().persistState();
  },

  saveCurrentRequestToCollection: (collectionId: string, folderId?: string, name?: string) => {
    const { tabs, activeTabId, collections } = get();
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;

    const savedReq: SavedRequest = {
      ...JSON.parse(JSON.stringify(tab)),
      id: 'req_' + Math.random().toString(36).substring(2, 8),
      name: name || tab.title,
    };

    const newCollections = collections.map(col => {
      if (col.id !== collectionId) return col;
      if (!folderId) {
        return { ...col, requests: [...col.requests, savedReq] };
      }
      return {
        ...col,
        folders: col.folders.map(f => {
          if (f.id === folderId) {
            return { ...f, requests: [...f.requests, savedReq] };
          }
          return f;
        })
      };
    });

    set({ collections: newCollections });
    get().persistState();
  },

  loadSavedRequest: (saved: SavedRequest) => {
    const newTab: TabItem = {
      ...JSON.parse(JSON.stringify(saved)),
      id: 'tab_' + Math.random().toString(36).substring(2, 8),
      title: saved.name || saved.title,
      loading: false,
      response: null,
      wsConnected: false,
      wsMessages: [],
    };
    set(state => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    }));
    get().persistState();
  },

  importCurl: (curlCmd: string) => {
    try {
      let parsed: any;
      if (window.pulseAPI?.parseCurl) {
        parsed = window.pulseAPI.parseCurl(curlCmd);
      }
      
      if (!parsed) {
        parsed = {
          method: 'GET',
          url: 'https://httpbin.org/get',
          headers: [],
          params: [],
          bodyType: 'none',
          body: '',
          auth: { type: 'none' }
        };
        const m = curlCmd.match(/-X\s+([A-Z]+)/);
        if (m) parsed.method = m[1];
        const u = curlCmd.match(/["'](https?:\/\/[^"']+)["']/) || curlCmd.match(/https?:\/\/\S+/);
        if (u) parsed.url = u[1] || u[0];
      }

      const { tabs, activeTabId, updateActiveTab, createTab } = get();
      const currentTab = tabs.find(t => t.id === activeTabId);

      const tabData = {
        title: parsed.method + ' ' + (parsed.url.split('/').pop() || 'Request'),
        method: (parsed.method || 'GET') as HttpMethod,
        url: parsed.url,
        headers: (parsed.headers || []).map((h: any, idx: number) => ({
          id: 'h_' + idx,
          key: h.key,
          value: h.value,
          enabled: true,
        })),
        params: (parsed.params || []).map((p: any, idx: number) => ({
          id: 'p_' + idx,
          key: p.key,
          value: p.value,
          enabled: true,
        })),
        bodyType: parsed.bodyType || 'none',
        body: parsed.body || '',
        auth: parsed.auth || { type: 'none' },
      };

      if (currentTab && (!currentTab.url || currentTab.url.includes('{{base_url}}/get'))) {
        updateActiveTab(tabData);
      } else {
        createTab('rest', tabData.title);
        setTimeout(() => get().updateActiveTab(tabData), 10);
      }
      set({ isCurlModalOpen: false });
    } catch (e) {
      console.error('Error importing cURL:', e);
    }
  },

  exportCollection: async (collectionId: string, format: 'pulse' | 'postman') => {
    const { collections } = get();
    const col = collections.find(c => c.id === collectionId);
    if (!col) return;

    let exportData: any;
    let filename = col.name.toLowerCase().replace(/\s+/g, '-') + '.' + (format === 'postman' ? 'postman_collection.json' : 'pulse.json');

    if (format === 'postman') {
      exportData = {
        info: {
          name: col.name,
          description: col.description,
          schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        item: [
          ...col.requests.map(r => ({
            name: r.name,
            request: {
              method: r.method,
              header: r.headers.map(h => ({ key: h.key, value: h.value })),
              url: { raw: r.url },
              body: r.body ? { mode: 'raw', raw: r.body } : undefined,
            }
          })),
          ...col.folders.map(f => ({
            name: f.name,
            item: f.requests.map(r => ({
              name: r.name,
              request: {
                method: r.method,
                header: r.headers.map(h => ({ key: h.key, value: h.value })),
                url: { raw: r.url },
                body: r.body ? { mode: 'raw', raw: r.body } : undefined,
              }
            }))
          }))
        ]
      };
    } else {
      exportData = col;
    }

    const jsonStr = JSON.stringify(exportData, null, 2);

    if (window.pulseAPI?.exportToFile) {
      await window.pulseAPI.exportToFile(filename, jsonStr, 'JSON Files', ['json']);
    } else {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  },

  importCollectionData: (data: any) => {
    try {
      const isPostman = data.info && data.info.schema && data.info.schema.includes('postman');
      const newCol: CollectionItem = {
        id: 'col_' + Math.random().toString(36).substring(2, 8),
        name: data.info?.name || data.name || 'Imported Collection',
        description: data.info?.description || data.description || '',
        folders: [],
        requests: []
      };

      if (isPostman) {
        function parsePostmanItem(item: any): SavedRequest {
          return {
            id: 'req_' + Math.random().toString(36).substring(2, 8),
            type: 'rest',
            name: item.name || 'Request',
            title: item.name || 'Request',
            method: (item.request?.method || 'GET') as HttpMethod,
            url: typeof item.request?.url === 'string' ? item.request.url : (item.request?.url?.raw || ''),
            params: [],
            headers: (item.request?.header || []).map((h: any, i: number) => ({
              id: 'h_' + i,
              key: h.key,
              value: h.value,
              enabled: true,
            })),
            bodyType: item.request?.body?.raw ? 'json' : 'none',
            body: item.request?.body?.raw || '',
            auth: { type: 'none' },
            graphqlQuery: '',
            graphqlVariables: '',
          };
        }

        if (Array.isArray(data.item)) {
          for (const it of data.item) {
            if (it.item) {
              newCol.folders.push({
                id: 'f_' + Math.random().toString(36).substring(2, 8),
                name: it.name || 'Folder',
                requests: it.item.map(parsePostmanItem),
              });
            } else {
              newCol.requests.push(parsePostmanItem(it));
            }
          }
        }
      } else {
        newCol.folders = data.folders || [];
        newCol.requests = data.requests || [];
      }

      set(state => ({
        collections: [...state.collections, newCol]
      }));
      get().persistState();
    } catch (e) {
      console.error('Failed to import collection:', e);
    }
  },

  addHistory: (item) => {
    const historyItem: HistoryItem = {
      ...item,
      id: 'hist_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    set(state => ({
      history: [historyItem, ...state.history.slice(0, 49)]
    }));
    get().persistState();
  },

  clearHistory: () => {
    set({ history: [] });
    get().persistState();
  },

  restoreHistory: (item: HistoryItem) => {
    const { createTab, updateActiveTab } = get();
    createTab(item.snapshot.type, item.snapshot.title);
    setTimeout(() => {
      updateActiveTab(JSON.parse(JSON.stringify(item.snapshot)));
    }, 20);
  },

  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setIsCurlModalOpen: (open) => set({ isCurlModalOpen: open }),
  setIsEnvModalOpen: (open) => set({ isEnvModalOpen: open }),
  setIsDocModalOpen: (open, col = null) => set({ isDocModalOpen: open, docCollection: col }),
  setIsRunnerModalOpen: (open, col = null) => set({ isRunnerModalOpen: open, runnerCollection: col }),
  setIsCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setIsCodeModalOpen: (open) => set({ isCodeModalOpen: open }),
  setIsMockModalOpen: (open) => set({ isMockModalOpen: open }),
  setIsDiffModalOpen: (open) => set({ isDiffModalOpen: open }),
  setIsLoadTestModalOpen: (open) => set({ isLoadTestModalOpen: open }),
  exportCollectionOpenApi: async (collectionId: string) => {
    const { collections } = get();
    const col = collections.find(c => c.id === collectionId);
    if (!col) return;

    let specStr = '';
    if (window.pulseAPI?.generateOpenApi) {
      specStr = await window.pulseAPI.generateOpenApi(col);
    } else {
      specStr = JSON.stringify({ openapi: '3.0.3', info: { title: col.name, version: '1.0.0' } }, null, 2);
    }

    const filename = col.name.toLowerCase().replace(/\s+/g, '-') + '-openapi.json';
    if (window.pulseAPI?.exportToFile) {
      await window.pulseAPI.exportToFile(filename, specStr, 'OpenAPI 3.0 JSON', ['json']);
    } else {
      const blob = new Blob([specStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  },

  loadSavedState: async () => {
    try {
      let data: any = null;
      if (window.pulseAPI?.loadData) {
        data = await window.pulseAPI.loadData();
      } else {
        const local = localStorage.getItem('pulse_state');
        if (local) data = JSON.parse(local);
      }

      if (data) {
        if (data.collections?.length) set({ collections: data.collections });
        if (data.environments?.length) set({ environments: data.environments });
        if (data.activeEnvId) set({ activeEnvId: data.activeEnvId });
        if (data.history?.length) set({ history: data.history });
        if (data.tabs?.length) {
          const activeId = data.activeTabId && data.tabs.some((t: any) => t.id === data.activeTabId) 
            ? data.activeTabId 
            : data.tabs[0].id;
          set({ tabs: data.tabs, activeTabId: activeId });
        }
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  },

  persistState: () => {
    try {
      const { collections, environments, activeEnvId, history, tabs } = get();
      const sanitizedTabs = tabs.map(t => ({
        ...t,
        loading: false,
        wsConnected: false,
      }));
      const payload = {
        version: 1,
        collections,
        environments,
        activeEnvId,
        history: history.slice(0, 50),
        tabs: sanitizedTabs,
      };

      if (window.pulseAPI?.saveData) {
        window.pulseAPI.saveData(payload);
      } else {
        localStorage.setItem('pulse_state', JSON.stringify(payload));
      }
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }
}));
