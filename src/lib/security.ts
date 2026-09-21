import { z } from 'zod';

/**
 * Image URL Sanitization
 * Allows only https://, data:image/(png|jpeg|jpg|webp|gif|svg+xml);base64,..., and blob: URLs.
 * Strictly blocks javascript:, http:, data:text/html, and other unsafe protocols.
 */
export function isValidImageUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Block javascript: and unsafe schemas explicitly
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/') ||
    lower.startsWith('data:application/') ||
    lower.startsWith('http://')
  ) {
    return false;
  }

  // Allow HTTPS
  if (trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Allow safe base64 image formats
  if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return true;
  }

  // Allow blob previews created by URL.createObjectURL
  if (trimmed.startsWith('blob:')) {
    return true;
  }

  return false;
}

/**
 * Returns the sanitized image URL or a safe fallback.
 */
export function sanitizeImageUrl(url: unknown, fallback: string = ''): string {
  if (isValidImageUrl(url)) {
    return (url as string).trim();
  }
  return fallback;
}

/**
 * Form field sanitizers and validators
 */
export function sanitizeText(val: unknown, maxLength: number = 500): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLength);
}

export function isValidDateStr(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const [year, month, day] = val.split('-').map(Number);
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isValidTimeStr(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  if (!/^\d{2}:\d{2}$/.test(val)) return false;
  const [hours, minutes] = val.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Web Crypto API PBKDF2 PIN Hashing & Verification
 * Used for local device lockout of sensitive journals/desabafos.
 */

const PBKDF2_ITERATIONS = 100000;
const PIN_STORAGE_KEY = 'atelier_privacy_pin';

export interface PinLockConfig {
  enabled: boolean;
  salt: string;
  hash: string;
  updatedAt: string;
}

// Convert ArrayBuffer to Hex String
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex String to Uint8Array
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generate a cryptographically secure random salt in hex
 */
export function generateSalt(byteLength: number = 16): string {
  const array = new Uint8Array(byteLength);
  crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

/**
 * Hash a numeric PIN using PBKDF2-HMAC-SHA-256 with Web Crypto
 */
export async function hashPin(pin: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const pinKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltBuffer = hexToBuffer(saltHex);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    pinKey,
    256
  );

  return bufferToHex(derivedBits);
}

/**
 * Verify a PIN against a salt and expected hash
 */
export async function verifyPin(pin: string, saltHex: string, expectedHash: string): Promise<boolean> {
  try {
    const computedHash = await hashPin(pin, saltHex);
    return computedHash === expectedHash;
  } catch (err) {
    console.error('Erro na validação do PIN:', err);
    return false;
  }
}

/**
 * Save PIN lock configuration to local storage
 */
export function savePinConfig(config: PinLockConfig | null): void {
  try {
    if (!config) {
      localStorage.removeItem(PIN_STORAGE_KEY);
    } else {
      localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(config));
    }
  } catch (err) {
    console.warn('Erro ao salvar configuração do PIN no localStorage:', err);
  }
}

/**
 * Load PIN lock configuration from local storage
 */
export function loadPinConfig(): PinLockConfig | null {
  try {
    const item = localStorage.getItem(PIN_STORAGE_KEY);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (parsed && typeof parsed.enabled === 'boolean' && parsed.salt && parsed.hash) {
      return parsed as PinLockConfig;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 2MB Maximum payload validator for backup imports
 */
export const MAX_IMPORT_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export function validateFileSize(sizeInBytes: number): boolean {
  return sizeInBytes <= MAX_IMPORT_SIZE_BYTES;
}
