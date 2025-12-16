/* retailid.ts
 *
 * Full replacement implementation for RetailID encode/decode primitives.
 *
 * CHANGE: Replaced BigInt-based base36 conversion with a reversible base-N algorithm.
 *         This prevents loss of leading zero bytes during decodeBase36().
 * CHANGE: Rewrote VarInt to avoid 32-bit bitwise ops and support up to Number.MAX_SAFE_INTEGER safely.
 * CHANGE: Hardened URL/shortCode parsing (querystrings, fragments, trailing slashes, whitespace).
 * CHANGE: Improved encoding auto-detection (scheme casing + characters + safe fallback tries).
 * CHANGE: Improved Node/browser compatibility for base64 + crypto.
 * CHANGE: Added richer types and clearer validation modes while keeping backward compatibility.
 */

export type ValidationMode = "strict" | "mongo" | "any";

export interface EncodeOptions {
  domain?: string;
  base64?: boolean; // legacy URL-safe base64
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
  validationFallback?: Exclude<ValidationMode, "strict">; // "mongo" | "any"
  strictPrefixesOnly?: boolean; // if true, never fall back beyond strict
}

export interface ParsedRetailId {
  batchId: ObjectId;
  index: number;
  encoding: "base36" | "base64";
  domain?: string;
  shortCode: string;
}

/** Known RetailID prefixes (hex string starts-with) */
const RETAILID_PREFIXES = ["1a4", "abc"] as const;

/** Valid ObjectId timestamp range: 2012-01-01 to 2052-01-01 (Unix seconds) */
const MIN_OBJECTID_TIMESTAMP = Math.floor(new Date("2012-01-01T00:00:00Z").getTime() / 1000);
const MAX_OBJECTID_TIMESTAMP = Math.floor(new Date("2052-01-01T00:00:00Z").getTime() / 1000);

/* ------------------------------------------------------------------------------------------------
 * ObjectId
 * ------------------------------------------------------------------------------------------------ */

/**
 * Minimal MongoDB-compatible ObjectId.
 *
 * CHANGE: Safer random generation: requires crypto.getRandomValues.
 */
export class ObjectId {
  private readonly bytes: Uint8Array;

  constructor(input?: string | Uint8Array) {
    if (input === undefined) {
      const cryptoObj = getCrypto();
      const b = new Uint8Array(12);
      cryptoObj.getRandomValues(b);
      this.bytes = b;
      return;
    }

    if (typeof input === "string") {
      if (input.length !== 24 || !/^[0-9a-fA-F]+$/.test(input)) {
        throw new Error(`Invalid ObjectId hex string: ${input}`);
      }
      this.bytes = hexToBytes(input);
      return;
    }

    if (input instanceof Uint8Array) {
      if (input.length !== 12) {
        throw new Error(`Invalid ObjectId bytes length: ${input.length}`);
      }
      // CHANGE: defensive copy so callers can't mutate internal state.
      this.bytes = input.slice();
      return;
    }

    throw new Error("ObjectId must be a 24-char hex string or 12-byte Uint8Array");
  }

  get id(): Uint8Array {
    // CHANGE: return a copy to preserve immutability.
    return this.bytes.slice();
  }

  toHexString(): string {
    return bytesToHex(this.bytes);
  }

  toString(): string {
    return this.toHexString();
  }

  equals(other: ObjectId | Uint8Array): boolean {
    const otherBytes = other instanceof ObjectId ? other.bytes : other;
    if (this.bytes.length !== otherBytes.length) return false;
    for (let i = 0; i < this.bytes.length; i++) {
      if (this.bytes[i] !== otherBytes[i]) return false;
    }
    return true;
  }
}

/* ------------------------------------------------------------------------------------------------
 * Hex utils
 * ------------------------------------------------------------------------------------------------ */

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/* ------------------------------------------------------------------------------------------------
 * VarInt (LEB128 unsigned)
 * ------------------------------------------------------------------------------------------------ */

/**
 * CHANGE: Rewritten to avoid 32-bit bitwise ops.
 * Supports values up to Number.MAX_SAFE_INTEGER.
 */
export class VarInt {
  private readonly bytes: Uint8Array;
  readonly value: number;

  static encode(value: number): Uint8Array {
    assertSafeUint(value, "VarInt.encode(value)");
    const out: number[] = [];
    let n = value;

    // LEB128
    while (n >= 0x80) {
      const low7 = n % 0x80; // CHANGE: modulo instead of bitwise AND
      out.push(low7 | 0x80);
      n = Math.floor(n / 0x80);
    }
    out.push(n);

    return new Uint8Array(out);
  }

