/**
 * T-121 step 5 — `errorHandler.ts`, the DRIVER app.
 *
 * This module is the one every screen's catch block goes through, and its central fact is the
 * project's oddest convention: **errors carry an axios-shaped `.response` even though nothing
 * here uses axios.** `fetch` never sets it, so `ApiError` hand-builds `status`, `data` AND
 * `response` — because `handleBackendError`'s switch reads `.response.status`, and before that
 * was fixed the entire switch was dead code and every screen fell back to its own generic text.
 * These tests pin BOTH readings, since the codebase throws both shapes.
 *
 * ⚠️ **Measured drift, deliberately not "fixed" here** (the card records, it does not fix):
 * this copy differs from the user app's by 59 lines and is the RICHER of the two, not a twin —
 *   • its `parseValidationErrors` reads `error.data.errors` as well as `error.response.data.errors`
 *     (T-061), where the user app's reads only the `.response` path;
 *   • it exports `getFieldErrors` and `displayValidationErrors`, which the user app has not got.
 * Both are answers to a real bug this app had and the user app did not: **T-061** — five document
 * screens asked `if (statusCode === 422)` before unpacking `errors[]`, but our validator throws
 * 422 while a MODEL-level failure comes back as 400 and a duplicate as 409, so the server named
 * the field and the app threw the answer away. `getFieldErrors` asks the real question instead:
 * did the server name any fields at all? The tests below pin that. The same note is in the user
 * app's copy of this file, so whichever is read first says the same thing.
 *
 * `t` is modelled on the real `useTranslation`: **a miss returns the key itself.** That is not a
 * convenience for the test — `getErrorMessage`'s T-115 branch uses exactly that behaviour as its
 * presence check, so the fake must share it or that test would prove nothing.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  ApiError,
  displayValidationErrors,
  getErrorMessage,
  getFieldErrors,
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
    // 4 of this app's 5 `api/auth.ts` functions have no abort branch at all — only `sendOtp`
    // converts it. The rest re-throw the raw `AbortError`, whose message is "Aborted" and matches
    // NEITHER spelling. Matching the name is what covers them, because it is what
    // `controller.abort()` produces however a module words it afterwards.
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

  it.each([
    ['a raw AbortError', Object.assign(new Error('Aborted'), { name: 'AbortError' }), 'errors.timeout'],
    ['a "timed out" sentence', new Error('Request timed out. Please check your connection.'), 'errors.timeout'],
    ['a network code', { code: 'ERR_NETWORK' }, 'errors.network'],
    ['the runtime’s own English', new Error('Network request failed'), 'errors.network'],
  ])('🔴 T-116: names %s instead of showing the runtime’s English', (_label, error, expected) => {
    // Until 2026-09-19 these fell through to `error.message` — "Network request failed" or
    // "Aborted", in English, to an Uzbek driver. `handleBackendError` already knew better (T-123).
    expect(getErrorMessage(error, t, 'errors.loadFailed')).toBe(expected);
  });

  it('a local error that is not a connection failure keeps its own message', () => {
    // The guard against a branch that swallows: this app throws its own sentences too (T-126).
    expect(getErrorMessage(new Error('Rasmni tanlashda xatolik'), t)).toBe('Rasmni tanlashda xatolik');
  });

  it('without a translator the old behaviour stands', () => {
    expect(getErrorMessage(new Error('Network request failed'))).toBe('Network request failed');
    expect(getErrorMessage(new ApiError(500, { message: 'ECONNREFUSED at pg' }))).toBe('ECONNREFUSED at pg');
  });

  it.each([500, 502, 503, 504])('🔴 T-116: never shows a %s body — try-again instead', (status) => {
    // A 5xx body is a stack trace, an nginx page or an English internal message. The API's rule
    // that 5xx text never reaches a phone was true of `handleBackendError` only, until this.
    expect(getErrorMessage(new ApiError(status, { message: 'ECONNREFUSED at pg' }), t)).toBe(
      'errors.serverError. errors.tryAgain'
    );
  });

  it('agrees with handleBackendError on EVERY status from 400 to 599 about hiding the body', () => {
    // The two readers drifting apart is the defect class (T-123, now T-116) — so pin them.
    const hidden = 'errors.serverError. errors.tryAgain';
    const disagreements: number[] = [];
    for (let status = 400; status < 600; status++) {
      const error = new ApiError(status, { message: 'X' });
      const viaGet = getErrorMessage(error, t) === hidden;
      const viaHandle = handleBackendError(error, { t, showToastNotification: false }) === hidden;
      if (viaGet !== viaHandle) disagreements.push(status);
    }
    expect(disagreements).toEqual([]);
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

  it('reads BOTH shapes — the T-061 fix the user app’s copy has not got', () => {
    // 🔴 The drift, asserted from this side. Reading only `.response` meant a correctly-shaped
    // `ApiError` looked like it had no field errors at all. Both paths must work here.
    expect(
      parseValidationErrors({ data: { errors: [{ field: 'a', message: 'b' }] } })
    ).toStrictEqual({ a: 'b' });
    expect(
      parseValidationErrors({ response: { data: { errors: [{ field: 'a', message: 'b' }] } } })
    ).toStrictEqual({ a: 'b' });
  });
});

describe('getFieldErrors — T-061, asking the right question', () => {
  it.each([400, 409, 422])(
    'returns the named fields from a %s, because the STATUS was never the question',
    (status) => {
      // 🔴 The bug itself: screens gated on `statusCode === 422`, but 422 is only what OUR
      // validator middleware throws. A model-level failure (`User.email`'s `isEmail`) comes back
      // as 400 and a duplicate as 409 — the server named the field, the app showed a generic
      // toast, and the owner reported "it says the data is wrong but not which line".
      const error = new ApiError(status, {
        errors: [{ field: 'passportNumber', message: 'Notogri' }],
      });

      expect(getFieldErrors(error)).toStrictEqual({ passportNumber: 'Notogri' });
    }
  );

  it('returns null when the server named no fields, so ordinary failures still fall through', () => {
    // The guard that keeps this safe: a 400 carrying no `errors[]` must NOT be swallowed here —
    // it has to reach `handleBackendError` and become a visible toast.
    expect(getFieldErrors(new ApiError(400, { message: 'Something went wrong' }))).toBeNull();
    expect(getFieldErrors(new ApiError(500, null))).toBeNull();
    expect(getFieldErrors({})).toBeNull();
  });
});

describe('displayValidationErrors', () => {
  it('shows only the first field error by default', () => {
    const error = new ApiError(400, {
      errors: [
        { field: 'firstName', message: 'Ismni kiriting' },
        { field: 'lastName', message: 'Familiyani kiriting' },
      ],
    });

    displayValidationErrors(error, t);

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith('common.error', 'Ismni kiriting');
  });

  it('says nothing at all when the server named no fields', () => {
    displayValidationErrors(new ApiError(400, { message: 'nope' }), t);

    expect(toastError).not.toHaveBeenCalled();
  });

  describe('showing them all', () => {
    // The staggering is real `setTimeout` work, so the clock has to be controlled. Scoped to
    // this block: the rest of the file is synchronous and must not run on a fake clock.
    // ⚠️ Braces, not a concise body: `jest.useFakeTimers()` RETURNS the Jest object, and a hook
    // typed `void` rejects it — two `tsc` errors that a fully green Jest run hid completely,
    // because Jest strips types without checking them. Measured, not guessed.
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('staggers at most three, 300ms apart, however many the server sent', () => {
      const error = new ApiError(400, {
        errors: [
          { field: 'a', message: 'first' },
          { field: 'b', message: 'second' },
          { field: 'c', message: 'third' },
          { field: 'd', message: 'fourth — never shown' },
          { field: 'e', message: 'fifth — never shown' },
        ],
      });

      displayValidationErrors(error, t, false);

      // Nothing fires synchronously: even the first is scheduled, at 0ms.
      expect(toastError).not.toHaveBeenCalled();

      jest.advanceTimersByTime(0);
      expect(toastError).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(300);
      expect(toastError).toHaveBeenCalledTimes(2);

      // Drain the clock completely — the CAP is what is being asserted, so the count after
      // everything pending has run is the only thing that can prove a fourth never fires.
      jest.runAllTimers();
      expect(toastError).toHaveBeenCalledTimes(3);
      expect(toastError).toHaveBeenLastCalledWith('common.error', 'third');
    });
  });
});
