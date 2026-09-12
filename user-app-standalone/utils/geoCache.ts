/**
 * Geo cache — T-113.
 *
 * 🔴 WHY. Every level of the address picker re-fetched from the network, with a full spinner:
 * choosing a country blanked the list and reloaded it to show provinces, then again for
 * districts. The owner reported it on 2026-09-12 — *"for eye it is not good"*. The data behind
 * it is administrative divisions, which change a few times a year at most, so refetching them
 * on every open was always waste.
 *
 * THREE LAYERS, each fixing a different flicker:
 *
 *   1. **In-flight dedupe.** Two callers asking for the same list share one request. Without
 *      it, a screen that mounts two pickers fires two identical calls.
 *   2. **Memory.** Instant for the rest of the session — this is the one the owner actually
 *      sees, because it removes the spinner when stepping back and forth between levels.
 *   3. **Disk (`AsyncStorage`), with a TTL.** Survives an app restart, so the FIRST open after
 *      launch is instant too.
 *
 * 🔴 STALE-WHILE-REVALIDATE, DELIBERATELY. A cached list is returned immediately AND a quiet
 * refresh runs behind it; if the result differs, the cache is updated for next time. That is
 * what makes a long TTL safe: when an admin adds a city, it appears on the NEXT open rather
 * than up to `TTL` later. **A background refresh must never surface an error or a spinner** —
 * the caller already has usable data, and interrupting them with a failure they did not ask
 * for would be worse than the staleness.
 *
 * ⚠️ TTL is **24 hours**. Long enough that a normal session never re-fetches, short enough
 * that a device that has been offline for a day re-validates on its own. The owner left the
 * period open ("for some period"); this is the choice, and it is one constant.
 *
 * ⚠️ Cached under a VERSIONED key prefix. If the shape of `GeoOption` ever changes, bumping
 * `VERSION` orphans the old entries instead of feeding a stale shape into a new reader.
 *
 * ⚠️ Every storage call is wrapped: a device with full or disabled storage must degrade to
 * "network only", never to a crash. The cache is an optimisation, not a dependency.
 *
 * ⚠️ Duplicated per app rather than extracted (`ubexgo-app-conventions`). Edit both copies
 * together; the driver app's lives at `utils/geoCache.ts` too.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const VERSION = 'v1';
const PREFIX = `@ubexgo:geo:${VERSION}:`;

/** 24 hours. See the header — this is the "some period" the owner left open. */
export const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface Entry<T> {
  at: number;
  data: T;
}

/** Session-lifetime memory cache. Cleared only by `clearGeoCache` or a restart. */
const memory = new Map<string, Entry<unknown>>();

/** Requests currently in flight, so identical callers share one. */
const inFlight = new Map<string, Promise<unknown>>();

const fresh = (entry: Entry<unknown>, now: number): boolean =>
  now - entry.at < GEO_CACHE_TTL_MS;

const readDisk = async <T>(key: string): Promise<Entry<T> | null> => {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry<T>;
    // A hand-edited or truncated entry must not poison the caller.
    if (!parsed || typeof parsed.at !== 'number' || !Array.isArray(parsed.data)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeDisk = async <T>(key: string, entry: Entry<T>): Promise<void> => {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable. The memory cache still works; nothing to tell the user.
  }
};

/**
 * Return the cached list if there is one, else fetch. Either way the caller gets data as fast
 * as it can be had, and the cache is brought up to date behind them.
 *
 * @param key    a stable identity for this list, e.g. `provinces:12`.
 * @param fetcher the real network call.
 */
export const cachedGeo = async <T>(key: string, fetcher: () => Promise<T[]>): Promise<T[]> => {
  const now = Date.now();

  const revalidate = (): Promise<T[]> => {
    const existing = inFlight.get(key) as Promise<T[]> | undefined;
    if (existing) return existing;

    const p = fetcher()
      .then((data) => {
        const entry: Entry<T[]> = { at: Date.now(), data };
        memory.set(key, entry);
        void writeDisk(key, entry);
        return data;
      })
      .finally(() => {
        inFlight.delete(key);
      });

    inFlight.set(key, p);
    return p;
  };

  const mem = memory.get(key) as Entry<T[]> | undefined;
  if (mem) {
    // Serve instantly. Refresh behind only when the entry has aged out.
    if (!fresh(mem, now)) {
      void revalidate().catch(() => undefined);
    }
    return mem.data;
  }

  const disk = await readDisk<T[]>(key);
  if (disk) {
    memory.set(key, disk);
    if (!fresh(disk, now)) {
      void revalidate().catch(() => undefined);
    }
    return disk.data;
  }

  // Nothing cached: this one call still shows a spinner, and must be allowed to throw.
  return revalidate();
};

/**
 * Drop everything. Call on logout, or from a debug screen.
 *
 * ⚠️ Disk keys are removed by prefix, so an unrelated key is never touched.
 */
export const clearGeoCache = async (): Promise<void> => {
  memory.clear();
  inFlight.clear();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(PREFIX));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {
    // Memory is cleared either way, which is what the current session sees.
  }
};
