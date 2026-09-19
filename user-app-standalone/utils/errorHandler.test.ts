/**
 * T-121 step 5 — `errorHandler.ts`, the USER app.
 *
 * This module is the one every screen's catch block goes through, and its central fact is the
 * project's oddest convention: **errors carry an axios-shaped `.response` even though nothing
 * here uses axios.** `fetch` never sets it, so `ApiError` hand-builds `status`, `data` AND
 * `response` — because `handleBackendError`'s switch reads `.response.status`, and before that
 * was fixed the entire switch was dead code and every screen fell back to its own generic text.
 * These tests pin BOTH readings, since the codebase throws both shapes.
 *
 * ⚠️ **Measured drift, deliberately not "fixed" here** (the card records, it does not fix):
 * the driver app's copy differs by 59 lines and is NOT a stale twin —
 *   • its `parseValidationErrors` reads `error.data.errors` as well as `error.response.data.errors`
 *     (T-061), where this one reads only the `.response` path;
 *   • it exports `getFieldErrors` and `displayValidationErrors`, which this app has not got.
 * Neither is a live defect here: every thrower in this app is either an `ApiError` (which always
 * sets `.response`) or a bare `new Error(msg)` carrying no status or data at all, and this app's
 * two callers use `parseValidationErrors` directly rather than gating on a 422. It is written
 * down in the driver app's test file too, so whichever copy is read first says the same thing.
 *
 * `t` is modelled on the real `useTranslation`: **a miss returns the key itself.** That is not a
 * convenience for the test — `getErrorMessage`'s T-115 branch uses exactly that behaviour as its
 * presence check, so the fake must share it or that test would prove nothing.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  ApiError,
  getErrorMessage,
  getRetryAfterSec,
  handleBackendError,
  isAuthError,
  isNetworkError,
  parseValidationErrors,
} from './errorHandler';
import { showToast } from './toast';

// The real module pulls in `react-native-toast-message` and a JSX renderer; none of that is
// under test here, and the only thing the assertions need is the call. Below the imports on
// purpose — `babel-plugin-jest-hoist` lifts it above them anyway, and writing it above costs an
// `import/first` lint warning, which this project treats as a defect in the test file.
jest.mock('./toast', () => ({
  showToast: { error: jest.fn(), success: jest.fn() },
}));

const toastError = showToast.error as jest.Mock<(title: string, message?: string) => void>;

/** Translations the app really has are irrelevant here; only the MISS rule matters. */
const dictionary: Record<string, string> = {
  'errors.codes.SEAT_TAKEN': 'Bu joy allaqachon band',
};
const t = (key: string): string => dictionary[key] ?? key;

beforeEach(() => {
  toastError.mockClear();
});

describe('ApiError — the shape the whole module depends on', () => {
  it('carries status, data and a hand-built axios-style response', () => {
    const error = new ApiError(409, { message: 'Already joined' });

    expect(error.status).toBe(409);
    expect(error.data).toEqual({ message: 'Already joined' });
    // 🔴 The convention itself. Screens read `error?.response?.status || error?.status`, so both
    // have to be present and agree; dropping `.response` silently re-deadens the switch below.
    expect(error.response).toEqual({ status: 409, data: { message: 'Already joined' } });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
  });

  it('takes its message from the server, preferring message over error over the fallback', () => {
    expect(new ApiError(400, { message: 'msg', error: 'err' }, 'fallback').message).toBe('msg');
    expect(new ApiError(400, { error: 'err' }, 'fallback').message).toBe('err');
    expect(new ApiError(400, {}, 'fallback').message).toBe('fallback');
  });

  it('still says something useful when the server sent nothing at all', () => {
    expect(new ApiError(503, null).message).toBe('Request failed (503)');
  });
});

describe('getRetryAfterSec', () => {
  // The server puts it in the `data` envelope of a 429, so it lands two `data`s deep.
  it('reads the nested retryAfterSec from either shape', () => {
    expect(getRetryAfterSec({ response: { data: { data: { retryAfterSec: 30 } } } })).toBe(30);
    expect(getRetryAfterSec({ data: { data: { retryAfterSec: 30 } } })).toBe(30);
    expect(getRetryAfterSec(new ApiError(429, { data: { retryAfterSec: 30 } }))).toBe(30);
  });

  it('rounds a fractional wait UP, so the countdown never lets a retry through early', () => {
    expect(getRetryAfterSec({ data: { data: { retryAfterSec: 4.2 } } })).toBe(5);
  });

  it.each([
    ['absent', {}],
    ['not a number', { data: { data: { retryAfterSec: '30' } } }],
    ['zero', { data: { data: { retryAfterSec: 0 } } }],
    ['negative', { data: { data: { retryAfterSec: -5 } } }],
    ['shallower than the envelope', { data: { retryAfterSec: 30 } }],
  ])('returns undefined when it is %s', (_label, error) => {
    expect(getRetryAfterSec(error)).toBeUndefined();
  });
});

