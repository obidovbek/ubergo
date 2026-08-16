/**
 * What a Paynet agent is shown about a payer — T-088.
 *
 * 🔴 THIS IS THE MOST SENSITIVE FUNCTION IN THE CARD, and it is small on
 * purpose. `GetInformation` returns this to whoever calls it, and **T-092 made
 * `users.id` enumerable from a known origin** (1 100 001, 1 100 002 …). So the
 * output of this file is what an attacker who gets past the IP gate can harvest
 * by counting upwards.
 *
 * The masking therefore happens SERVER-SIDE, here, and the full number is never
 * placed in a response body for a UI to hide. A masked value that travels the
 * wire in full has not been masked at all.
 *
 * The shape `+99890 ***4585` is the owner's requirement: enough for an agent to
 * read back to the customer standing in front of them ("is this you?"), not
 * enough to identify or contact a stranger.
 *
 * ⚠️ Deliberately NOT `auditLogger.maskSensitiveData`, which produces
 * `+998**...67`. That hides the operator code and shows only two digits — fine
 * for a log, useless for the read-back this exists for. Two different jobs.
 */

/** Digits kept at the end — enough to confirm, not enough to dial. */
const VISIBLE_TAIL = 4;

/**
 * Digits of the country + operator prefix kept at the front.
 *
 * ⚠️ FIVE, not six: Uzbekistan is `998` (three digits) plus a two-digit
 * operator code, giving `+99890`. Six produced `+998901` — one digit of the
 * subscriber's own number, leaked on every single lookup. Caught by the test
 * asserting the exact shape the owner specified.
 */
const VISIBLE_HEAD = 5;

/**
 * Mask an E.164 number for an agent's screen: `+998901234585` → `+99890 ***4585`.
 *
 * ⚠️ Falls back to full masking rather than throwing on anything unexpected.
 * A number in an unforeseen format must not leak because the parser did not
 * recognise it — **the failure direction matters more than the formatting.**
 */
export function maskPhoneForAgent(e164: string | null | undefined): string {
  // ⚠️ Trim BEFORE the emptiness check: a whitespace-only value is "no number",
  // not "an unparseable number", and the two answer differently ('' vs '***').
  const trimmed = e164?.trim() ?? '';
  if (trimmed.length === 0) return '';

  // Keep only the leading '+' and digits; anything else is formatting noise.
  const normalised = trimmed.startsWith('+')
    ? `+${trimmed.slice(1).replace(/\D/g, '')}`
    : trimmed.replace(/\D/g, '');

  const digits = normalised.startsWith('+') ? normalised.slice(1) : normalised;

  // Too short to mask meaningfully — reveal nothing rather than reveal most.
  if (digits.length < VISIBLE_HEAD + VISIBLE_TAIL) {
    return '***';
  }

  const head = digits.slice(0, VISIBLE_HEAD);
  const tail = digits.slice(-VISIBLE_TAIL);
  return `+${head} ***${tail}`;
}

/**
 * The `fields` a Paynet request identifies a payer by.
 *
 * 🛑 BLOCKER ② — THE FIELD SET IS NEGOTIATED PER PROVIDER AND OURS IS NOT AGREED.
 * The annex's example (`account`, `name`, `balance`) is *TV Turon Navoi*'s; the
 * JSON spec uses `client_id` / `fio`. This implements the JSON spec's names,
 * because that is the protocol document, and accepts `account` as an alias so a
 * late answer of "call it account" costs nothing.
 *
 * ⚠️ When Paynet answers, change THIS function — not the handlers.
 */
export function readClientId(fields: unknown): string | null {
  if (typeof fields !== 'object' || fields === null) return null;

  const record = fields as Record<string, unknown>;
  // `client_id` is the JSON spec's name; `account` is the annex's. Accepting
  // both costs one line and removes a whole class of go-live failure.
  const raw = record.client_id ?? record.account;

  if (typeof raw === 'number') {
    return Number.isSafeInteger(raw) ? String(raw) : null;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

/**
 * Parse a client id into a `users.id`.
 *
 * ⚠️ Strict: digits only, no sign, no decimal point, within safe range. A
 * client id is typed by a human at a terminal, so "1 100 001" and "1100001abc"
 * both arrive in practice — and a lenient parse here would look up the wrong
 * person's account.
 */
export function parseUserId(clientId: string | null): number | null {
  if (!clientId) return null;

  // Agents and terminals both introduce spaces in long numbers.
  const compact = clientId.replace(/\s/g, '');
  if (!/^\d+$/.test(compact)) return null;

  const parsed = Number(compact);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
}
