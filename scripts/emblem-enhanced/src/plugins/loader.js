/**
 * Plugin Registration and Management
 * Loads built-in protocol plugins and user-installed custom plugins.
 * ESM module — requires Node.js >= 18.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

const CUSTOM_PLUGINS_FILE = path.join(os.homedir(), '.emblemai-plugins.json');

/** Valid plugin name: lowercase, starts with letter, allows hyphens/digits */
const PLUGIN_NAME_RE = /^[a-z][a-z0-9-]{0,63}$/;

/**
 * Manages HustlePlugin lifecycle — loading, enabling, disabling, and persistence.
 */
export class PluginManager {
  /**
   * @param {import('hustle-incognito').HustleIncognitoClient} client
   */
  constructor(client) {
    this.client = client;
    /** @type {Map<string, { plugin: object, enabled: boolean, toolCount: number }>} */
    this.plugins = new Map();
    /** Cache of decrypted secret values (secretName → plaintext) — survives plugin reloads */
    this._resolvedSecrets = {};
  }

  /**
   * Load all available protocol plugins.
   * Missing packages are silently skipped.
   * @param {Record<string, object>} config - Per-plugin config keyed by configKey
   * @param {{ authSdk?: object, credentials?: object }} opts - Optional auth + credential context
   */
  async loadAll(config = {}, opts = {}) {
    this._pluginSpecs = [
      { mod: '@agenthustle/plugin-masq',      factory: 'createElizaOSPlugin',  configKey: 'elizaos' },
      // { mod: '@agenthustle/plugin-a2a',      factory: 'createA2APlugin',      configKey: 'a2a' },
      // { mod: '@agenthustle/plugin-acp',      factory: 'createACPPlugin',      configKey: 'acp' },
      // { mod: '@agenthustle/plugin-bridge',   factory: 'createBridgePlugin',   configKey: 'bridge' },
    ];
    this._config = config;
    this._opts = opts;

    for (const spec of this._pluginSpecs) {
      try {
        const mod = await import(spec.mod);
        const factory = mod[spec.factory];
        if (typeof factory !== 'function') continue;
        const pluginConfig = { ...config[spec.configKey] };
        // Wire up the authenticated client for inverse control
        // (ElizaOS, A2A, ACP all use hustleClient.chat() for real tool execution)
        if (this.client && !pluginConfig.hustleClient) {
          pluginConfig.hustleClient = this.client;
        }
        // Auto-enable MASQ for ElizaOS so the HTTP server starts
        if (spec.configKey === 'elizaos' && !pluginConfig.masq) {
          pluginConfig.masq = { enabled: true, port: 3001 };
        }
        // Enable inverse discovery — discover ElizaOS actions and register as clientTools
        if (spec.configKey === 'elizaos' && !pluginConfig.inverseDiscovery) {
          pluginConfig.inverseDiscovery = {
            enabled: true,
            elizaUrl: process.env.ELIZA_URL || 'http://localhost:3000',
          };
        }

        // Check for encrypted secrets — defer decryption to first tool use (lazy loading)
        const modSecrets = mod.secrets || mod.SECRETS || [];
        const pendingSecrets = [];
        if (modSecrets.length > 0 && opts.authSdk && opts.credentials?.secrets) {
          for (const sd of modSecrets) {
            if (this._resolvedSecrets[sd.name]) {
              // Already decrypted in a previous session or via /secrets — inject immediately
              this._setConfigPath(pluginConfig, sd.configPath, this._resolvedSecrets[sd.name]);
            } else if (opts.credentials.secrets?.[sd.name]?.ciphertext) {
              pendingSecrets.push(sd);
            }
          }
        }

        const plugin = factory(pluginConfig);
        await this.register(plugin);

        // Wrap executors for lazy secret decryption on first tool use
        if (pendingSecrets.length > 0) {
          this._wrapForLazySecrets(plugin, spec, pendingSecrets);
        }
      } catch {
        // Plugin package not installed — skip
      }
    }

    // Restore user-installed custom plugins from disk
    await this._loadCustomPlugins();
  }

