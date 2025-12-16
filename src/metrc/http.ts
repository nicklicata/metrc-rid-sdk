// src/metrc/http.ts
// Shared Metrc HTTP client with Basic auth. 

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface MetrcHttpOptions {
  baseUrl: string; // e.g. https://api-ca.metrc.com
  integratorApiKey: string;
  userApiKey: string;
  defaultLicenseNumber?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
}

export class MetrcApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "MetrcApiError";
  }
}

// Basic auth = Base64("software_api_key:user_api_key") in Authorization header. 
function buildBasicAuth(integratorApiKey: string, userApiKey: string): string {
  const raw = `${integratorApiKey}:${userApiKey}`;

  // Node
  // CHANGE: avoid direct Buffer reference so this compiles without Node type defs.
  const NodeBuffer = (globalThis as any).Buffer as undefined | { from: (s: string, enc: string) => { toString: (enc2: string) => string } };
  if (NodeBuffer) {
    return `Basic ${NodeBuffer.from(raw, "utf8").toString("base64")}`;
  }

  // Browser
  if (typeof btoa !== "undefined") {
    const bytes = new TextEncoder().encode(raw);
    let bin = "";
    // @ts-ignore
    for (const b of bytes) bin += String.fromCharCode(b);
    return `Basic ${btoa(bin)}`;
  }

  throw new Error("No base64 encoder available to build Metrc Basic auth header.");
}

function joinUrl(baseUrl: string, path: string): string {
  const b = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

type QueryValue = string | number | boolean | null | undefined;
type QueryDict = Record<string, QueryValue>;

function toQuery(params: QueryDict): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export class MetrcHttp {
  private readonly opts: MetrcHttpOptions;
  private readonly fetchImpl: FetchLike;

  constructor(opts: MetrcHttpOptions) {
    this.opts = opts;
    this.fetchImpl = opts.fetchImpl ?? (globalThis.fetch as FetchLike);
    if (!this.fetchImpl) throw new Error("No fetch implementation found. Pass fetchImpl in MetrcHttpOptions.");
  }

  async request<T>(args: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    licenseNumber?: string;
    query?: unknown; // ✅ accept typed objects like Paging
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<T> {
    const license = args.licenseNumber ?? this.opts.defaultLicenseNumber;

    // ✅ convert unknown object shape into a query dictionary
    const query: QueryDict = {};

    // ✅ accept any plain object and treat its enumerable props as query params
    if (args.query && typeof args.query === "object" && !Array.isArray(args.query)) {
      for (const [k, v] of Object.entries(args.query as Record<string, unknown>)) {
        // allow only primitives we can safely serialize
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null || v === undefined) {
          query[k] = v;
        } else {
          // if you ever need arrays, we can add support later
          throw new Error(`Invalid query param "${k}": only string/number/boolean/null/undefined are supported`);
        }
      }
    }

    if (license && query.licenseNumber === undefined) query.licenseNumber = license;

    const url = `${joinUrl(this.opts.baseUrl, args.path)}${toQuery(query)}`;

    const headers: Record<string, string> = {
      Authorization: buildBasicAuth(this.opts.integratorApiKey, this.opts.userApiKey),
      Accept: "application/json",
      ...(this.opts.defaultHeaders ?? {}),
      ...(args.headers ?? {}),
    };

    let body: string | undefined;
    if (args.body !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      body = JSON.stringify(args.body);
    }

    const ac = new AbortController();
    const t = this.opts.timeoutMs ? setTimeout(() => ac.abort(new Error("timeout")), this.opts.timeoutMs) : null;

    try {
      const res = await this.fetchImpl(url, { method: args.method, headers, body, signal: ac.signal });

      // If Metrc rate limits you, you often see 429; honor Retry-After when present.
      if (res.status === 429) {
        const ra = res.headers.get("Retry-After");
        const seconds = ra ? Number(ra) : NaN;
        if (Number.isFinite(seconds) && seconds > 0) {
          await new Promise((r) => setTimeout(r, seconds * 1000));
          const res2 = await this.fetchImpl(url, { method: args.method, headers, body, signal: ac.signal });
          return await this.parse<T>(res2, url);
        }
      }

      return await this.parse<T>(res, url);
    } finally {
      if (t) clearTimeout(t);
    }
  }

  private async parse<T>(res: Response, url: string): Promise<T> {
    const ct = res.headers.get("content-type") ?? "";
    const isJson = ct.includes("application/json");

    const raw = await res.text().catch(() => "");
    const data = raw && isJson ? safeJson(raw) : raw || undefined;

    if (res.ok) return data as T;

    throw new MetrcApiError(`Metrc API error ${res.status}`, res.status, url, data);
  }
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}