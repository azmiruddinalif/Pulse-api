import { mockServer } from './ipc/mockServer';
import { runPulseBlastLoadTest } from './ipc/loadTester';
import { generateOpenApiSpec } from './ipc/openApiGenerator';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { executeHttpRequest, cancelHttpRequest } from './ipc/httpHandler';
import { setupWebSocketHandlers } from './ipc/wsHandler';
import { parseCurlCommand } from './ipc/curlParser';
import { generateMarkdownDocs, generateHtmlDocs } from './ipc/docGenerator';
import { loadPulseData, savePulseData, encryptSecret, decryptSecret } from './ipc/storageHandler';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    frame: false, // frameless for custom developer titlebar
    backgroundColor: '#0a0d14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow?.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const wsHandler = setupWebSocketHandlers(() => mainWindow);

// IPC Handlers
ipcMain.on('pulse:window-minimize', () => mainWindow?.minimize());
ipcMain.on('pulse:window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('pulse:window-close', () => mainWindow?.close());
ipcMain.handle('pulse:window-is-maximized', () => mainWindow?.isMaximized() ?? false);

// HTTP & GraphQL
ipcMain.handle('pulse:http-request', async (_e, requestData) => {
  return await executeHttpRequest(requestData);
});
ipcMain.handle('pulse:http-cancel', (_e, id) => {
  cancelHttpRequest(id);
  return { success: true };
});

// WebSocket
ipcMain.handle('pulse:ws-connect', (_e, { id, url, protocols }) => wsHandler.connect(id, url, protocols));
ipcMain.handle('pulse:ws-send', (_e, { id, message }) => wsHandler.send(id, message));
ipcMain.handle('pulse:ws-disconnect', (_e, id) => wsHandler.disconnect(id));

// Storage
ipcMain.handle('pulse:storage-load', () => loadPulseData());
ipcMain.handle('pulse:storage-save', (_e, data) => savePulseData(data));
ipcMain.handle('pulse:storage-encrypt', (_e, text) => encryptSecret(text));
ipcMain.handle('pulse:storage-decrypt', (_e, text) => decryptSecret(text));

// cURL
ipcMain.handle('pulse:curl-parse', (_e, cmd) => parseCurlCommand(cmd));

// Documentation
ipcMain.handle('pulse:generate-docs', (_e, { collection, format }) => {
  if (format === 'html') return generateHtmlDocs(collection);
  return generateMarkdownDocs(collection);
});

// File Dialogs
ipcMain.handle('pulse:file-export', async (_e, { defaultFilename, content, filterName, extensions }) => {
  if (!mainWindow) return { canceled: true };
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultFilename,
    filters: [{ name: filterName, extensions }],
  });

  if (!canceled && filePath) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { canceled: false, filePath };
  }
  return { canceled: true };
});

ipcMain.handle('pulse:file-import', async (_e, { extensions }) => {
  if (!mainWindow) return null;
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Supported Files', extensions }],
  });

  if (!canceled && filePaths.length > 0) {
    const content = fs.readFileSync(filePaths[0], 'utf8');
    return { content, filename: path.basename(filePaths[0]) };
  }
  return null;
});


// Local Mock Server IPC
ipcMain.handle('pulse:mock-start', async (_e, port) => await mockServer.start(port));
ipcMain.handle('pulse:mock-stop', async () => await mockServer.stop());
ipcMain.handle('pulse:mock-status', () => mockServer.getStatus());
ipcMain.handle('pulse:mock-set-routes', (_e, routes) => {
  mockServer.setRoutes(routes);
  return { success: true };
});

// Pulse Blast Load Testing IPC
ipcMain.handle('pulse:load-test', async (_e, config) => {
  return await runPulseBlastLoadTest(config);
});

// OpenAPI Generation IPC
ipcMain.handle('pulse:generate-openapi', (_e, collection) => {
  return generateOpenApiSpec(collection);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
