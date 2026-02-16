/**
 * Session Store for EmblemAI CLI
 *
 * Handles persistent storage of auth sessions to ~/.emblemai/session.json
 * with secure file permissions. Ported from hustle-v5/src/auth/session-store.ts.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const EMBLEMAI_DIR = path.join(os.homedir(), '.emblemai');
const SESSION_FILE = path.join(EMBLEMAI_DIR, 'session.json');

// Token refresh buffer (refresh 5 minutes before expiry)
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Ensure the .emblemai directory exists with secure permissions
 */
function ensureDir() {
  if (!fs.existsSync(EMBLEMAI_DIR)) {
    fs.mkdirSync(EMBLEMAI_DIR, { recursive: true, mode: 0o700 });
  }
}

/**
 * Save an auth session to disk.
 * @param {object} session - AuthSession from the SDK
 */
export function saveSession(session) {
  ensureDir();

  const stored = {
    session,
    storedAt: Date.now(),
  };

  fs.writeFileSync(SESSION_FILE, JSON.stringify(stored, null, 2), { mode: 0o600 });
}

/**
 * Load the stored auth session from disk.
 * Returns null if no session exists or if it's invalid.
 * @returns {object | null}
 */
export function loadSession() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return null;

    const content = fs.readFileSync(SESSION_FILE, 'utf-8');
    const stored = JSON.parse(content);

    if (!stored?.session?.authToken || !stored?.session?.user) {
      return null;
    }

    return stored.session;
  } catch {
    return null;
  }
}

/**
 * Clear the stored session file.
 */
export function clearSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  } catch {
    // Ignore errors when clearing
  }
}

/**
 * Check if a session is expired.
 * @param {object} session
 * @returns {boolean}
 */
export function isSessionExpired(session) {
  return Date.now() >= session.expiresAt;
}

/**
 * Check if a session needs refresh (within 5 minutes of expiry).
 * @param {object} session
 * @returns {boolean}
 */
export function needsRefresh(session) {
  const timeUntilExpiry = session.expiresAt - Date.now();
  return timeUntilExpiry < REFRESH_BUFFER_MS;
}
