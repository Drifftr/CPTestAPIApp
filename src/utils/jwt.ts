/**
 * Decode a base64url-encoded string (JWT payload).
 * Handles base64url chars (-_ instead of +/) and missing padding.
 */
export function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad === 2) base64 += '==';
  else if (pad === 3) base64 += '=';
  return atob(base64);
}

/**
 * Safely extract claims from a JWT token string.
 * Returns null if decoding fails.
 */
export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
}
