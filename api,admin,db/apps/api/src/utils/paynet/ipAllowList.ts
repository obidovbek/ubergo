/**
 * Source-IP allow-list for the Paynet web service — T-088.
 *
 * 🔴 THIS IS A CONTRACTUAL OBLIGATION, NOT A POLICY CHOICE. docs/PAYNET.md §2:
 * the provider MUST refuse other IPs and MUST NOT accept payments that arrive in
 * violation of it. Paynet's ranges are `213.230.106.112/28` and `213.230.65.80/28`.
 *
 * 🔴 IT IS ALSO THE MAIN MITIGATION FOR AN INFORMATION LEAK. `GetInformation`
 * returns a payer's name to whoever asks, and T-092 made `users.id` enumerable
 * from a known origin (1 100 001, 1 100 002 …). Without this list working
 * correctly, the endpoint is a name-lookup oracle over a guessable id space.
 *
 * Pure and DB-free so `npm test` can execute it — the matching logic is exactly
 * the kind of thing that is written once, believed, and wrong at the edges.
 */

/** Paynet's documented ranges. Overridable by env for staging, never narrowed silently. */
const DEFAULT_RANGES = ['213.230.106.112/28', '213.230.65.80/28'] as const;

export interface Cidr {
  /** Network address as a 32-bit unsigned number. */
  network: number;
  /** Prefix length, 0-32. */
  bits: number;
  /** The original text, for logging. */
  source: string;
}

export class CidrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CidrError';
  }
}

/**
 * Parse dotted-quad IPv4 into a 32-bit unsigned number.
 *
 * Returns `null` rather than throwing: callers are usually testing an address
 * that arrived from the network, where "unparseable" is a normal answer meaning
 * "not on the list", not an exceptional one.
 *
 * ⚠️ Strict on purpose. `parseInt` would accept `"213.230.106.112abc"` and
 * leading zeros (`"010"` → 10 here, but 8 in some other parsers), so octets must
 * be plain decimal digits with no padding — `01` is refused rather than guessed.
 */
export function parseIpv4(value: string): number | null {
  const trimmed = value.trim();

  // An IPv4-mapped IPv6 address is how Node reports a v4 peer on a dual-stack
  // socket (`::ffff:213.230.106.112`). Very easy to miss, and it would make
  // every real Paynet request fail closed on some deployments.
  const mapped = /^::ffff:(.+)$/i.exec(trimmed);
  const text = mapped ? (mapped[1] as string) : trimmed;

  const parts = text.split('.');
  if (parts.length !== 4) return null;

  let result = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    // Reject leading zeros: "0" is fine, "00" and "010" are ambiguous.
    if (part.length > 1 && part.startsWith('0')) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    result = result * 256 + octet;
  }
  return result >>> 0;
}

/** Parse `a.b.c.d/bits`. Throws — a malformed allow-list is a configuration bug. */
export function parseCidr(value: string): Cidr {
  const trimmed = value.trim();
  const [addressText, bitsText, ...rest] = trimmed.split('/');

  if (rest.length > 0 || addressText === undefined) {
    throw new CidrError(`malformed CIDR: "${value}"`);
  }

  const address = parseIpv4(addressText);
  if (address === null) {
    throw new CidrError(`malformed address in CIDR: "${value}"`);
  }

  // A bare address is a single host, which is /32.
  const bits = bitsText === undefined ? 32 : Number(bitsText);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32 || !/^\d+$/.test(bitsText ?? '32')) {
    throw new CidrError(`bad prefix length in CIDR: "${value}"`);
  }

  return { network: applyMask(address, bits), bits, source: trimmed };
}

/**
 * Mask an address down to its network address.
 *
 * 🔴 `bits === 0` is special-cased because JavaScript's `<<` uses only the low 5
 * bits of its right operand: `-1 << 32` is `-1`, NOT `0`. Without this, a /0
 * would match nothing instead of everything — the exact inversion of what it
 * means, and silent.
 */
function applyMask(address: number, bits: number): number {
  if (bits === 0) return 0;
  const mask = (-1 << (32 - bits)) >>> 0;
  return (address & mask) >>> 0;
}

export function cidrContains(cidr: Cidr, address: number): boolean {
  return applyMask(address, cidr.bits) === cidr.network;
}

/**
 * The configured allow-list.
 *
 * `PAYNET_ALLOWED_IPS` (comma-separated) overrides the documented ranges — for a
 * staging environment or if Paynet changes them. It does not *add* to them:
 * being explicit about the whole list is safer than an accidental union.
 */
export function loadAllowList(raw = process.env.PAYNET_ALLOWED_IPS): Cidr[] {
  const source = raw?.trim() ? raw.split(',') : [...DEFAULT_RANGES];
  return source.map((entry) => parseCidr(entry)).filter((cidr) => cidr.source.length > 0);
}

/**
 * Is this address allowed?
 *
 * ⚠️ FAILS CLOSED. An unparseable address is not on the list.
 */
export function isAllowed(addressText: string | undefined | null, list: Cidr[]): boolean {
  if (!addressText) return false;
  const address = parseIpv4(addressText);
  if (address === null) return false;
  return list.some((cidr) => cidrContains(cidr, address));
}