describe('handleBackendError — reading the status', () => {
  it('reads a hand-built .response.status', () => {
    const message = handleBackendError({ response: { status: 404, data: {} } }, { t });

    expect(message).toBe('errors.notFound');
  });

  it('reads a plain .status too — without this the whole switch is dead code', () => {
    // 🔴 The regression the source comment describes: `fetch` never sets `.response`, so a module
    // that threw `{ status, data }` used to fall through the ENTIRE switch to the network branch.
    // This fixture has NO `.response` at all, so reading only that path returns `errors.unknown`.
    const message = handleBackendError({ status: 404, data: {} }, { t });

    expect(message).toBe('errors.notFound');
  });

  it('runs the switch for an ApiError even though ApiError manufactures its own message', () => {
    // Worth its own test: `new ApiError(404, {})` has a message of `Request failed (404)`, and
    // `serverMessage` prefers it — so the MESSAGE is the manufactured one while the TITLE proves
    // the switch ran. Asserting only the message here would have said nothing about the status.
    const message = handleBackendError(new ApiError(404, {}), { t });

    expect(message).toBe('Request failed (404)');
    expect(toastError).toHaveBeenCalledWith('errors.notFound', 'Request failed (404)');
  });
});

describe('handleBackendError — HTTP statuses', () => {
  it('prefers the server’s sentence on a 400 and titles it a bad request', () => {
    const message = handleBackendError(new ApiError(400, { message: 'Seats must be at least 1' }), {
      t,
    });

    expect(message).toBe('Seats must be at least 1');
    expect(toastError).toHaveBeenCalledWith('errors.badRequest', 'Seats must be at least 1');
  });

  it('falls back to the generic validation text when a 400 says nothing', () => {
    expect(handleBackendError({ status: 400, data: {} }, { t })).toBe('errors.validation');
  });

  it('reports a 409 duplicate with the server’s own wording', () => {
    const message = handleBackendError(new ApiError(409, { error: 'Already joined this ride' }), {
      t,
    });

    expect(message).toBe('Already joined this ride');
    expect(toastError).toHaveBeenCalledWith('errors.conflict', 'Already joined this ride');
  });

  it('reports a 422 as a validation failure', () => {
    expect(handleBackendError({ status: 422, data: {} }, { t })).toBe('errors.validation');
    expect(toastError).toHaveBeenCalledWith('errors.validation', 'errors.validation');
  });

  it('always prefers the server’s explanation on a 429, because the wait is the point', () => {
    const message = handleBackendError(new ApiError(429, { message: 'Wait 30 seconds' }), {
      t,
      defaultMessage: 'a default that must not win',
    });

    expect(message).toBe('Wait 30 seconds');
  });

  it.each([500, 502, 503, 504])(
    'answers a %s with try-again rather than the server’s internals',
    (status) => {
      // Deliberate: a 5xx body is a stack trace or an nginx page, not something to show a user.
      const message = handleBackendError(new ApiError(status, { message: 'ECONNREFUSED at pg' }), {
        t,
      });

      expect(message).toBe('errors.serverError. errors.tryAgain');
    }
  );

  it('joins the caller’s default to the server’s text on an unhandled status', () => {
    const message = handleBackendError(new ApiError(418, { message: 'I am a teapot' }), {
      t,
      defaultMessage: 'Could not load the ride',
    });

    expect(message).toBe('Could not load the ride: I am a teapot');
  });

  it('prefers data.error over data.message — the OPPOSITE of getErrorMessage', () => {
    // 📌 Recorded, not fixed (T-121 boards what it finds): the two readers in this one file
    // disagree about which key wins when the server sends both. Same payload, two answers.
    expect(handleBackendError({ status: 400, data: { error: 'E', message: 'M' } }, { t })).toBe('E');
    expect(getErrorMessage({ response: { data: { error: 'E', message: 'M' } } })).toBe('M');
  });
});

