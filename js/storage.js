/* Defensive localStorage helpers. Every key is namespaced "vegas.". Reads
   tolerate a missing/corrupt/blocked store and fall back to a caller default, so
   private-mode or quota errors degrade to in-memory behavior instead of throwing
   (spec §7, §8). */

export const PREFIX = "vegas.";

export function getJSON(key, def = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return def;
    return JSON.parse(raw);
  } catch {
    return def;
  }
}

export function setJSON(key, val) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(val));
  } catch {
    /* full / blocked / private mode — ignore, app continues in memory */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/* Wipe every vegas.* key (hub + per-page "clear data"). */
export function clearAll() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