  static decode(source: Uint8Array, offset = 0): { value: number; length: number; bytes: Uint8Array } {
    let value = 0;
    let multiplier = 1;
    let length = 0;

    while (true) {
      if (offset + length >= source.length) {
        throw new Error("VarInt.decode: buffer underflow");
      }
      const byte = source[offset + length];
      const slice = byte & 0x7f;

      // CHANGE: safe arithmetic accumulation
      value += slice * multiplier;
      if (!Number.isSafeInteger(value)) {
        throw new RangeError("VarInt.decode: value exceeds Number.MAX_SAFE_INTEGER");
      }

      length++;
      if ((byte & 0x80) === 0) break;

      multiplier *= 0x80;
      if (!Number.isSafeInteger(multiplier)) {
        throw new RangeError("VarInt.decode: multiplier overflow");
      }
    }

    return { value, length, bytes: source.slice(offset, offset + length) };
  }

  toHexString(): string {
    return bytesToHex(this.bytes);
  }

  toString(): string {
    // CHANGE: Match README intent better: return decimal string, not "0x...".
    return String(this.value);
  }

  length(): number {
    return this.bytes.length;
  }

  data(): Uint8Array {
    // CHANGE: return a copy (immutability)
    return this.bytes.slice();
  }

  constructor(source: Uint8Array | number) {
    if (typeof source === "number") {
      this.value = source;
      this.bytes = VarInt.encode(this.value);
      return;
    }

    const decoded = VarInt.decode(source);
    this.value = decoded.value;
    this.bytes = decoded.bytes;
  }
}

function assertSafeUint(n: number, label: string): void {
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    throw new TypeError(`${label}: expected a non-negative integer, got ${n}`);
  }
  if (n > Number.MAX_SAFE_INTEGER) {
    throw new RangeError(`${label}: exceeds Number.MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER})`);
  }
}

/* ------------------------------------------------------------------------------------------------
 * Base36 (reversible) utils
 * ------------------------------------------------------------------------------------------------ */

/**
 * CHANGE: Replaced BigInt conversions with a reversible base conversion (base256 <-> base36),
 *         preserving leading zero bytes by encoding them as leading '0' characters.
 *
 * Alphabet is 0-9 + A-Z (36 chars), output uppercase.
 */
const BASE36_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE36_MAP: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (let i = 0; i < BASE36_ALPHABET.length; i++) {
    const ch = BASE36_ALPHABET[i];
    m[ch] = i;
    m[ch.toLowerCase()] = i; // accept lowercase input
  }
  return m;
})();

export const testBase36 = (s: string): boolean => /^[A-Za-z0-9]+$/.test(s);

/** Encode bytes to Base36 (uppercase). Reversible for all inputs. */
export function encodeBase36(bytes: Uint8Array): string {
  if (bytes.length === 0) throw new Error("encodeBase36: empty input");

  // Count leading zero bytes (preserved as leading '0' chars)
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;

  // If all zeros, encode as that many '0' characters (fully reversible)
  if (zeros === bytes.length) return "0".repeat(bytes.length);

  // Base conversion: base256 -> base36
  const digits: number[] = [0];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 256;
      digits[j] = carry % 36;
      carry = Math.floor(carry / 36);
    }
    while (carry > 0) {
      digits.push(carry % 36);
      carry = Math.floor(carry / 36);
    }
  }

  // digits are little-endian base36; build string
  let out = "0".repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) {
    out += BASE36_ALPHABET[digits[i]];
  }
  return out;
}

/** Decode Base36 string to bytes (reversible counterpart to encodeBase36). */
export function decodeBase36(base36: string): Uint8Array {
  if (!base36 || typeof base36 !== "string") {
    throw new TypeError("decodeBase36: expected a non-empty string");
  }
  if (!testBase36(base36)) {
    throw new Error(`decodeBase36: invalid base36 string: "${base36}"`);
  }

  // Count leading '0' characters -> leading zero bytes
  let zeros = 0;
  while (zeros < base36.length && base36[zeros] === "0") zeros++;

  // If string is all '0', decode to that many zero bytes (fully reversible)
  if (zeros === base36.length) return new Uint8Array(zeros);

  // Base conversion: base36 -> base256
  const bytes: number[] = [0];
  for (let i = zeros; i < base36.length; i++) {
    const val = BASE36_MAP[base36[i]];
    if (val === undefined) {
      throw new Error(`decodeBase36: invalid char "${base36[i]}"`);
    }

    let carry = val;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 36;
      bytes[j] = carry % 256;
      carry = Math.floor(carry / 256);
    }
    while (carry > 0) {
      bytes.push(carry % 256);
      carry = Math.floor(carry / 256);
    }
  }

  // bytes are little-endian base256
  const decoded = new Uint8Array(zeros + bytes.length);
  // leading zeros already zero-filled
  for (let i = 0; i < bytes.length; i++) {
    decoded[zeros + i] = bytes[bytes.length - 1 - i];
  }
  return decoded;
}

