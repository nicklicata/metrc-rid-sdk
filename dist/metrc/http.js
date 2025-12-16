"use strict";
// src/metrc/http.ts
// Shared Metrc HTTP client with Basic auth. 
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetrcHttp = exports.MetrcApiError = void 0;
class MetrcApiError extends Error {
    constructor(message, status, url, details) {
        super(message);
        this.status = status;
        this.url = url;
        this.details = details;
        this.name = "MetrcApiError";
    }
}
exports.MetrcApiError = MetrcApiError;
// Basic auth = Base64("software_api_key:user_api_key") in Authorization header. 
function buildBasicAuth(integratorApiKey, userApiKey) {
    const raw = `${integratorApiKey}:${userApiKey}`;
    // Node
    // CHANGE: avoid direct Buffer reference so this compiles without Node type defs.
    const NodeBuffer = globalThis.Buffer;
    if (NodeBuffer) {
        return `Basic ${NodeBuffer.from(raw, "utf8").toString("base64")}`;
    }
    // Browser
    if (typeof btoa !== "undefined") {
        const bytes = new TextEncoder().encode(raw);
        let bin = "";
        // @ts-ignore
        for (const b of bytes)
            bin += String.fromCharCode(b);
        return `Basic ${btoa(bin)}`;
    }
    throw new Error("No base64 encoder available to build Metrc Basic auth header.");
}
function joinUrl(baseUrl, path) {
    const b = baseUrl.replace(/\/+$/, "");
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${b}${p}`;
}
function toQuery(params) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null)
            continue;
        usp.set(k, String(v));
    }
    const s = usp.toString();
    return s ? `?${s}` : "";
}
class MetrcHttp {
    constructor(opts) {
        this.opts = opts;
        this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
        if (!this.fetchImpl)
            throw new Error("No fetch implementation found. Pass fetchImpl in MetrcHttpOptions.");
    }
    async request(args) {
        const license = args.licenseNumber ?? this.opts.defaultLicenseNumber;
        // ✅ convert unknown object shape into a query dictionary
        const query = {};
        // ✅ accept any plain object and treat its enumerable props as query params
        if (args.query && typeof args.query === "object" && !Array.isArray(args.query)) {
            for (const [k, v] of Object.entries(args.query)) {
                // allow only primitives we can safely serialize
                if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null || v === undefined) {
                    query[k] = v;
                }
                else {
                    // if you ever need arrays, we can add support later
                    throw new Error(`Invalid query param "${k}": only string/number/boolean/null/undefined are supported`);
                }
            }
        }
        if (license && query.licenseNumber === undefined)
            query.licenseNumber = license;
        const url = `${joinUrl(this.opts.baseUrl, args.path)}${toQuery(query)}`;
        const headers = {
            Authorization: buildBasicAuth(this.opts.integratorApiKey, this.opts.userApiKey),
            Accept: "application/json",
            ...(this.opts.defaultHeaders ?? {}),
            ...(args.headers ?? {}),
        };
        let body;
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
                    return await this.parse(res2, url);
                }
            }
            return await this.parse(res, url);
        }
        finally {
            if (t)
                clearTimeout(t);
        }
    }
    async parse(res, url) {
        const ct = res.headers.get("content-type") ?? "";
        const isJson = ct.includes("application/json");
        const raw = await res.text().catch(() => "");
        const data = raw && isJson ? safeJson(raw) : raw || undefined;
        if (res.ok)
            return data;
        throw new MetrcApiError(`Metrc API error ${res.status}`, res.status, url, data);
    }
}
exports.MetrcHttp = MetrcHttp;
function safeJson(s) {
    try {
        return JSON.parse(s);
    }
    catch {
        return s;
    }
}
//# sourceMappingURL=http.js.map