/**
 * auth.js - Authentication flow for emblem-enhanced TUI
 *
 * Handles password retrieval, credential storage (dotenvx encrypted),
 * EmblemAuthSDK authentication, and the interactive auth menu.
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFile } from 'child_process';
import dotenvx from '@dotenvx/dotenvx';
import { saveSession, loadSession, clearSession, isSessionExpired } from './session-store.js';
import { startAuthServer } from './auth-server.js';

// ── Paths ────────────────────────────────────────────────────────────────────

const EMBLEMAI_DIR = path.join(os.homedir(), '.emblemai');
const ENV_PATH = path.join(EMBLEMAI_DIR, '.env');
const KEYS_PATH = path.join(EMBLEMAI_DIR, '.env.keys');
const SECRETS_PATH = path.join(EMBLEMAI_DIR, 'secrets.json');
const LEGACY_CRED_FILE = path.join(os.homedir(), '.emblem-vault');

// ── dotenvx Credential Storage ───────────────────────────────────────────────

/**
 * Read + decrypt a value from ~/.emblemai/.env using dotenvx.
 * Returns null if the file doesn't exist or the key isn't found.
 *
 * @param {string} key - Environment variable name (e.g. 'EMBLEM_PASSWORD')
 * @returns {string | null}
 */
export function getCredential(key) {
  if (!fs.existsSync(ENV_PATH)) return null;

  try {
    const envContent = fs.readFileSync(ENV_PATH, 'utf8');

    // Get private key for decryption
    let privateKey = null;
    if (fs.existsSync(KEYS_PATH)) {
      const keysContent = fs.readFileSync(KEYS_PATH, 'utf8');
      const match = keysContent.match(/DOTENV_PRIVATE_KEY\s*=\s*"?([^"\s]+)"?/);
      if (match) privateKey = match[1];
    }

    const parsed = privateKey
      ? dotenvx.parse(envContent, { privateKey })
      : dotenvx.parse(envContent);

    return parsed[key] || null;
  } catch {
    return null;
  }
}

/**
 * Encrypt + write a value to ~/.emblemai/.env via dotenvx.
 * Auto-creates the keypair on first call.
 *
 * @param {string} key - Environment variable name
 * @param {string} value - Value to encrypt and store
 */
export function setCredential(key, value) {
  fs.mkdirSync(EMBLEMAI_DIR, { recursive: true });
  if (!fs.existsSync(ENV_PATH)) {
    fs.writeFileSync(ENV_PATH, '', 'utf8');
  }

  // Suppress dotenvx stdout noise (banner, hints, etc.)
  const origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = () => true;
  try {
    dotenvx.set(key, value, { path: ENV_PATH });
  } finally {
    process.stdout.write = origWrite;
  }

  // Secure the keys file (contains the private decryption key)
  if (fs.existsSync(KEYS_PATH)) {
    fs.chmodSync(KEYS_PATH, 0o600);
  }
}

// ── Plugin Secrets (auth-sdk encrypted JSON) ─────────────────────────────────

/**
 * Read plugin secrets from ~/.emblemai/secrets.json.
 *
 * @returns {Record<string, { ciphertext: string, dataToEncryptHash: string }>}
 */