/* ------------------------------------------------------------------------------------------------
 * URL-safe base64 helpers
 * ------------------------------------------------------------------------------------------------ */

export const decodeUrl64 = (encoded: string): string => {
  // URL-safe -> standard base64
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  while (encoded.length % 4) encoded += "=";
  return encoded;
};

export const encodeUrl64 = (base64: string): string => {
  // standard base64 -> URL-safe (no padding)
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};

function base64ToBytes(base64: string): Uint8Array {
  // CHANGE: Node/browser compatible
  if (typeof atob === "function") {
    let binary: string;
    try {
      binary = atob(base64);
    } catch {
      throw new Error(`Invalid base64 encoding: "${base64}"`);
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  // Node.js
  const B = (globalThis as any).Buffer;
  if (typeof B?.from === "function") {
    return new Uint8Array(B.from(base64, "base64"));
  }

  throw new Error("base64ToBytes: no base64 decoder available in this runtime");
}

function bytesToBase64(bytes: Uint8Array): string {
  // CHANGE: Node/browser compatible
  if (typeof btoa === "function") {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  // Node.js
  const B = (globalThis as any).Buffer;
  if (typeof B?.from === "function") {
    return B.from(bytes).toString("base64");
  }

  throw new Error("bytesToBase64: no base64 encoder available in this runtime");
}

/* ------------------------------------------------------------------------------------------------
 * RetailIdPair + encode/decode
 * ------------------------------------------------------------------------------------------------ */

interface ParsedId {
  batchId: ObjectId;
  index: number;
}

/** CHANGE: Safer timestamp parse (no signed 32-bit effects). */
const isValidObjectIdTimestamp = (bytes: Uint8Array): boolean => {
  if (bytes.length < 4) return false;
  const timestamp =
    bytes[0] * 16777216 + // 2^24
    bytes[1] * 65536 + // 2^16
    bytes[2] * 256 +
    bytes[3];
  return timestamp >= MIN_OBJECTID_TIMESTAMP && timestamp <= MAX_OBJECTID_TIMESTAMP;
};

const getBatchIdAndIndex = (buffer: Uint8Array, mode: ValidationMode): ParsedId => {
  if (buffer.length < 13) {
    throw new Error(`Buffer too short: expected at least 13 bytes, got ${buffer.length}`);
  }

  const idBytes = buffer.subarray(0, 12);
  const hexId = bytesToHex(idBytes);

  const hasKnownPrefix = RETAILID_PREFIXES.some((prefix) => hexId.startsWith(prefix));

  if (!hasKnownPrefix) {
    if (mode === "strict") {
      throw new Error(`Unknown RetailID prefix: ${hexId}`);
    }
    if (mode === "mongo") {
      if (!isValidObjectIdTimestamp(idBytes)) {
        throw new Error(`Invalid mongo timestamp in ObjectId: ${hexId}`);
      }
    }
    // mode === "any" => accept
  }

  const batchId = new ObjectId(hexId);

  const indexBuf = buffer.subarray(12);
  const decoded = VarInt.decode(indexBuf, 0);

  return { batchId, index: decoded.value };
};

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

/**
 * CHANGE: robust shortCode extraction:
 * - preserves original scheme casing for hinting (since URL() lowercases scheme)
 * - strips query and fragment
 */
function extractShortCode(raw: string): { shortCode: string; domain?: string; schemeHint?: "base36" | "base64" } {
  const input = String(raw ?? "").trim();
  if (!input) throw new Error("Empty RetailID input");

  // Detect scheme casing from raw string (README convention)
  const schemeMatch = input.match(/^([a-zA-Z]+):\/\//);
  const scheme = schemeMatch?.[1];

  // If it "looks like" a URL, parse manually to preserve casing behavior.
  if (schemeMatch) {
    // CHANGE: schemeMatch implies a captured scheme; make it non-optional for TS narrowing.
    const scheme = schemeMatch[1];
    const afterSlashes = input.slice(schemeMatch[0].length);
    const noHash = afterSlashes.split("#")[0];
    const noQuery = noHash.split("?")[0];

    const parts = noQuery.split("/").filter(Boolean);
    if (parts.length < 2) {
      throw new Error(`No path segment found in URL: ${input}`);
    }

    const domain = parts[0];
    const shortCode = parts[parts.length - 1];

    const schemeHint =
      scheme === scheme.toUpperCase() ? "base36" : scheme === scheme.toLowerCase() ? "base64" : undefined;

    return { shortCode, domain, schemeHint };
  }

  // Not a URL => treat as raw shortCode
  return { shortCode: input, domain: undefined, schemeHint: undefined };
}

function detectEncodingHint(rawShortCode: string, schemeHint?: "base36" | "base64"): "base36" | "base64" | "unknown" {
  // README convention: HTTPS:// (uppercase) => base36, https:// (lowercase) => base64
  if (schemeHint) return schemeHint;

  // URL-safe base64 often includes '-' or '_' (base36 never does)
  if (rawShortCode.includes("-") || rawShortCode.includes("_")) return "base64";

  // Otherwise ambiguous
  return "unknown";
}

function tryParseWithEncoding(
  shortCode: string,
  encoding: "base36" | "base64",
  mode: ValidationMode
): ParsedId | null {
  try {
    const buf =
      encoding === "base36"
        ? decodeBase36(shortCode)
        : base64ToBytes(decodeUrl64(shortCode));
    return getBatchIdAndIndex(buf, mode);
  } catch {
    return null;
  }
}

/**
 * CHANGE: clearer options and safer multi-try strategy.
 *
 * Strategy:
 * 1) Try STRICT mode with hinted encoding first (if any), then the other encoding.
 * 2) If strict prefixes fail, optionally fall back to mongo/any depending on options.
 */
export function parseRetailId(input: string, options?: ParseOptions): ParsedRetailId {
  const { shortCode, domain, schemeHint } = extractShortCode(input);
  const hint = detectEncodingHint(shortCode, schemeHint);

  const strictPrefixesOnly = options?.strictPrefixesOnly ?? false;
  const fallback = options?.validationFallback ?? "any";

  // Always try strict first
  const strictOrder: ("base36" | "base64")[] =
    hint === "base36" ? ["base36", "base64"] :
      hint === "base64" ? ["base64", "base36"] :
        ["base36", "base64"];

  for (const enc of strictOrder) {
    const parsed = tryParseWithEncoding(shortCode, enc, "strict");
    if (parsed) {
      return { ...parsed, encoding: enc, domain, shortCode };
    }
  }

  if (strictPrefixesOnly) {
    throw new Error(`Unrecognized RetailID (strict prefixes only): ${input}`);
  }

  // Fall back (mongo/any)
  for (const enc of strictOrder) {
    const parsed = tryParseWithEncoding(shortCode, enc, fallback);
    if (parsed) {
      return { ...parsed, encoding: enc, domain, shortCode };
    }
  }

  throw new Error(`Unrecognized RetailID: ${input}`);
}

/**
 * RetailIdPair: decoded representation of a RetailID URL/shortCode.
 *
 * Back-compat behavior:
 * - constructor(url, strict=true) => fall back using "mongo" instead of "any" (similar to your prior code)
 */
export class RetailIdPair {
  batchId: ObjectId;
  index: number;
  readonly encoding: "base36" | "base64";
  readonly domain?: string;
  readonly shortCode: string;

  constructor(stringUrl: string, strict?: boolean) {
    // CHANGE: preserve previous semantics: strict=true => fallback=mongo, else fallback=any
    const parsed = parseRetailId(stringUrl, {
      validationFallback: strict ? "mongo" : "any",
      strictPrefixesOnly: false,
    });

    this.batchId = parsed.batchId;
    this.index = parsed.index;
    this.encoding = parsed.encoding;
    this.domain = parsed.domain;
    this.shortCode = parsed.shortCode;
  }

  encode(options?: EncodeOptions): string {
    return getShortUrl(this.batchId, this.index, options);
  }
}

function getBuffer(batchId: ObjectId, index: number): Uint8Array {
  // CHANGE: validate index early with the same rules VarInt uses.
  assertSafeUint(index, "getBuffer(index)");

  const varintBuf = VarInt.encode(index);
  const batchBuf = batchId.id; // already a copy
  return concatBytes(batchBuf, varintBuf);
}

/**
 * Create a short URL from (batchId, index).
 *
 * - Base36 format uses `HTTPS://` and uppercases the whole URL (matches your README convention).
 * - Base64 legacy uses `https://` and lowercases the scheme (matches your README convention).
 */
export function getShortUrl(batchId: ObjectId, index: number, options?: EncodeOptions): string {
  const domain = options?.domain || "1a4.com";

  if (options?.base64) {
    const base64 = bytesToBase64(getBuffer(batchId, index));
    const dataPart = encodeUrl64(base64);
    // CHANGE: legacy is lowercase https:// by convention
    return `https://${domain}/${dataPart}`;
  }

  const dataPart = encodeBase36(getBuffer(batchId, index));
  // CHANGE: preserve your "HTTPS://" uppercase convention
  return `HTTPS://${domain}/${dataPart}`.toUpperCase();
}

/* ------------------------------------------------------------------------------------------------
 * Runtime helpers
 * ------------------------------------------------------------------------------------------------ */

function getCrypto(): Crypto {
  const c = (globalThis as any).crypto as Crypto | undefined;
  if (c?.getRandomValues) return c;
  throw new Error(
    "WebCrypto crypto.getRandomValues is required for ObjectId() generation in this runtime."
  );
}
