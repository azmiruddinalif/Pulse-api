import { TabItem, ResponseState } from '../../types';

export interface AuditItem {
  id: string;
  category: 'speed' | 'payload' | 'caching' | 'security';
  severity: 'critical' | 'warning' | 'tip' | 'pass';
  title: string;
  message: string;
  impact: string;
  codeFix?: {
    language: string;
    code: string;
  };
  actionLabel?: string;
  actionType?: 'add_header' | 'add_cache_header' | 'run_blast' | 'convert_graphql';
}

export interface PerformanceReport {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  gradeColor: string;
  speedCategory: 'Instant' | 'Fast' | 'Moderate' | 'Slow' | 'Critical';
  summary: string;
  stats: {
    durationMs: number;
    sizeKb: number;
    status: number;
    isCompressed: boolean;
    hasCaching: boolean;
    headerCount: number;
  };
  audits: AuditItem[];
}

export function analyzeApiResponse(tab: TabItem, response: ResponseState): PerformanceReport {
  const audits: AuditItem[] = [];
  let score = 100;

  const duration = response.timeMs || 0;
  const sizeBytes = response.sizeBytes || 0;
  const sizeKb = Number((sizeBytes / 1024).toFixed(2));
  const headers = response.headers || {};
  
  // Helper to find header case-insensitively
  const getHeader = (name: string): string | undefined => {
    const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? headers[key] : undefined;
  };

  const contentEncoding = getHeader('content-encoding')?.toLowerCase();
  const cacheControl = getHeader('cache-control');
  const etag = getHeader('etag');
  const contentType = getHeader('content-type') || '';
  const isCompressed = !!contentEncoding && (contentEncoding.includes('gzip') || contentEncoding.includes('br') || contentEncoding.includes('deflate') || contentEncoding.includes('zstd'));

  // ----------------------------------------------------
  // 1. SPEED & LATENCY ANALYSIS
  // ----------------------------------------------------
  let speedCategory: PerformanceReport['speedCategory'] = 'Instant';
  if (duration > 3000) {
    speedCategory = 'Critical';
    score -= 40;
    audits.push({
      id: 'speed_critical',
      category: 'speed',
      severity: 'critical',
      title: 'Severe Latency Bottleneck (' + (duration / 1000).toFixed(1) + 's)',
      message: 'This API took over ' + (duration / 1000).toFixed(1) + ' seconds to complete. Likely causes: unindexed database queries, synchronous external HTTP calls, unoptimized ORM joins, or serverless cold starts.',
      impact: 'Severely damages user experience & causes frontend request timeouts.',
      codeFix: {
        language: 'javascript',
        code: '// 1. Database Indexing Example (MongoDB / PostgreSQL)\n// Ensure your queried fields have indexes:\n// db.orders.createIndex({ userId: 1, createdAt: -1 });\n\n// 2. Node.js Redis Caching Snippet\nconst cached = await redis.get(cacheKey);\nif (cached) return res.json(JSON.parse(cached));\nconst result = await db.query(sql);\nawait redis.set(cacheKey, JSON.stringify(result), "EX", 300);'
      },
      actionLabel: 'Stress-Test with Pulse Blast',
      actionType: 'run_blast'
    });
  } else if (duration > 1000) {
    speedCategory = 'Slow';
    score -= 25;
    audits.push({
      id: 'speed_slow',
      category: 'speed',
      severity: 'warning',
      title: 'High Server Response Time (' + duration + 'ms)',
      message: 'Response time exceeds the recommended 1000ms threshold for interactive APIs. Consider caching frequent responses or moving heavy computation to background workers.',
      impact: 'Reduces throughput under load and increases cloud hosting costs.',
      codeFix: {
        language: 'python',
        code: '# FastAPI / Python In-Memory Caching\nfrom fastapi_cache.decorator import cache\n\n@app.get("/api/data")\n@cache(expire=60)\nasync def get_data():\n    return await fetch_heavy_dataset()'
      }
    });
  } else if (duration > 400) {
    speedCategory = 'Moderate';
    score -= 10;
    audits.push({
      id: 'speed_moderate',
      category: 'speed',
      severity: 'tip',
      title: 'Moderate Latency (' + duration + 'ms)',
      message: 'Acceptable speed, but could be further optimized with edge CDN caching or connection pooling.',
      impact: 'Minor frontend latency.'
    });
  } else if (duration > 150) {
    speedCategory = 'Fast';
    audits.push({
      id: 'speed_fast',
      category: 'speed',
      severity: 'pass',
      title: 'Fast Response Time (' + duration + 'ms)',
      message: 'Server responded quickly within acceptable interactive API standards.',
      impact: 'Optimal responsiveness.'
    });
  } else {
    speedCategory = 'Instant';
    audits.push({
      id: 'speed_instant',
      category: 'speed',
      severity: 'pass',
      title: 'Blazing Fast Response (' + duration + 'ms)',
      message: 'Sub-150ms latency. Excellent server performance!',
      impact: 'Instant perceived user experience.'
    });
  }

  // ----------------------------------------------------
  // 2. PAYLOAD & COMPRESSION AUDIT
  // ----------------------------------------------------
  if (sizeKb > 5 && !isCompressed) {
    score -= 18;
    audits.push({
      id: 'payload_uncompressed',
      category: 'payload',
      severity: 'warning',
      title: 'Payload Not Compressed (' + sizeKb + ' KB raw)',
      message: 'The response payload is sent without gzip or Brotli compression. Modern compression typically reduces JSON payload sizes by 65% to 80%.',
      impact: 'Increases bandwidth consumption and mobile network load times.',
      codeFix: {
        language: 'javascript',
        code: '// Express.js: Enable automatic Brotli/Gzip compression\nconst compression = require("compression");\napp.use(compression({ threshold: 1024 }));'
      },
      actionLabel: 'Add Accept-Encoding Header',
      actionType: 'add_header'
    });
  } else if (isCompressed) {
    audits.push({
      id: 'payload_compressed_pass',
      category: 'payload',
      severity: 'pass',
      title: 'Compression Active (' + contentEncoding + ')',
      message: 'Payload is efficiently compressed using ' + contentEncoding + ', minimizing data transfer.',
      impact: 'Bandwidth optimized.'
    });
  }

  // Large payload check
  if (sizeKb > 500) {
    score -= 20;
    audits.push({
      id: 'payload_too_large',
      category: 'payload',
      severity: 'critical',
      title: 'Large Payload Size (' + sizeKb + ' KB)',
      message: 'Payload exceeds 500 KB. Sending oversized JSON payloads consumes excessive memory on mobile devices and increases DOM rendering lag.',
      impact: 'High memory usage and risk of JSON parsing blocking browser UI thread.',
      codeFix: {
        language: 'javascript',
        code: '// Implement server-side pagination with limit & offset:\nconst limit = Math.min(parseInt(req.query.limit) || 20, 100);\nconst offset = parseInt(req.query.offset) || 0;\nconst items = await db.items.find().skip(offset).limit(limit);'
      }
    });
  }

  // ----------------------------------------------------
  // 3. CACHING POLICY AUDIT
  // ----------------------------------------------------
  const isGet = tab.method === 'GET';
  if (isGet && response.status === 200) {
    if (!cacheControl && !etag) {
      score -= 15;
      audits.push({
        id: 'cache_missing',
        category: 'caching',
        severity: 'warning',
        title: 'Missing Cache Directives',
        message: 'No Cache-Control or ETag headers were detected on this GET endpoint. Clients and intermediate CDNs cannot cache this response.',
        impact: 'Every identical request hits your origin database unnecessarily.',
        codeFix: {
          language: 'javascript',
          code: '// Add Cache-Control header in Express:\nres.set("Cache-Control", "public, max-age=120, stale-while-revalidate=60");\nres.set("ETag", generateHash(data));'
        },
        actionLabel: 'Apply Cache-Control Header',
        actionType: 'add_cache_header'
      });
    } else {
      audits.push({
        id: 'cache_pass',
        category: 'caching',
        severity: 'pass',
        title: 'Caching Headers Configured',
        message: 'Cache-Control (' + (cacheControl || 'none') + ') and ETag (' + (etag ? 'present' : 'none') + ') detected.',
        impact: 'Reduces redundant origin server requests.'
      });
    }
  }

  // ----------------------------------------------------
  // 4. SECURITY & BEST PRACTICES
  // ----------------------------------------------------
  const hsts = getHeader('strict-transport-security');
  const contentTypeOptions = getHeader('x-content-type-options');
  const isHttps = (tab.url || '').startsWith('https://');

  if (isHttps && !hsts) {
    score -= 5;
    audits.push({
      id: 'sec_hsts_missing',
      category: 'security',
      severity: 'tip',
      title: 'Missing Strict-Transport-Security (HSTS)',
      message: 'HSTS instructs browsers to only connect over HTTPS, preventing SSL-stripping man-in-the-middle attacks.',
      impact: 'Vulnerability to protocol downgrade attacks.',
      codeFix: {
        language: 'javascript',
        code: '// Helmet middleware automatically adds HSTS and security headers:\nconst helmet = require("helmet");\napp.use(helmet());'
      }
    });
  }

  if (!contentTypeOptions) {
    score -= 3;
    audits.push({
      id: 'sec_nosniff_missing',
      category: 'security',
      severity: 'tip',
      title: 'Missing X-Content-Type-Options: nosniff',
      message: 'Helps prevent MIME-type sniffing vulnerabilities in browsers.',
      impact: 'Potential XSS in certain legacy browsers.'
    });
  }

  // Secret leak detection in response body
  const bodyText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data || {});
  const leakedPatterns = [
    { name: 'Private Key', regex: /-----BEGIN [A-Z]+ PRIVATE KEY-----/ },
    { name: 'Database Password', regex: /("password"|"db_pass"|"db_password")\s*:\s*"[^"]{4,}"/i },
    { name: 'AWS Secret Key', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'JWT Secret Signature', regex: /eyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}/ },
    { name: 'Internal Stack Trace', regex: /(at\s+[\w.<>]+\s+\(|Traceback \(most recent call last\))/ }
  ];

  for (const leak of leakedPatterns) {
    if (leak.regex.test(bodyText)) {
      score -= 25;
      audits.push({
        id: 'sec_leak_' + leak.name.replace(/\s+/g, '_'),
        category: 'security',
        severity: 'critical',
        title: 'Sensitive Data Leak: ' + leak.name,
        message: 'The response body contains patterns resembling ' + leak.name + '. Ensure sensitive server credentials or raw stack traces are never sent to clients.',
        impact: 'Severe security risk & credential compromise.'
      });
    }
  }

  // Calculate final clamped score & grade
  score = Math.max(10, Math.min(score, 100));
  let grade: PerformanceReport['grade'] = 'A+';
  let gradeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  if (score >= 95) {
    grade = 'A+';
    gradeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  } else if (score >= 85) {
    grade = 'A';
    gradeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  } else if (score >= 72) {
    grade = 'B';
    gradeColor = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  } else if (score >= 58) {
    grade = 'C';
    gradeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  } else if (score >= 40) {
    grade = 'D';
    gradeColor = 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  } else {
    grade = 'F';
    gradeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  }

  const criticalCount = audits.filter(a => a.severity === 'critical').length;
  const warningCount = audits.filter(a => a.severity === 'warning').length;

  let summary = 'This API is in excellent health with optimal performance metrics.';
  if (criticalCount > 0) {
    summary = 'Found ' + criticalCount + ' critical bottleneck' + (criticalCount > 1 ? 's' : '') + ' causing high latency or security risks.';
  } else if (warningCount > 0) {
    summary = 'Found ' + warningCount + ' optimization opportunity to speed up response time and reduce payload bandwidth.';
  }

  return {
    score,
    grade,
    gradeColor,
    speedCategory,
    summary,
    stats: {
      durationMs: duration,
      sizeKb,
      status: response.status,
      isCompressed,
      hasCaching: !!cacheControl || !!etag,
      headerCount: Object.keys(headers).length
    },
    audits
  };
}