export function readPluginSecrets() {
  try {
    if (!fs.existsSync(SECRETS_PATH)) return {};
    const raw = fs.readFileSync(SECRETS_PATH, 'utf8').trim();
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Write plugin secrets to ~/.emblemai/secrets.json.
 *
 * @param {Record<string, { ciphertext: string, dataToEncryptHash: string }>} secrets
 */
export function writePluginSecrets(secrets) {
  fs.mkdirSync(EMBLEMAI_DIR, { recursive: true });
  fs.writeFileSync(SECRETS_PATH, JSON.stringify(secrets, null, 2) + '\n', 'utf8');
  fs.chmodSync(SECRETS_PATH, 0o600);
}

// ── Compatibility Wrappers ───────────────────────────────────────────────────

/**
 * Compatibility wrapper — reads password from dotenvx + secrets from JSON.
 * @returns {{ password?: string, secrets?: Record<string, object> } | null}
 */
export function readCredentialFile() {
  const password = getCredential('EMBLEM_PASSWORD');
  const secrets = readPluginSecrets();
  if (!password && Object.keys(secrets).length === 0) return null;
  return { password, secrets };
}

/**
 * Compatibility wrapper — routes password to dotenvx and secrets to JSON.
 * @param {Record<string, unknown>} data - Fields to merge (password, secrets)
 */
export function writeCredentialFile(data) {
  if (data.password) {
    setCredential('EMBLEM_PASSWORD', data.password);
  }
  if (data.secrets) {
    const existing = readPluginSecrets();
    writePluginSecrets({ ...existing, ...data.secrets });
  }
}

// ── Legacy Migration ─────────────────────────────────────────────────────────

/**
 * Migrate credentials from legacy ~/.emblem-vault to new dotenvx format.
 * Only runs if the old file exists AND ~/.emblemai/.env does NOT exist.
 * Backs up old file to ~/.emblem-vault.bak.
 */
export function migrateLegacyCredentials() {
  if (!fs.existsSync(LEGACY_CRED_FILE)) return;
  if (fs.existsSync(ENV_PATH)) return; // already migrated

  try {
    const raw = fs.readFileSync(LEGACY_CRED_FILE, 'utf8').trim();
    if (!raw) return;

    let password = null;
    let secrets = {};

    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        password = parsed.password;
        secrets = parsed.secrets || {};
      } catch {
        password = raw;
      }
    } else {
      password = raw;
    }

    if (password) {
      setCredential('EMBLEM_PASSWORD', password);
    }
    if (Object.keys(secrets).length > 0) {
      writePluginSecrets(secrets);
    }

    // Backup old file (never deleted)
    fs.renameSync(LEGACY_CRED_FILE, LEGACY_CRED_FILE + '.bak');
  } catch {
    // Migration failed — old file stays, user can retry next run
  }
}

// ── Password Prompt ──────────────────────────────────────────────────────────

/**
 * Prompt for a password with hidden input (shows * per character).
 * Falls back to plain text prompt when stdin is not a TTY.
 *
 * @param {string} question - Prompt text to display
 * @returns {Promise<string>} The entered password
 */
export function promptPassword(question) {
  if (process.stdin.isTTY) {
    process.stdout.write(question);
    return new Promise((resolve) => {
      let password = '';
      const onData = (char) => {
        char = char.toString();
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            process.stdin.removeListener('data', onData);
            process.stdin.setRawMode(false);
            process.stdout.write('\n');
            resolve(password);
            break;
          case '\u0003':
            process.stdout.write('\n');
            process.exit();
            break;
          case '\u007F':
            if (password.length > 0) {
              password = password.slice(0, -1);
              process.stdout.write('\b \b');
            }
            break;
          default:
            password += char;
            process.stdout.write('*');
        }
      };
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', onData);
    });
  }

  // Non-TTY fallback: plain readline prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ── Password Resolution ──────────────────────────────────────────────────────

/**
 * Get password from multiple sources in priority order:
 * 1. args.password (-p flag) — use it AND store encrypted
 * 2. process.env.EMBLEM_PASSWORD — use it (don't store)
 * 3. Encrypted credential file — getCredential('EMBLEM_PASSWORD')
 * 4. Agent mode, no password found — auto-generate, store encrypted
 * 5. Interactive prompt
 *
 * @param {{ password?: string, isAgentMode?: boolean }} args
 * @returns {Promise<string>} The resolved password
 */
export async function getPassword(args = {}) {
  // 1. Explicit argument — store encrypted
  if (args.password) {
    setCredential('EMBLEM_PASSWORD', args.password);
    return args.password;
  }

  // 2. Environment variable
  if (process.env.EMBLEM_PASSWORD) return process.env.EMBLEM_PASSWORD;

  // 3. Encrypted credential file
  const stored = getCredential('EMBLEM_PASSWORD');
  if (stored) return stored;

  // 4. Agent mode — auto-generate password
  if (args.isAgentMode) {
    const generated = crypto.randomBytes(32).toString('base64url');
    setCredential('EMBLEM_PASSWORD', generated);
    return generated;
  }

  // 5. Interactive prompt
  return promptPassword('Enter your EmblemVault password (min 16 chars): ');
}

