export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type RequestType = 'rest' | 'graphql' | 'websocket';

export type BodyType = 'none' | 'json' | 'raw' | 'x-www-form-urlencoded' | 'form-data';

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface AuthConfig {
  type: AuthType;
  bearerToken?: string;
  basicUser?: string;
  basicPassword?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyAddTo?: 'header' | 'query';
}

export interface ResponseState {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  timeMs: number;
  sizeBytes: number;
  timings?: {
    ttfb: number;
    download: number;
    total: number;
  };
}

export interface WSMessage {
  id: string;
  direction: 'incoming' | 'outgoing';
  data: string;
  size: number;
  timestamp: number;
}

export interface TabItem {
  id: string;
  type: RequestType;
  title: string;
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  bodyType: BodyType;
  body: string;
  auth: AuthConfig;
  graphqlQuery: string;
  graphqlVariables: string;
  wsConnected?: boolean;
  wsMessages?: WSMessage[];
  loading?: boolean;
  response?: ResponseState | null;
  savedCollectionId?: string;
  savedFolderId?: string;
}

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvVariable[];
}

export interface SavedRequest extends TabItem {
  name: string;
  description?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  description?: string;
  requests: SavedRequest[];
  folders?: FolderItem[];
}

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  folders: FolderItem[];
  requests: SavedRequest[];
}

export interface HistoryItem {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  timeMs: number;
  timestamp: number;
  snapshot: TabItem;
}


export interface MockRoute {
  id: string;
  method: HttpMethod;
  path: string;
  statusCode: number;
  delayMs: number;
  responseBody: string;
  headers?: Record<string, string>;
  enabled: boolean;
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDurationMs: number;
  requestsPerSecond: number;
  latencies: number[];
  minMs: number;
  maxMs: number;
  avgMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  statusCodes: Record<number, number>;
}