  /**
   * Wrap a plugin's tool executors with lazy secret decryption.
   * On first tool call, decrypts all pending secrets, reloads the plugin
   * with proper config, and delegates to the new real executor.
   * Subsequent calls (after reload) go straight to the real executor.
   *
   * @param {object} plugin - The registered plugin (executors will be mutated)
   * @param {object} spec - Plugin spec from _pluginSpecs
   * @param {Array<{ name: string, configPath: string, label: string }>} pendingSecrets
   * @private
   */
  _wrapForLazySecrets(plugin, spec, pendingSecrets) {
    const pm = this;
    let resolved = false;

    if (!plugin.executors) plugin.executors = {};

    for (const tool of plugin.tools || []) {
      const origExecutor = plugin.executors[tool.name];

      plugin.executors[tool.name] = async function lazySecretResolver(args) {
        if (!resolved) {
          resolved = true;
          const secretNames = pendingSecrets.map(s => s.label || s.name).join(', ');
          console.log(chalk.dim(`  [secrets] Decrypting ${secretNames} for ${plugin.name}...`));

          const ok = await pm._lazyResolveSecrets(plugin.name, spec, pendingSecrets);
          if (ok) {
            console.log(chalk.dim(`  [secrets] ${plugin.name} reloaded with secrets — executing ${tool.name}`));
            // Plugin was reloaded — delegate to the new real executor
            const entry = pm.plugins.get(plugin.name);
            if (entry?.plugin?.executors?.[tool.name]) {
              return entry.plugin.executors[tool.name](args);
            }
          }

          // Decryption failed — try original executor anyway (will likely error)
          console.log(chalk.dim(`  [secrets] Decryption failed — trying ${tool.name} without secrets`));
          if (origExecutor) return origExecutor(args);
          return { error: `Tool "${tool.name}" requires secrets that could not be decrypted.` };
        }

        // Already resolved but still using old plugin ref (shouldn't normally reach here
        // because after reload the client has the new plugin's executors)
        if (origExecutor) return origExecutor(args);
      };
    }
  }

  /**
   * Decrypt all pending secrets for a plugin, rebuild config, and reload.
   *
   * @param {string} pluginName - Current plugin name
   * @param {object} spec - Plugin spec ({ mod, factory, configKey })
   * @param {Array<{ name: string, configPath: string }>} pendingSecrets
   * @returns {Promise<boolean>} Whether reload succeeded
   * @private
   */
  async _lazyResolveSecrets(pluginName, spec, pendingSecrets) {
    const opts = this._opts;
    if (!opts?.authSdk || !opts?.credentials?.secrets) return false;

    try {
      // Build fresh config
      const pluginConfig = { ...(this._config?.[spec.configKey] || {}) };
      if (this.client && !pluginConfig.hustleClient) {
        pluginConfig.hustleClient = this.client;
      }
      if (spec.configKey === 'elizaos' && !pluginConfig.masq) {
        pluginConfig.masq = { enabled: true, port: 3001 };
      }

      const { decrypt } = await import('@emblemvault/auth-sdk/crypto');

      for (const sd of pendingSecrets) {
        // Check in-memory cache first
        if (this._resolvedSecrets[sd.name]) {
          this._setConfigPath(pluginConfig, sd.configPath, this._resolvedSecrets[sd.name]);
          continue;
        }

        const stored = opts.credentials.secrets[sd.name];
        if (!stored?.ciphertext) continue;

        const plaintext = await decrypt({
          config: { sdk: opts.authSdk },
          ciphertext: stored.ciphertext,
          dataToEncryptHash: stored.dataToEncryptHash,
        });

        // Cache in memory — never decrypt this again
        this._resolvedSecrets[sd.name] = plaintext;
        this._setConfigPath(pluginConfig, sd.configPath, plaintext);
      }

      // Unregister old plugin (with wrapped executors), create & register new one
      await this.unregister(pluginName);
      const mod = await import(spec.mod);
      const factory = mod[spec.factory];
      if (typeof factory !== 'function') return false;
      const newPlugin = factory(pluginConfig);
      await this.register(newPlugin);
      return true;
    } catch (err) {
      console.log(chalk.dim(`  [secrets] Error: ${err.message}`));
      return false;
    }
  }

