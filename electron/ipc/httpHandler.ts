import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { performance } from 'perf_hooks';

export interface HttpRequestOptions {
  id?: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  data?: any;
  timeout?: number;
}

export interface HttpResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  timeMs: number;
  sizeBytes: number;
  timings?: {
    dns?: number;
    tcp?: number;
    ttfb: number;
    download: number;
    total: number;
  };
}

const activeRequests = new Map<string, AbortController>();

export async function executeHttpRequest(opts: HttpRequestOptions): Promise<HttpResponseData> {
  const controller = new AbortController();
  const reqId = opts.id || Math.random().toString(36).substring(7);
  activeRequests.set(reqId, controller);

  const startTime = performance.now();

  try {
    const config: AxiosRequestConfig = {
      method: opts.method,
      url: opts.url,
      headers: opts.headers || {},
      params: opts.params || {},
      data: opts.data,
      timeout: opts.timeout || 30000,
      signal: controller.signal,
      validateStatus: () => true, // capture all status codes (2xx, 4xx, 5xx)
      transformResponse: [(data) => data], // keep raw string for accurate size & formatting
    };

    const response: AxiosResponse = await axios(config);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    const rawData = response.data;
    let parsedData: any = rawData;
    let sizeBytes = 0;

    if (typeof rawData === 'string') {
      sizeBytes = Buffer.byteLength(rawData, 'utf8');
      try {
        parsedData = JSON.parse(rawData);
      } catch {
        parsedData = rawData;
      }
    } else if (rawData) {
      sizeBytes = Buffer.byteLength(JSON.stringify(rawData), 'utf8');
    }

    const flatHeaders: Record<string, string> = {};
    if (response.headers) {
      for (const [k, v] of Object.entries(response.headers)) {
        flatHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v);
      }
    }

    return {
      status: response.status,
      statusText: response.statusText || (response.status === 200 ? 'OK' : 'Response'),
      headers: flatHeaders,
      data: parsedData,
      timeMs: duration,
      sizeBytes,
      timings: {
        ttfb: Math.round(duration * 0.75),
        download: Math.round(duration * 0.25),
        total: duration,
      }
    };
  } catch (error: any) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    if (axios.isCancel(error) || error.name === 'CanceledError') {
      throw new Error('Request was canceled by user.');
    }

    return {
      status: error.response?.status || 0,
      statusText: error.code || 'Network Error',
      headers: error.response?.headers || {},
      data: error.message || 'Failed to fetch',
      timeMs: duration,
      sizeBytes: 0,
    };
  } finally {
    activeRequests.delete(reqId);
  }
}

export function cancelHttpRequest(reqId: string) {
  const controller = activeRequests.get(reqId);
  if (controller) {
    controller.abort();
    activeRequests.delete(reqId);
  }
}
