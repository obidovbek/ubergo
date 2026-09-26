/**
 * T-129 — read a possibly nested field out of a request body by dotted path.
 *
 * `validateRequest` used to read `data[rule.field]` — the top level only — while
 * `DriverLicenseScreen` posts `{ license: { license_number, … }, emergencyContacts }`.
 * The rule `license_number` therefore looked at `undefined` and refused every
 * licence save (T-063 mounted it; T-129 found it on the owner's phone). A rule
 * now names the path it means: `license.license_number`.
 *
 * ⚠️ A key that itself contains a dot is not supported — no body in this API
 * has one, and it would be indistinguishable from a path.
 */
export const readField = (data: unknown, path: string): unknown => {
  let current: unknown = data;
  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
};