  /**
   * Set a value at a dot-path in a config object.
   * e.g. _setConfigPath(cfg, 'api.apiKey', 'xyz') → cfg.api.apiKey = 'xyz'
   * @private
   */
  _setConfigPath(config, dotPath, value) {
    const parts = dotPath.split('.');
    let target = config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]] || typeof target[parts[i]] !== 'object') {
        target[parts[i]] = {};
      }
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;
  }

  /**
   * Hot-reload a plugin with a secret value injected into its config.
   * Called after /secrets set so the user doesn't need to restart.
   *
   * @param {string} pluginName - The plugin name (e.g. "hustle-elizaos")
   * @param {string} secretName - The secret name (e.g. "myApiKey")
   * @param {string} plaintext - The decrypted/raw secret value
   * @returns {Promise<boolean>} Whether the reload succeeded
   */
  async reloadPluginWithSecret(pluginName, secretName, plaintext) {
    if (!this._pluginSpecs) return false;

    // Cache the resolved secret so lazy loaders don't re-decrypt
    this._resolvedSecrets[secretName] = plaintext;

    // Find the spec that produces this plugin
    for (const spec of this._pluginSpecs) {
      try {
        const mod = await import(spec.mod);
        const modSecrets = mod.secrets || mod.SECRETS || [];
        const secretDecl = modSecrets.find(s => s.name === secretName);
        if (!secretDecl) continue;

        // Build fresh config with secret injected (+ any other resolved secrets)
        const pluginConfig = { ...(this._config?.[spec.configKey] || {}) };
        if (this.client && !pluginConfig.hustleClient) {
          pluginConfig.hustleClient = this.client;
        }
        if (spec.configKey === 'elizaos' && !pluginConfig.masq) {
          pluginConfig.masq = { enabled: true, port: 3001 };
        }

        // Inject all resolved secrets for this plugin (not just the one being set)
        for (const sd of modSecrets) {
          if (this._resolvedSecrets[sd.name]) {
            this._setConfigPath(pluginConfig, sd.configPath, this._resolvedSecrets[sd.name]);
          }
        }

        // Unregister old, create new
        await this.unregister(pluginName);
        const factory = mod[spec.factory];
        if (typeof factory !== 'function') return false;
        const plugin = factory(pluginConfig);
        await this.register(plugin);
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  /**
   * Register a plugin with the client.
   * @param {object} plugin - HustlePlugin-shaped object
   * @param {boolean} enabled - Whether to activate immediately
   */
  async register(plugin, enabled = true) {
    if (!plugin || !plugin.name) return;

    if (enabled) {
      try {
        await this.client.use(plugin);
      } catch {
        // Client rejected — still track it as disabled
        enabled = false;
      }
    }

    this.plugins.set(plugin.name, {
      plugin,
      enabled,
      toolCount: Array.isArray(plugin.tools) ? plugin.tools.length : 0,
    });
  }

  /**
   * Completely remove a plugin.
   * @param {string} name
   */
  async unregister(name) {
    const entry = this.plugins.get(name);
    if (!entry) return;

    if (entry.enabled) {
      try { await this.client.unuse(name); } catch {}
    }
    this.plugins.delete(name);
  }

  /**
   * Enable a previously disabled plugin.
   * @param {string} name
   * @returns {boolean} Whether the operation succeeded
   */
  async enable(name) {
    const entry = this.plugins.get(name);
    if (!entry) return false;
    if (entry.enabled) return true;

    try {
      await this.client.use(entry.plugin);
      entry.enabled = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Disable a plugin without removing it.
   * @param {string} name
   * @returns {boolean} Whether the operation succeeded
   */
  async disable(name) {
    const entry = this.plugins.get(name);
    if (!entry) return false;
    if (!entry.enabled) return true;

    try {
      await this.client.unuse(name);
    } catch {
      // Best-effort
    }
    entry.enabled = false;
    return true;
  }

  /**
   * List all registered plugins with summary info.
   * @returns {Array<{ name: string, version: string, enabled: boolean, toolCount: number }>}
   */
  list() {
    return Array.from(this.plugins.entries())
      .filter(([name]) => !name.startsWith('_'))
      .map(([name, entry]) => ({
        name,
        version: entry.plugin.version || '0.0.0',
        enabled: entry.enabled,
        toolCount: entry.toolCount,
      }));
  }

  /**
   * Collect all tools from enabled plugins.
   * @returns {Array<{ name: string, description: string, plugin: string }>}
   */
  getTools() {
    const tools = [];
    for (const [name, entry] of this.plugins) {
      if (name.startsWith('_')) continue;
      if (!entry.enabled || !Array.isArray(entry.plugin.tools)) continue;
      for (const tool of entry.plugin.tools) {
        tools.push({
          name: tool.name,
          description: tool.description || '',
          plugin: entry.plugin.name,
        });
      }
    }
    return tools;
  }

  /**
   * Collect all secret declarations from all loaded plugins.
   * @returns {Array<{ plugin: string, name: string, label: string, configPath: string }>}
   */
  getPluginSecrets() {
    const result = [];
    for (const [name, entry] of this.plugins) {
      if (Array.isArray(entry.plugin.secrets)) {
        for (const s of entry.plugin.secrets) {
          result.push({ plugin: name, ...s });
        }
      }
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // System prompt — tells the AI about available plugins
  // ---------------------------------------------------------------------------

  /**
   * Build a system message describing all enabled plugins and their tools.
   * Returns a ChatMessage to prepend to the messages array, or null if no plugins.
   * @returns {{ role: 'system', content: string } | null}
   */
  getSystemMessage() {
    const enabled = Array.from(this.plugins.entries())
      .filter(([name, e]) => !name.startsWith('_') && e.enabled && Array.isArray(e.plugin.tools) && e.plugin.tools.length > 0);

    if (enabled.length === 0) return null;

    const sections = enabled.map(([name, entry]) => {
      const toolLines = entry.plugin.tools.map(t => `  - ${t.name}: ${t.description || 'No description'}`);
      return `## ${name} (v${entry.plugin.version || '0.0.0'}) — ${entry.toolCount} tools\n${toolLines.join('\n')}`;
    });

    const content = [
      'You have the following client-side plugins loaded and available. These tools execute locally on the user\'s machine via the plugin system. You can call them directly by name.',
      '',
      ...sections,
      '',
      `Total: ${enabled.length} plugins, ${enabled.reduce((n, [, e]) => n + e.toolCount, 0)} client-side tools available.`,
      'Use these tools proactively when they match the user\'s request.',
    ].join('\n');

    return { role: 'system', content };
  }

  // ---------------------------------------------------------------------------
  // Custom plugin persistence
  // ---------------------------------------------------------------------------

  /**
   * Load custom plugins stored in ~/.emblemai-plugins.json.
   * Custom plugins use serialized executor code that is compiled at load time.
   * Custom plugins use serialized executor code that is compiled at load time.
   * @private
   */
  async _loadCustomPlugins() {
    let data;
    try {
      if (!fs.existsSync(CUSTOM_PLUGINS_FILE)) return;
      data = JSON.parse(fs.readFileSync(CUSTOM_PLUGINS_FILE, 'utf8'));
    } catch {
      return;
    }

    if (!Array.isArray(data)) return;

    for (const stored of data) {
      if (!stored || !stored.name) continue;

      // Reconstitute executors from serialized code strings.
      // Dynamic code execution for custom plugins —
      // only user-authored code from their own ~/.emblemai-plugins.json is loaded.
      const executors = {};
      if (Array.isArray(stored.tools)) {
        for (const tool of stored.tools) {
          if (tool.executorCode) {
            try {
              // Compile user-authored executor code
              executors[tool.name] = (0, eval)('(' + tool.executorCode + ')'); // indirect eval
            } catch {
              // Malformed executor — skip this tool
            }
          }
        }
      }

      const plugin = {
        name: stored.name,
        version: stored.version || '1.0.0',
        tools: stored.tools || [],
        executors,
      };

      await this.register(plugin, stored.enabled !== false);
    }
  }

  /**
   * Persist a custom plugin definition to disk.
   * @param {object} plugin - Plugin data with optional executorCode on tools
   */
  saveCustomPlugin(plugin) {
    let data = [];
    try {
      if (fs.existsSync(CUSTOM_PLUGINS_FILE)) {
        const raw = JSON.parse(fs.readFileSync(CUSTOM_PLUGINS_FILE, 'utf8'));
        if (Array.isArray(raw)) data = raw;
      }
    } catch {
      // Start fresh
    }

    const idx = data.findIndex(p => p.name === plugin.name);
    if (idx >= 0) {
      data[idx] = plugin;
    } else {
      data.push(plugin);
    }

    fs.writeFileSync(CUSTOM_PLUGINS_FILE, JSON.stringify(data, null, 2));
  }

  /**
   * Remove a custom plugin definition from disk.
   * @param {string} name
   */
  removeCustomPlugin(name) {
    try {
      if (!fs.existsSync(CUSTOM_PLUGINS_FILE)) return;
      let data = JSON.parse(fs.readFileSync(CUSTOM_PLUGINS_FILE, 'utf8'));
      if (!Array.isArray(data)) return;
      data = data.filter(p => p.name !== name);
      fs.writeFileSync(CUSTOM_PLUGINS_FILE, JSON.stringify(data, null, 2));
    } catch {
      // Best-effort
    }
  }
}

export { PLUGIN_NAME_RE };