describe('handleBackendError — no response at all', () => {
  it.each([
    ['an aborted connection', { code: 'ECONNABORTED' }, 'errors.timeout'],
    ['the literal word timeout', { message: 'Request timeout. Please try again.' }, 'errors.timeout'],
    ['a network code', { code: 'ERR_NETWORK' }, 'errors.network'],
    ['the word Network in the message', { message: 'Network request failed' }, 'errors.network'],
  ])('calls %s what it is', (_label, error, expected) => {
    expect(handleBackendError(error, { t })).toBe(expected);
  });

  it('🟢 T-123 FIXED: "Request timed out." IS recognised as a timeout', () => {
    // This test was written by T-121 asserting the WRONG-but-real behaviour on purpose, so that
    // it would go red the day the defect was fixed. **2026-09-18 is that day** — it was flipped,
    // not deleted, and the history is the point: the branch used to match only the substring
    // `timeout`, while `api/auth.ts`'s OTP send throws "Request timed **out**. Please check your
    // internet connection." So the first screen every new install sees answered a dropped
    // connection with its generic `phoneRegistration.errorOtpSend` default.
    const timeout = { message: 'Request timed out. Please check your internet connection.' };

    expect(handleBackendError(timeout, { t, defaultMessage: 'Could not send the code' })).toBe(
      'errors.timeout'
    );
    expect(isNetworkError(timeout)).toBe(true);
  });

  it('🔴 T-123, the bigger half: a RAW AbortError is a timeout, whatever its message says', () => {
    // 7 of the user app's 8 `api/auth.ts` functions have no abort branch at all — `verifyOtp`,
    // the three SSO calls, `getCurrentUser`, `refreshAccessToken` and `logout` re-throw the raw
    // `AbortError`, whose message is "Aborted" and matches NEITHER spelling. Matching the name is
    // what covers them, because it is what `controller.abort()` produces however a module words
    // it afterwards.
    // ⚠️ Built by hand on purpose: Node 22 words an aborted fetch "This operation was aborted"
    // and React Native's polyfill says "Aborted". Neither is ours to pin — the NAME is.
    const aborted = Object.assign(new Error('Aborted'), { name: 'AbortError' });

    expect(handleBackendError(aborted, { t, defaultMessage: 'Could not send the code' })).toBe(
      'errors.timeout'
    );
    expect(isNetworkError(aborted)).toBe(true);
  });

  it('does NOT call everything a timeout — the guard against a predicate that swallows', () => {
    // The fix widened the rule, so this is the test that keeps it honest: a failure that is
    // neither an abort nor a timeout must still reach the caller's own default.
    expect(handleBackendError({ message: 'Something else failed' }, { t, defaultMessage: 'D' })).toBe(
      'D'
    );
    expect(isNetworkError({ message: 'Something else failed' })).toBe(false);
    expect(isNetworkError({ name: 'TypeError', message: 'undefined is not a function' })).toBe(
      false
    );
  });

  it('survives an error whose message is not a string at all', () => {
    // Push payloads and native bridges hand us whatever they like; `.includes` on a number
    // throws, and this runs inside a catch block where a throw is a crash.
    expect(handleBackendError({ message: 42 }, { t, defaultMessage: 'D' })).toBe('D');
    expect(handleBackendError({ message: null }, { t })).toBe('errors.unknown');
    expect(isNetworkError({ message: 42 })).toBe(false);
  });

  it('falls back to the caller’s default for a failure it cannot name', () => {
    expect(handleBackendError({ message: 'something odd' }, { t, defaultMessage: 'Try later' })).toBe(
      'Try later'
    );
    expect(handleBackendError({}, { t })).toBe('errors.unknown');
  });
});

describe('handleBackendError — the toast', () => {
  it('shows one by default and returns the same text it showed', () => {
    const message = handleBackendError(new ApiError(403, { message: 'Not your ride' }), { t });

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith('errors.forbidden', message);
  });

  it('stays silent when the caller wants to render the error itself', () => {
    const message = handleBackendError(new ApiError(403, { message: 'Not your ride' }), {
      t,
      showToastNotification: false,
    });

    expect(toastError).not.toHaveBeenCalled();
    expect(message).toBe('Not your ride');
  });
});

