import { contextBridge, ipcRenderer } from 'electron';

const pulseAPI = {
  // Window controls
  minimize: () => ipcRenderer.send('pulse:window-minimize'),
  maximize: () => ipcRenderer.send('pulse:window-maximize'),
  close: () => ipcRenderer.send('pulse:window-close'),
  isMaximized: () => ipcRenderer.invoke('pulse:window-is-maximized'),

  // HTTP & GraphQL
  sendHttpRequest: (requestData: any) => ipcRenderer.invoke('pulse:http-request', requestData),
  cancelHttpRequest: (requestId: string) => ipcRenderer.invoke('pulse:http-cancel', requestId),

  // WebSocket
  wsConnect: (id: string, url: string, protocols?: string[]) => ipcRenderer.invoke('pulse:ws-connect', { id, url, protocols }),
  wsSend: (id: string, message: string) => ipcRenderer.invoke('pulse:ws-send', { id, message }),
  wsDisconnect: (id: string) => ipcRenderer.invoke('pulse:ws-disconnect', id),
  onWsEvent: (callback: (event: any) => void) => {
    const subscription = (_e: any, value: any) => callback(value);
    ipcRenderer.on('pulse:ws-event', subscription);
    return () => ipcRenderer.removeListener('pulse:ws-event', subscription);
  },

  // Local Mock Server (Unique to Pulse!)
  mockStart: (port?: number) => ipcRenderer.invoke('pulse:mock-start', port),
  mockStop: () => ipcRenderer.invoke('pulse:mock-stop'),
  mockStatus: () => ipcRenderer.invoke('pulse:mock-status'),
  mockSetRoutes: (routes: any[]) => ipcRenderer.invoke('pulse:mock-set-routes', routes),

  // Pulse Blast: Micro Load & Stress Testing (Unique to Pulse!)
  runLoadTest: (config: any) => ipcRenderer.invoke('pulse:load-test', config),

  // OpenAPI 3.0 Generation
  generateOpenApi: (collection: any) => ipcRenderer.invoke('pulse:generate-openapi', collection),

  // Storage & Secure Storage
  loadData: () => ipcRenderer.invoke('pulse:storage-load'),
  saveData: (data: any) => ipcRenderer.invoke('pulse:storage-save', data),
  encryptSecret: (plainText: string) => ipcRenderer.invoke('pulse:storage-encrypt', plainText),
  decryptSecret: (cipherText: string) => ipcRenderer.invoke('pulse:storage-decrypt', cipherText),

  // cURL & Documentation
  parseCurl: (curlString: string) => ipcRenderer.invoke('pulse:curl-parse', curlString),
  generateDocs: (collection: any, format: 'markdown' | 'html') => ipcRenderer.invoke('pulse:generate-docs', { collection, format }),
  exportToFile: (defaultFilename: string, content: string, filterName: string, extensions: string[]) => 
    ipcRenderer.invoke('pulse:file-export', { defaultFilename, content, filterName, extensions }),
  importFromFile: (extensions: string[]) => ipcRenderer.invoke('pulse:file-import', { extensions }),
};

contextBridge.exposeInMainWorld('pulseAPI', pulseAPI);

export type PulseAPI = typeof pulseAPI;