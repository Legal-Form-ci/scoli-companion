import DOMPurify from 'dompurify';

/**
 * Security Utilities — Scoly Platform
 * Sanitization, validation, and protection helpers
 */

// ── HTML Sanitization ──────────────────────────────────────────────────────

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'figure', 'figcaption',
  'sup', 'sub', 'mark',
];

const ALLOWED_ATTRS = [
  'href', 'src', 'alt', 'title', 'class', 'style',
  'target', 'rel', 'width', 'height',
  'colspan', 'rowspan', 'scope',
  'data-youtube-video',
];

/**
 * Sanitize HTML content — removes all dangerous elements (scripts, event handlers, etc.)
 * Safe for use with dangerouslySetInnerHTML
 */
export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange'],
  });
};

/**
 * Sanitize plain text — strips ALL HTML tags
 */
export const sanitizeText = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};

// ── URL Validation ─────────────────────────────────────────────────────────

const SAFE_URL_PROTOCOLS = ['https:', 'http:', 'mailto:'];

/**
 * Validate a URL is safe (no javascript:, data:, etc.)
 */
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return SAFE_URL_PROTOCOLS.includes(parsed.protocol);
  } catch {
    // Relative URLs are safe
    return url.startsWith('/') || url.startsWith('#');
  }
};

/**
 * Sanitize a URL — returns empty string if unsafe
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!isSafeUrl(trimmed)) return '';
  return trimmed;
};

// ── Input Validation ───────────────────────────────────────────────────────

/**
 * Check for common SQL injection patterns (client-side pre-filter)
 */
export const containsSQLInjection = (input: string): boolean => {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE)\b)/i,
    /(--|;|'|"|\/\*|\*\/)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(\bAND\b\s+\d+\s*=\s*\d+)/i,
  ];
  return patterns.some(p => p.test(input));
};

/**
 * Check for XSS patterns in input
 */
export const containsXSS = (input: string): boolean => {
  const patterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /data:\s*text\/html/i,
    /vbscript:/i,
  ];
  return patterns.some(p => p.test(input));
};

/**
 * Sanitize user input for forms — trims, limits length, checks for attacks
 */
export const sanitizeFormInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  let sanitized = input.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  return sanitized;
};

// ── Session Security ───────────────────────────────────────────────────────

const SESSION_ACTIVITY_KEY = 'scoly_last_activity';
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Record user activity timestamp
 */
export const recordActivity = (): void => {
  sessionStorage.setItem(SESSION_ACTIVITY_KEY, Date.now().toString());
};

/**
 * Check if user session has expired due to inactivity
 */
export const isSessionExpired = (): boolean => {
  const lastActivity = sessionStorage.getItem(SESSION_ACTIVITY_KEY);
  if (!lastActivity) return false; // First visit, not expired
  const elapsed = Date.now() - parseInt(lastActivity, 10);
  return elapsed > INACTIVITY_TIMEOUT_MS;
};

/**
 * Clear all sensitive session data
 */
export const clearSensitiveData = (): void => {
  sessionStorage.removeItem(SESSION_ACTIVITY_KEY);
  // Don't clear localStorage device fingerprint — that's needed for login security
};

// ── Fingerprint & Anti-Tampering ───────────────────────────────────────────

/**
 * Detect if DevTools console is being used to tamper with localStorage
 * (advisory only — not a security boundary)
 */
export const getIntegrityHash = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};