describe('getErrorMessage', () => {
  it('passes a thrown string straight through', () => {
    expect(getErrorMessage('Something broke')).toBe('Something broke');
  });

  it('T-115: a server error CODE beats the server’s English sentence', () => {
    // The API writes `message` in English for anything it cannot localise, so an Uzbek speaker
    // would read English. A machine-readable `code` lets the app say it properly.
    const error = {
      response: { data: { message: 'Seat already taken', data: { code: 'SEAT_TAKEN' } } },
    };

    expect(getErrorMessage(error, t)).toBe('Bu joy allaqachon band');
  });

  it('falls through to the server’s sentence for a code this build has never heard of', () => {
    // 🔴 The presence test IS `t(key) !== key`, because the real `useTranslation` returns the key
    // on a miss. Getting this wrong shows the user the literal string `errors.codes.WHATEVER`.
    const error = {
      response: { data: { message: 'Seat already taken', data: { code: 'INVENTED_CODE' } } },
    };

    expect(getErrorMessage(error, t)).toBe('Seat already taken');
  });

  it('ignores a code when no translator was passed', () => {
    const error = { response: { data: { message: 'Seat already taken', data: { code: 'SEAT_TAKEN' } } } };

    expect(getErrorMessage(error)).toBe('Seat already taken');
  });

  it('prefers response.data.message, then response.data.error, then the thrown message', () => {
    expect(getErrorMessage({ response: { data: { message: 'M', error: 'E' } }, message: 'T' })).toBe('M');
    expect(getErrorMessage({ response: { data: { error: 'E' } }, message: 'T' })).toBe('E');
    expect(getErrorMessage({ message: 'T' })).toBe('T');
  });

  it('translates the caller’s default key, then its own, then says something in English', () => {
    expect(getErrorMessage({}, t, 'errors.joinFailed')).toBe('errors.joinFailed');
    expect(getErrorMessage({}, t)).toBe('errors.unknown');
    expect(getErrorMessage({}, undefined, 'Could not join')).toBe('Could not join');
    expect(getErrorMessage({})).toBe('An error occurred');
  });
});

describe('isNetworkError / isAuthError', () => {
  it.each([
    ['a network code', { code: 'ERR_NETWORK' }],
    ['an aborted connection', { code: 'ECONNABORTED' }],
    ['the word Network', { message: 'Network request failed' }],
    ['the word timeout', { message: 'Request timeout' }],
  ])('recognises %s as a network failure', (_label, error) => {
    expect(isNetworkError(error)).toBe(true);
  });

  it('is not a network failure once the server answered', () => {
    // The `.response` guard is what distinguishes "never arrived" from "arrived and said no",
    // even when the server's own words happen to contain "Network".
    expect(isNetworkError({ response: { status: 500 }, message: 'Network something' })).toBe(false);
    expect(isNetworkError(new ApiError(500, { message: 'Network something' }))).toBe(false);
  });

  it('recognises 401 and 403 as auth failures, and nothing else', () => {
    expect(isAuthError(new ApiError(401, {}))).toBe(true);
    expect(isAuthError(new ApiError(403, {}))).toBe(true);
    expect(isAuthError(new ApiError(404, {}))).toBe(false);
    expect(isAuthError({})).toBe(false);
  });

  it('📌 reads ONLY .response.status, unlike handleBackendError which reads both', () => {
    // Recorded, not fixed. It does not bite today only because `ApiError` always sets both —
    // a future thrower carrying a bare `status: 401` would not be recognised as an auth failure.
    expect(isAuthError({ status: 401 })).toBe(false);
  });
});

describe('parseValidationErrors', () => {
  it('maps the server’s errors[] to field → message', () => {
    const error = new ApiError(400, {
      errors: [
        { field: 'firstName', message: 'Ismni kiriting' },
        { field: 'birthDate', message: 'Sana notogri' },
      ],
    });

    expect(parseValidationErrors(error)).toStrictEqual({
      firstName: 'Ismni kiriting',
      birthDate: 'Sana notogri',
    });
  });

  it('skips entries that do not name both a field and a message', () => {
    const error = new ApiError(400, {
      errors: [{ field: 'firstName' }, { message: 'orphan' }, { field: 'email', message: 'Bad' }],
    });

    expect(parseValidationErrors(error)).toStrictEqual({ email: 'Bad' });
  });

  it('accepts the object form as well as the array form', () => {
    const error = new ApiError(422, { errors: { phone: 'Already registered' } });

    expect(parseValidationErrors(error)).toStrictEqual({ phone: 'Already registered' });
  });

  it('returns an empty map when the server named no fields', () => {
    expect(parseValidationErrors(new ApiError(400, { message: 'nope' }))).toStrictEqual({});
    expect(parseValidationErrors({})).toStrictEqual({});
  });

  it('📌 reads ONLY the .response path — the driver app’s copy also reads .data.errors', () => {
    // Recorded, not fixed (T-121 boards drift, it does not repair it). Harmless in THIS app:
    // every thrower here is an `ApiError`, which sets `.response`, or a bare `new Error` with no
    // fields at all. It becomes a bug the moment something throws `{ status, data }` raw — which
    // is exactly what happened in the driver app and became T-061.
    expect(parseValidationErrors({ data: { errors: [{ field: 'a', message: 'b' }] } })).toStrictEqual({});
    expect(
      parseValidationErrors({ response: { data: { errors: [{ field: 'a', message: 'b' }] } } })
    ).toStrictEqual({ a: 'b' });
  });
});