// ── Authentication ───────────────────────────────────────────────────────────

/**
 * Authenticate with EmblemAuthSDK using a password.
 *
 * @param {string} password - The user's password
 * @param {{ authUrl?: string, apiUrl?: string }} config - Optional SDK config overrides
 * @returns {Promise<{ authSdk: object, session: object }>}
 */
export async function authenticate(password, config = {}) {
  const { EmblemAuthSDK } = await import('@emblemvault/auth-sdk');

  const sdkConfig = {
    appId: 'emblem-agent-wallet',
    persistSession: false,
  };
  if (config.authUrl) sdkConfig.authUrl = config.authUrl;
  if (config.apiUrl) sdkConfig.apiUrl = config.apiUrl;

  const authSdk = new EmblemAuthSDK(sdkConfig);
  const session = await authSdk.authenticatePassword({ password });

  if (!session) {
    throw new Error('Authentication failed');
  }

  return { authSdk, session };
}

// ── Browser Globals Polyfill ─────────────────────────────────────────────────

/**
 * Polyfill browser globals for Node.js environment.
 * The auth-sdk checks for window/document/localStorage even in non-browser contexts.
 */
export function polyfillBrowserGlobals() {
  if (typeof globalThis.window !== 'undefined') return;

  globalThis.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    location: {
      href: 'http://localhost',
      origin: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    navigator: { userAgent: 'Node.js' },
  };
  globalThis.document = {
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => ({}),
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  globalThis.localStorage = globalThis.window.localStorage;
  globalThis.sessionStorage = globalThis.window.sessionStorage;
}

// ── Authenticate with Existing Session ──────────────────────────────────────

/**
 * Create an SDK instance and hydrate it with an existing session.
 *
 * @param {object} session - A valid AuthSession object
 * @param {{ authUrl?: string, apiUrl?: string }} config
 * @returns {Promise<{ authSdk: object, session: object }>}
 */
export async function authenticateWithSession(session, config = {}) {
  const { EmblemAuthSDK } = await import('@emblemvault/auth-sdk');

  const sdkConfig = {
    appId: 'emblem-agent-wallet',
    persistSession: false,
  };
  if (config.authUrl) sdkConfig.authUrl = config.authUrl;
  if (config.apiUrl) sdkConfig.apiUrl = config.apiUrl;

  const authSdk = new EmblemAuthSDK(sdkConfig);
  authSdk.hydrateSession(session);

  return { authSdk, session };
}

// ── Web Login Flow ──────────────────────────────────────────────────────────

const WEB_LOGIN_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Orchestrate browser-based authentication for interactive mode.
 *
 * 1. Check for saved session → if valid, hydrate SDK and return
 * 2. If expired, clear it
 * 3. Start local auth server → open browser → wait for callback
 * 4. On success, save session and return { authSdk, session }
 * 5. On failure/timeout, return null (caller falls back to password)
 *
 * @param {{ authUrl?: string, apiUrl?: string }} config
 * @returns {Promise<{ authSdk: object, session: object } | null>}
 */
export async function webLogin(config = {}) {
  // 1. Check for saved session
  const existing = loadSession();

  if (existing) {
    if (!isSessionExpired(existing)) {
      // Valid session — hydrate SDK and return
      const result = await authenticateWithSession(existing, config);
      return { ...result, source: 'saved' };
    }
    // Expired — clear it
    clearSession();
  }

  // 2. Start local auth server and open browser
  return new Promise(async (resolve) => {
    let serverResult = null;
    let timeoutId = null;

    // Timeout after 5 minutes
    timeoutId = setTimeout(() => {
      if (serverResult) serverResult.close();
      resolve(null);
    }, WEB_LOGIN_TIMEOUT);

    try {
      serverResult = await startAuthServer(config, {
        onSession: async (session) => {
          if (timeoutId) clearTimeout(timeoutId);

          // Save session to disk
          saveSession(session);

          // Hydrate SDK
          try {
            const result = await authenticateWithSession(session, config);
            resolve({ ...result, source: 'browser' });
          } catch (err) {
            resolve(null);
          }
        },
        onError: (error) => {
          if (timeoutId) clearTimeout(timeoutId);
          if (serverResult) serverResult.close();
          resolve(null);
        },
      });

      // Try to open browser (uses execFile to prevent shell injection)
      const opened = await openBrowser(serverResult.url);

      if (!opened) {
        console.log(`\nOpen this URL in your browser to authenticate:\n  ${serverResult.url}\n`);
      }
    } catch {
      if (timeoutId) clearTimeout(timeoutId);
      if (serverResult) serverResult.close();
      resolve(null);
    }
  });
}

/**
 * Try to open a URL in the default browser.
 * Uses execFile (not exec) to prevent shell injection.
 *
 * @param {string} url
 * @returns {Promise<boolean>}
 */
function openBrowser(url) {
  return new Promise((resolve) => {
    const platform = process.platform;
    let cmd, args;

    if (platform === 'darwin') {
      cmd = 'open';
      args = [url];
    } else if (platform === 'win32') {
      cmd = 'cmd';
      args = ['/c', 'start', '', url];
    } else {
      cmd = 'xdg-open';
      args = [url];
    }

    execFile(cmd, args, (err) => {
      resolve(!err);
    });
  });
}

// ── Auth Menu ────────────────────────────────────────────────────────────────

/**
 * Interactive authentication menu.
 * Displays options for key/address retrieval, session management, and logout.
 *
 * @param {object} authSdk - Authenticated EmblemAuthSDK instance
 * @param {(question: string) => Promise<string>} promptFn - Function to prompt for user input
 */
export async function authMenu(authSdk, promptFn) {
  console.log('\n========================================');
  console.log('         Authentication Menu');
  console.log('========================================');
  console.log('');
  console.log('  1. Get API Key');
  console.log('  2. Get Vault Info');
  console.log('  3. Session Info');
  console.log('  4. Refresh Session');
  console.log('  5. EVM Address');
  console.log('  6. Solana Address');
  console.log('  7. BTC Addresses');
  console.log('  8. Backup Agent Auth');
  console.log('  9. Logout');
  console.log('  0. Back');
  console.log('');

  const choice = await promptFn('Select option (1-0): ');

  switch (choice.trim()) {
    case '1':
      await _getApiKey(authSdk);
      break;
    case '2':
      await _getVaultInfo(authSdk);
      break;
    case '3':
      _showSessionInfo(authSdk);
      break;
    case '4':
      await _refreshSession(authSdk);
      break;
    case '5':
      await _getEvmAddress(authSdk);
      break;
    case '6':
      await _getSolanaAddress(authSdk);
      break;
    case '7':
      await _getBtcAddresses(authSdk);
      break;
    case '8':
      await _backupAgentAuth(promptFn);
      break;
    case '9':
      _doLogout(authSdk);
      return 'logout'; // signal caller to exit
    case '0':
      return;
    default:
      console.log('Invalid option');
  }

  // Recurse back to menu after handling an option
  await authMenu(authSdk, promptFn);
}

// ---- Internal helpers ----

async function _getApiKey(authSdk) {
  console.log('\nFetching API key...');
  try {
    const apiKey = await authSdk.getVaultApiKey();
    console.log('\n========================================');
    console.log('           YOUR API KEY');
    console.log('========================================');
    console.log('');
    console.log(`  ${apiKey}`);
    console.log('');
    console.log('========================================');
    console.log('');
    console.log('IMPORTANT: Store this key securely!');
  } catch (error) {
    console.error('Error fetching API key:', error.message);
  }
}

async function _getVaultInfo(authSdk) {
  console.log('\nFetching vault info...');
  try {
    const vaultInfo = await authSdk.getVaultInfo();
    console.log('\n========================================');
    console.log('           VAULT INFO');
    console.log('========================================');
    console.log('');
    console.log(`  Vault ID:        ${vaultInfo.vaultId || 'N/A'}`);
    console.log(
      `  Token ID:        ${vaultInfo.tokenId || vaultInfo.vaultId || 'N/A'}`
    );
    console.log(`  EVM Address:     ${vaultInfo.evmAddress || 'N/A'}`);
    console.log(
      `  Solana Address:  ${vaultInfo.solanaAddress || vaultInfo.address || 'N/A'}`
    );
    console.log(`  Hedera Account:  ${vaultInfo.hederaAccountId || 'N/A'}`);
    if (vaultInfo.btcPubkey) {
      console.log(
        `  BTC Pubkey:      ${vaultInfo.btcPubkey.substring(0, 20)}...`
      );
    }
    if (vaultInfo.btcAddresses) {
      console.log('  BTC Addresses:');
      if (vaultInfo.btcAddresses.p2pkh)
        console.log(`    P2PKH:         ${vaultInfo.btcAddresses.p2pkh}`);
      if (vaultInfo.btcAddresses.p2wpkh)
        console.log(`    P2WPKH:        ${vaultInfo.btcAddresses.p2wpkh}`);
      if (vaultInfo.btcAddresses.p2tr)
        console.log(`    P2TR:          ${vaultInfo.btcAddresses.p2tr}`);
    }
    if (vaultInfo.createdAt)
      console.log(`  Created At:      ${vaultInfo.createdAt}`);
    console.log('');
    console.log('========================================');
  } catch (error) {
    console.error('Error fetching vault info:', error.message);
  }
}

function _showSessionInfo(authSdk) {
  const sess = authSdk.getSession();
  console.log('\n========================================');
  console.log('           SESSION INFO');
  console.log('========================================');
  console.log('');
  if (sess) {
    console.log(`  Identifier:   ${sess.user?.identifier || 'N/A'}`);
    console.log(`  Vault ID:     ${sess.user?.vaultId || 'N/A'}`);
    console.log(`  App ID:       ${sess.appId || 'N/A'}`);
    console.log(`  Auth Type:    ${sess.authType || 'N/A'}`);
    console.log(
      `  Expires At:   ${sess.expiresAt ? new Date(sess.expiresAt).toISOString() : 'N/A'}`
    );
    console.log(
      `  Auth Token:   ${sess.authToken ? sess.authToken.substring(0, 20) + '...' : 'N/A'}`
    );
  } else {
    console.log('  No active session');
  }
  console.log('');
  console.log('========================================');
}

async function _refreshSession(authSdk) {
  console.log('\nRefreshing session...');
  try {
    const newSession = await authSdk.refreshSession();
    if (newSession) {
      console.log('Session refreshed successfully!');
      console.log(
        `New expiry: ${new Date(newSession.expiresAt).toISOString()}`
      );
    } else {
      console.log('Failed to refresh session.');
    }
  } catch (error) {
    console.error('Error refreshing session:', error.message);
  }
}

async function _getEvmAddress(authSdk) {
  console.log('\nFetching EVM address...');
  try {
    const vaultInfo = await authSdk.getVaultInfo();
    if (vaultInfo.evmAddress) {
      console.log('\n========================================');
      console.log('           EVM ADDRESS');
      console.log('========================================');
      console.log('');
      console.log(`  ${vaultInfo.evmAddress}`);
      console.log('');
      console.log('========================================');
    } else {
      console.log('No EVM address available for this vault.');
    }
  } catch (error) {
    console.error('Error fetching EVM address:', error.message);
  }
}

async function _getSolanaAddress(authSdk) {
  console.log('\nFetching Solana address...');
  try {
    const vaultInfo = await authSdk.getVaultInfo();
    const solanaAddr = vaultInfo.solanaAddress || vaultInfo.address;
    if (solanaAddr) {
      console.log('\n========================================');
      console.log('         SOLANA ADDRESS');
      console.log('========================================');
      console.log('');
      console.log(`  ${solanaAddr}`);
      console.log('');
      console.log('========================================');
    } else {
      console.log('No Solana address available for this vault.');
    }
  } catch (error) {
    console.error('Error fetching Solana address:', error.message);
  }
}

async function _getBtcAddresses(authSdk) {
  console.log('\nFetching BTC addresses...');
  try {
    const vaultInfo = await authSdk.getVaultInfo();
    if (vaultInfo.btcAddresses || vaultInfo.btcPubkey) {
      console.log('\n========================================');
      console.log('         BTC ADDRESSES');
      console.log('========================================');
      console.log('');
      if (vaultInfo.btcPubkey) {
        console.log(`  Pubkey:  ${vaultInfo.btcPubkey}`);
        console.log('');
      }
      if (vaultInfo.btcAddresses) {
        if (vaultInfo.btcAddresses.p2pkh)
          console.log(
            `  P2PKH (Legacy):     ${vaultInfo.btcAddresses.p2pkh}`
          );
        if (vaultInfo.btcAddresses.p2wpkh)
          console.log(
            `  P2WPKH (SegWit):    ${vaultInfo.btcAddresses.p2wpkh}`
          );
        if (vaultInfo.btcAddresses.p2tr)
          console.log(
            `  P2TR (Taproot):     ${vaultInfo.btcAddresses.p2tr}`
          );
      }
      console.log('');
      console.log('========================================');
    } else {
      console.log('No BTC addresses available for this vault.');
    }
  } catch (error) {
    console.error('Error fetching BTC addresses:', error.message);
  }
}

async function _backupAgentAuth(promptFn) {
  console.log('\n========================================');
  console.log('        BACKUP AGENT AUTH');
  console.log('========================================');
  console.log('');

  // Check that both files exist
  if (!fs.existsSync(ENV_PATH)) {
    console.log('  No agent credentials found (.env missing).');
    console.log('  Agent auth is created on first agent-mode run.');
    return;
  }
  if (!fs.existsSync(KEYS_PATH)) {
    console.log('  No encryption keys found (.env.keys missing).');
    console.log('  Cannot backup without the decryption key.');
    return;
  }

  // Read both files
  const envContent = fs.readFileSync(ENV_PATH, 'utf8');
  const keysContent = fs.readFileSync(KEYS_PATH, 'utf8');

  // Default backup path
  const defaultPath = path.join(os.homedir(), 'emblemai-auth-backup.json');
  const input = await promptFn(`Backup path [${defaultPath}]: `);
  const backupPath = input.trim() || defaultPath;

  try {
    const backup = {
      _warning: 'This file contains your EmblemVault password. Keep it secure.',
      exportedAt: new Date().toISOString(),
      env: envContent,
      envKeys: keysContent,
    };

    // Also include secrets if they exist
    if (fs.existsSync(SECRETS_PATH)) {
      backup.secrets = fs.readFileSync(SECRETS_PATH, 'utf8');
    }

    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), { mode: 0o600 });

    console.log('');
    console.log('  Saved to:');
    console.log(`  ${backupPath}`);
    console.log('');
    console.log('  This file contains your EmblemVault password.');
    console.log('  Keep it safe — anyone with it can access your vault.');
    console.log('');
    console.log('  To restore on another machine, copy the backup file');
    console.log('  and run: emblemai --restore-auth <path>');
    console.log('');
    console.log('========================================');
  } catch (error) {
    console.error(`  Error writing backup: ${error.message}`);
  }
}

function _doLogout(authSdk) {
  console.log('\nLogging out...');
  try {
    authSdk.logout();
    clearSession(); // Also clear saved web session
    console.log('Logged out successfully.');
    console.log('Session cleared.');
  } catch (error) {
    console.error('Error during logout:', error.message);
  }
}

export { clearSession } from './session-store.js';

export default {
  getPassword, authenticate, authenticateWithSession, promptPassword, authMenu,
  webLogin, polyfillBrowserGlobals,
  getCredential, setCredential, readPluginSecrets, writePluginSecrets,
  readCredentialFile, writeCredentialFile, migrateLegacyCredentials,
};
