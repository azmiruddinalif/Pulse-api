export interface ParsedCurl {
  method: string;
  url: string;
  headers: Array<{ key: string; value: string; enabled: boolean }>;
  bodyType: 'none' | 'json' | 'raw' | 'x-www-form-urlencoded' | 'form-data';
  body: string;
  params: Array<{ key: string; value: string; enabled: boolean }>;
  auth?: {
    type: 'none' | 'bearer' | 'basic';
    bearerToken?: string;
    basicUser?: string;
    basicPassword?: string;
  };
}

export function parseCurlCommand(rawCmd: string): ParsedCurl {
  let cmd = rawCmd.trim();
  // Normalize multi-line cURL commands with line continuation backslashes or carats
  cmd = cmd.replace(/\\\r?\\n/g, ' ').replace(/\^\r?\\n/g, ' ').replace(/\r?\\n/g, ' ');

  // Remove leading 'curl' if present
  if (cmd.startsWith('curl ')) {
    cmd = cmd.slice(5).trim();
  }

  // Tokenize preserving quotes
  const tokens: string[] = [];
  const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([^\s]+)/g;
  let match;
  while ((match = regex.exec(cmd)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }

  let method = 'GET';
  let url = '';
  const headers: Array<{ key: string; value: string; enabled: boolean }> = [];
  let body = '';
  let bodyType: 'none' | 'json' | 'raw' | 'x-www-form-urlencoded' | 'form-data' = 'none';
  let auth: ParsedCurl['auth'] = { type: 'none' };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === '-X' || token === '--request') {
      method = (tokens[++i] || 'GET').toUpperCase();
    } else if (token === '-H' || token === '--header') {
      const headerLine = tokens[++i] || '';
      const colonIdx = headerLine.indexOf(':');
      if (colonIdx > -1) {
        const key = headerLine.slice(0, colonIdx).trim();
        const value = headerLine.slice(colonIdx + 1).trim();
        if (key.toLowerCase() === 'authorization' && value.toLowerCase().startsWith('bearer ')) {
          auth = { type: 'bearer', bearerToken: value.slice(7).trim() };
        } else {
          headers.push({ key, value, enabled: true });
        }
      }
    } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary') {
      body = tokens[++i] || '';
      if (method === 'GET') method = 'POST';
      try {
        JSON.parse(body);
        bodyType = 'json';
      } catch {
        bodyType = 'raw';
      }
    } else if (token === '-u' || token === '--user') {
      const userPass = tokens[++i] || '';
      const [u, p] = userPass.split(':');
      auth = { type: 'basic', basicUser: u || '', basicPassword: p || '' };
    } else if (!token.startsWith('-') && !url) {
      url = token.replace(/^['"]|['"]$/g, '');
    }
  }

  // Extract query params from URL if present
  const params: Array<{ key: string; value: string; enabled: boolean }> = [];
  try {
    if (url.includes('?')) {
      const parts = url.split('?');
      const searchParams = new URLSearchParams(parts[1]);
      searchParams.forEach((val, key) => {
        params.push({ key, value: val, enabled: true });
      });
      url = parts[0];
    }
  } catch {}

  // Detect json content type
  const isJsonHeader = headers.some(h => h.key.toLowerCase() === 'content-type' && h.value.includes('json'));
  if (isJsonHeader && body) {
    bodyType = 'json';
  }

  return {
    method,
    url,
    headers,
    bodyType: body ? bodyType : 'none',
    body,
    params,
    auth,
  };
}

export function generateCurlCommand(request: {
  method: string;
  url: string;
  headers?: Array<{ key: string; value: string; enabled: boolean }>;
  bodyType?: string;
  body?: string;
  auth?: { type: string; bearerToken?: string; basicUser?: string; basicPassword?: string };
}): string {
  let parts = [`curl -X ${request.method} "${request.url}"`];

  if (request.auth?.type === 'bearer' && request.auth.bearerToken) {
    parts.push(`-H "Authorization: Bearer ${request.auth.bearerToken}"`);
  } else if (request.auth?.type === 'basic' && request.auth.basicUser) {
    parts.push(`-u "${request.auth.basicUser}:${request.auth.basicPassword || ''}"`);
  }

  if (request.headers) {
    for (const h of request.headers) {
      if (h.enabled && h.key) {
        parts.push(`-H "${h.key}: ${h.value}"`);
      }
    }
  }

  if (request.body && request.bodyType !== 'none') {
    const escaped = request.body.replace(/"/g, '\\\"');
    parts.push(`-d "${escaped}"`);
  }

  return parts.join(' \\\
  ');
}
