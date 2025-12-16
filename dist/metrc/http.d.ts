export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export interface MetrcHttpOptions {
    baseUrl: string;
    integratorApiKey: string;
    userApiKey: string;
    defaultLicenseNumber?: string;
    fetchImpl?: FetchLike;
    timeoutMs?: number;
    defaultHeaders?: Record<string, string>;
}
export declare class MetrcApiError extends Error {
    readonly status: number;
    readonly url: string;
    readonly details?: unknown | undefined;
    constructor(message: string, status: number, url: string, details?: unknown | undefined);
}
export declare class MetrcHttp {
    private readonly opts;
    private readonly fetchImpl;
    constructor(opts: MetrcHttpOptions);
    request<T>(args: {
        method: "GET" | "POST" | "PUT" | "DELETE";
        path: string;
        licenseNumber?: string;
        query?: unknown;
        body?: unknown;
        headers?: Record<string, string>;
    }): Promise<T>;
    private parse;
}
//# sourceMappingURL=http.d.ts.map