/**
 * UUID utility for validating, generating, and deterministic remapping of IDs.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUUID(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str);
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

/**
 * Ensures an ID is a valid UUID. If already UUID, returns it.
 * If not, maps it consistently using the provided mapping dictionary.
 */
export function ensureUUID(
  rawId: string | undefined | null,
  mapping?: Record<string, string>
): string {
  if (rawId && isUUID(rawId)) {
    return rawId;
  }
  const key = (rawId || '').trim();
  if (!key) {
    return generateUUID();
  }
  if (mapping) {
    if (mapping[key]) {
      return mapping[key];
    }
    const newId = generateUUID();
    mapping[key] = newId;
    return newId;
  }
  return generateUUID();
}
