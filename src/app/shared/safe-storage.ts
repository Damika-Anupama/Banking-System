/**
 * localStorage that cannot take the app down.
 *
 * Strict privacy modes make storage hostile in two ways: some browsers throw
 * on any `localStorage` access (blocked third-party contexts, lockdown modes),
 * others accept writes and discard them. The demo is entirely client-side, so
 * a raw `localStorage.setItem` in the sign-in path meant those visitors got a
 * crash instead of a demo.
 *
 * When real storage is unusable, reads and writes fall back to an in-memory
 * map: the session works normally and simply forgets on refresh — the correct
 * behaviour for a private-mode visitor anyway.
 */

const memory = new Map<string, string>();
let probed: boolean | null = null;

function storageUsable(): boolean {
  if (probed !== null) return probed;
  try {
    const key = '__storage_probe__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    probed = true;
  } catch {
    probed = false;
  }
  return probed;
}

export function readStorage(key: string): string | null {
  if (storageUsable()) {
    try {
      return localStorage.getItem(key);
    } catch {
      /* fall through to memory */
    }
  }
  return memory.has(key) ? (memory.get(key) as string) : null;
}

export function writeStorage(key: string, value: string): void {
  if (storageUsable()) {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      /* fall through to memory */
    }
  }
  memory.set(key, value);
}

export function removeStorage(key: string): void {
  if (storageUsable()) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* memory removal below still applies */
    }
  }
  memory.delete(key);
}

/** Clears every key, both real and fallback. */
export function clearStorage(): void {
  if (storageUsable()) {
    try {
      localStorage.clear();
    } catch {
      /* memory clear below still applies */
    }
  }
  memory.clear();
}

/** Test hook: forget the probe result and fallback contents. */
export function resetSafeStorageForTests(): void {
  probed = null;
  memory.clear();
}
