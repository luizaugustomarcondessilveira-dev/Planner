/**
 * UUID utility for validating, generating, and deterministic remapping of IDs.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUUID(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str.trim());
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const ID_MAP_STORAGE_KEY = 'atelier_id_mapping';

export function getStoredIdMapping(): Record<string, string> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const stored = localStorage.getItem(ID_MAP_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveStoredIdMapping(map: Record<string, string>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ID_MAP_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

/**
 * Ensures an ID is a valid UUID. If already UUID, returns it.
 * If not, maps it consistently and idempotently using the persistent ID dictionary.
 */
export function ensureUUID(
  rawId: string | undefined | null,
  mapping?: Record<string, string>
): string {
  if (rawId && isUUID(rawId)) {
    return rawId.trim();
  }
  const key = (rawId || '').trim();
  if (!key) {
    return generateUUID();
  }

  if (mapping && mapping[key]) {
    return mapping[key];
  }

  const storedMap = getStoredIdMapping();
  if (storedMap[key]) {
    if (mapping) mapping[key] = storedMap[key];
    return storedMap[key];
  }

  const newId = generateUUID();
  storedMap[key] = newId;
  saveStoredIdMapping(storedMap);
  if (mapping) mapping[key] = newId;
  return newId;
}

