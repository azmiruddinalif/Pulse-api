import WebSocket from 'ws';
import { BrowserWindow } from 'electron';

interface WSClientInstance {
  ws: WebSocket;
  url: string;
}

const wsConnections = new Map<string, WSClientInstance>();

export function setupWebSocketHandlers(getMainWindow: () => BrowserWindow | null) {
  function emitToRenderer(payload: any) {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('pulse:ws-event', payload);
    }
  }

  return {
    connect: (id: string, url: string, protocols?: string[]) => {
      try {
        if (wsConnections.has(id)) {
          wsConnections.get(id)?.ws.close();
          wsConnections.delete(id);
        }

        const ws = new WebSocket(url, protocols);
        wsConnections.set(id, { ws, url });

        emitToRenderer({ id, type: 'status', status: 'connecting', url });

        ws.on('open', () => {
          emitToRenderer({ id, type: 'status', status: 'connected', url, timestamp: Date.now() });
        });

        ws.on('message', (data, isBinary) => {
          const content = isBinary ? '<binary data>' : data.toString();
          emitToRenderer({
            id,
            type: 'message',
            direction: 'incoming',
            data: content,
            size: Buffer.isBuffer(data) ? data.length : Array.isArray(data) ? data.reduce((acc, b) => acc + b.length, 0) : (data as ArrayBuffer).byteLength,
            timestamp: Date.now(),
          });
        });

        ws.on('close', (code, reason) => {
          emitToRenderer({
            id,
            type: 'status',
            status: 'disconnected',
            code,
            reason: reason.toString(),
            timestamp: Date.now(),
          });
          wsConnections.delete(id);
        });

        ws.on('error', (err) => {
          emitToRenderer({
            id,
            type: 'error',
            error: err.message,
            timestamp: Date.now(),
          });
        });

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    send: (id: string, message: string) => {
      const instance = wsConnections.get(id);
      if (!instance || instance.ws.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket is not connected');
      }

      instance.ws.send(message);
      emitToRenderer({
        id,
        type: 'message',
        direction: 'outgoing',
        data: message,
        size: Buffer.byteLength(message, 'utf8'),
        timestamp: Date.now(),
      });
      return { success: true };
    },

    disconnect: (id: string) => {
      const instance = wsConnections.get(id);
      if (instance) {
        instance.ws.close();
        wsConnections.delete(id);
      }
      return { success: true };
    }
  };
}
