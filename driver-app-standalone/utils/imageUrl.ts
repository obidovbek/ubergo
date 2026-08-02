/**
 * Image URL resolution (OR-011 item 2)
 *
 * The upload endpoint returns a HOST-LESS path — `/uploads/driver-photos/<uuid>.jpg`.
 * React Native's <Image> needs an absolute URL, so handing that value straight to
 * `source={{ uri }}` renders nothing. The bug hid because every screen shows the
 * freshly picked `asset.uri` (a local file://) right after upload, and only uses
 * the stored server value after a reload — so the photo "worked" and then wasn't
 * there the next time the screen opened.
 *
 * ⚠️ `${API_BASE_URL}${path}` is WRONG here. API_BASE_URL ends in `/api`, but
 * `/uploads` is served from the ROOT of the same host, so that would produce
 * `/api/uploads/...` and a 404. The `/api` suffix has to come off first.
 *
 * Mirrors the admin panel's `getImageUrl` (`apps/admin/src/pages/drivers/DriverDetailPage.tsx`),
 * minus its browser-only localhost override, which has no meaning in a phone app.
 */

import { API_BASE_URL } from '../config/api';

/**
 * Turn whatever the API gave us into something <Image> can load.
 *
 * Accepts a relative path, an already-absolute URL, or a local `file://` /
 * `data:` URI (a just-picked photo), and returns null for empty input so callers
 * can keep using `uri ? <Image/> : <Placeholder/>`.
 */
export const resolveImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;

  const value = imageUrl.trim();
  if (!value) return null;

  // A photo the user just picked, or an inline image — already loadable as-is.
  if (value.startsWith('file://') || value.startsWith('data:') || value.startsWith('content://')) {
    return value;
  }

  // Already absolute: keep only the path, so the host always comes from the
  // configured API base. Stops a stale host baked into an old row from 404ing
  // after the server moves.
  let imagePath = value;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    const match = value.match(/^https?:\/\/[^/]+(\/.*)$/);
    imagePath = match ? match[1] : value;
  }

  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  // Drop the `/api` suffix — uploads live at the host root, not under the API.
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');

  return `${origin}${normalizedPath}`;
};

export default resolveImageUrl;
