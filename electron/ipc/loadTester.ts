import axios from 'axios';
import { performance } from 'perf_hooks';

export interface LoadTestConfig {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  totalRequests: number;
  concurrency: number;
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

export async function runPulseBlastLoadTest(
  config: LoadTestConfig,
  onProgress?: (progress: number, completed: number) => void
): Promise<LoadTestResult> {
  const total = Math.max(1, Math.min(config.totalRequests, 500));
  const concurrency = Math.max(1, Math.min(config.concurrency, 30));
  
  const latencies: number[] = [];
  const statusCodes: Record<number, number> = {};
  let successful = 0;
  let failed = 0;
  let completed = 0;

  const startTime = performance.now();

  async function executeSingle(): Promise<void> {
    const reqStart = performance.now();
    try {
      const res = await axios({
        method: config.method,
        url: config.url,
        headers: config.headers || {},
        data: config.body,
        timeout: 15000,
        validateStatus: () => true,
      });
      const duration = Math.round(performance.now() - reqStart);
      latencies.push(duration);
      statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;
      if (res.status >= 200 && res.status < 400) {
        successful++;
      } else {
        failed++;
      }
    } catch (e: any) {
      const duration = Math.round(performance.now() - reqStart);
      latencies.push(duration);
      failed++;
      statusCodes[0] = (statusCodes[0] || 0) + 1;
    } finally {
      completed++;
      if (onProgress) {
        onProgress(Math.round((completed / total) * 100), completed);
      }
    }
  }

  const queue = Array.from({ length: total }, () => executeSingle);
  const executing: Promise<void>[] = [];

  for (const task of queue) {
    const p = task().then(() => {
      executing.splice(executing.indexOf(p), 1);
    });
    executing.push(p);
    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);

  const totalDurationMs = Math.round(performance.now() - startTime);
  latencies.sort((a, b) => a - b);

  const minMs = latencies.length ? latencies[0] : 0;
  const maxMs = latencies.length ? latencies[latencies.length - 1] : 0;
  const avgMs = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const p50Ms = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p90Ms = latencies[Math.floor(latencies.length * 0.90)] || 0;
  const p95Ms = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const rps = totalDurationMs > 0 ? Math.round((completed / (totalDurationMs / 1000)) * 10) / 10 : 0;

  return {
    totalRequests: completed,
    successfulRequests: successful,
    failedRequests: failed,
    totalDurationMs,
    requestsPerSecond: rps,
    latencies,
    minMs,
    maxMs,
    avgMs,
    p50Ms,
    p90Ms,
    p95Ms,
    statusCodes,
  };
}