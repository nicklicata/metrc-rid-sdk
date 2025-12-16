export type ValidationMode = "strict" | "mongo" | "any";
export interface EncodeOptions {
    domain?: string;
    base64?: boolean;
}
export interface ParseOptions {
    /**
     * CHANGE: Replaces ambiguous `strict?: boolean` with explicit validation modes.
     * - "strict": require known RetailID prefixes (RETAILID_PREFIXES) in the decoded ObjectId hex
     * - "mongo": allow unknown prefixes, but require ObjectId timestamp to be in a reasonable range
     * - "any": accept any 12-byte prefix (least strict)
     *
     * Back-compat: RetailIdPair(url, true) maps to validationFallback="mongo" (same spirit as your old code).
     */
    validationFallback?: Exclude<ValidationMode, "strict">;
    strictPrefixesOnly?: boolean;
}
export interface ParsedRetailId {
    batchId: ObjectId;
    index: number;
    encoding: "base36" | "base64";
    domain?: string;
    shortCode: string;
}
/**
 * Minimal MongoDB-compatible ObjectId.
 *
 * CHANGE: Safer random generation: requires crypto.getRandomValues.
 */
export declare class ObjectId {
    private readonly bytes;
    constructor(input?: string | Uint8Array);
    get id(): Uint8Array;
    toHexString(): string;
    toString(): string;
    equals(other: ObjectId | Uint8Array): boolean;
}
/**
 * CHANGE: Rewritten to avoid 32-bit bitwise ops.
 * Supports values up to Number.MAX_SAFE_INTEGER.
 */
export declare class VarInt {
    private readonly bytes;
    readonly value: number;
    static encode(value: number): Uint8Array;
    static decode(source: Uint8Array, offset?: number): {
        value: number;
        length: number;
        bytes: Uint8Array;
    };
    toHexString(): string;
    toString(): string;
    length(): number;
    data(): Uint8Array;
    constructor(source: Uint8Array | number);
}
export declare const testBase36: (s: string) => boolean;
/** Encode bytes to Base36 (uppercase). Reversible for all inputs. */
export declare function encodeBase36(bytes: Uint8Array): string;
/** Decode Base36 string to bytes (reversible counterpart to encodeBase36). */
export declare function decodeBase36(base36: string): Uint8Array;
export declare const decodeUrl64: (encoded: string) => string;
export declare const encodeUrl64: (base64: string) => string;
/**
 * CHANGE: clearer options and safer multi-try strategy.
 *
 * Strategy:
 * 1) Try STRICT mode with hinted encoding first (if any), then the other encoding.
 * 2) If strict prefixes fail, optionally fall back to mongo/any depending on options.
 */
export declare function parseRetailId(input: string, options?: ParseOptions): ParsedRetailId;
/**
 * RetailIdPair: decoded representation of a RetailID URL/shortCode.
 *
 * Back-compat behavior:
 * - constructor(url, strict=true) => fall back using "mongo" instead of "any" (similar to your prior code)
 */
export declare class RetailIdPair {
    batchId: ObjectId;
    index: number;
    readonly encoding: "base36" | "base64";
    readonly domain?: string;
    readonly shortCode: string;
    constructor(stringUrl: string, strict?: boolean);
    encode(options?: EncodeOptions): string;
}
/**
 * Create a short URL from (batchId, index).
 *
 * - Base36 format uses `HTTPS://` and uppercases the whole URL (matches your README convention).
 * - Base64 legacy uses `https://` and lowercases the scheme (matches your README convention).
 */
export declare function getShortUrl(batchId: ObjectId, index: number, options?: EncodeOptions): string;
//# sourceMappingURL=retailid-core.d.ts.map