import http from 'http';

export interface MockRoute {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  delayMs: number;
  responseBody: string;
  headers?: Record<string, string>;
  enabled: boolean;
}

class LocalMockServer {
  private server: http.Server | null = null;
  private routes: MockRoute[] = [
    {
      id: 'r1',
      method: 'GET',
      path: '/api/v1/users',
      statusCode: 200,
      delayMs: 150,
      enabled: true,
      responseBody: JSON.stringify([
        { id: 1, name: 'Alice Walker', email: 'alice@pulse.dev', role: 'admin' },
        { id: 2, name: 'Bob Vance', email: 'bob@pulse.dev', role: 'engineer' }
      ], null, 2),
      headers: { 'Content-Type': 'application/json' }
    },
    {
      id: 'r2',
      method: 'POST',
      path: '/api/v1/auth/login',
      statusCode: 200,
      delayMs: 300,
      enabled: true,
      responseBody: JSON.stringify({
        token: 'pulse_jwt_mock_token_998877',
        user: { id: 1, email: 'developer@pulse.dev' }
      }, null, 2),
      headers: { 'Content-Type': 'application/json' }
    }
  ];
  private port: number = 3500;
  private isRunning: boolean = false;

  public getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      routes: this.routes,
    };
  }

  public setRoutes(routes: MockRoute[]) {
    this.routes = routes;
  }

  public start(port = 3500): Promise<{ success: boolean; port: number; error?: string }> {
    if (this.isRunning) {
      return Promise.resolve({ success: true, port: this.port });
    }

    this.port = port;
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        // Enable CORS for testing from any frontend or Pulse
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('X-Powered-By', 'Pulse-Local-Mock-Engine');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const reqUrl = req.url?.split('?')[0] || '/';
        const route = this.routes.find(r => 
          r.enabled && 
          r.method.toUpperCase() === (req.method || 'GET').toUpperCase() && 
          (r.path === reqUrl || r.path === reqUrl + '/' || r.path + '/' === reqUrl)
        );

        if (!route) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Route not found in Pulse Local Mock Server',
            method: req.method,
            path: reqUrl,
            registeredRoutes: this.routes.map(r => r.method + ' ' + r.path)
          }, null, 2));
          return;
        }

        setTimeout(() => {
          const headers = {
            'Content-Type': 'application/json',
            ...(route.headers || {})
          };
          res.writeHead(route.statusCode || 200, headers);
          res.end(route.responseBody || '');
        }, route.delayMs || 0);
      });

      this.server.listen(this.port, () => {
        this.isRunning = true;
        resolve({ success: true, port: this.port });
      });

      this.server.on('error', (err: any) => {
        this.isRunning = false;
        resolve({ success: false, port: this.port, error: err.message });
      });
    });
  }

  public stop(): Promise<{ success: boolean }> {
    return new Promise((resolve) => {
      if (!this.server || !this.isRunning) {
        this.isRunning = false;
        resolve({ success: true });
        return;
      }

      this.server.close(() => {
        this.isRunning = false;
        this.server = null;
        resolve({ success: true });
      });
    });
  }
}

export const mockServer = new LocalMockServer();