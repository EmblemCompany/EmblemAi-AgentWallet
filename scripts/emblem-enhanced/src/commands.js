/**
 * commands.js — Slash command router for Emblem Enhanced TUI
 *
 * Handles all /commands in both TUI and simple-readline modes.
 * Each command receives a context object with the full runtime state.
 */

import chalk from 'chalk';

// ============================================================================
// Command Registry (for /help display)
// ============================================================================

export const COMMANDS = [
  { cmd: '/help', desc: 'Show all commands' },
  { cmd: '/plugins', desc: 'List all plugins with status' },
  { cmd: '/plugin <name> on|off', desc: 'Toggle plugin' },
  { cmd: '/tools', desc: 'List available tools' },
  { cmd: '/tools add|remove <id>', desc: 'Manage tools' },
  { cmd: '/tools clear', desc: 'Enable auto-tools mode' },
  { cmd: '/auth', desc: 'Authentication menu' },
  { cmd: '/wallet', desc: 'Show wallet info' },
  { cmd: '/portfolio', desc: 'Show portfolio' },
  { cmd: '/settings', desc: 'Show current settings' },
  { cmd: '/model <id>', desc: 'Set model (or "clear")' },
  { cmd: '/stream on|off', desc: 'Toggle streaming' },
  { cmd: '/debug on|off', desc: 'Toggle debug mode' },
  { cmd: '/history on|off', desc: 'Toggle history' },
  { cmd: '/payment', desc: 'PAYG billing status' },
  { cmd: '/payment enable|disable', desc: 'Toggle PAYG' },
  { cmd: '/payment token <T>', desc: 'Set payment token' },
  { cmd: '/payment mode <M>', desc: 'Set payment mode' },
{ cmd: '/secrets', desc: 'Manage encrypted plugin secrets' },
  { cmd: '/glow on|off', desc: 'Toggle markdown rendering' },
  { cmd: '/log on|off', desc: 'Toggle stream logging to file' },
  { cmd: '/reset', desc: 'Clear conversation' },
  { cmd: '/exit', desc: 'Exit' },
];

// ============================================================================
// Command Handlers
// ============================================================================

function cmdHelp(ctx) {
  const maxCmd = Math.max(...COMMANDS.map(c => c.cmd.length));
  const lines = COMMANDS.map(c => {
    const padded = c.cmd.padEnd(maxCmd + 2);
    return `  ${chalk.cyan(padded)} ${chalk.dim(c.desc)}`;
  });
  const header = chalk.bold.white('Available Commands');
  const text = `\n${header}\n${chalk.dim('─'.repeat(maxCmd + 30))}\n${lines.join('\n')}\n`;
  ctx.appendMessage('system', text);
  return { handled: true };
}

function cmdPlugins(ctx) {
  const plugins = ctx.pluginManager.list();
  if (!plugins || plugins.length === 0) {
    ctx.appendMessage('system', chalk.dim('No plugins registered.'));
    return { handled: true };
  }
  const lines = plugins.map(p => {
    const icon = p.enabled ? chalk.green('\u2611') : chalk.dim('\u2610');
    const name = p.enabled ? chalk.white(p.name) : chalk.dim(p.name);
    const ver = chalk.dim(`v${p.version}`);
    const tools = chalk.dim(`(${p.toolCount} tools)`);
    return `  ${icon} ${name} ${ver} ${tools}`;
  });
  const header = chalk.bold.white('Plugins');
  ctx.appendMessage('system', `\n${header}\n${lines.join('\n')}\n`);
  return { handled: true };
}

function cmdPlugin(args, ctx) {
  const parts = args.trim().split(/\s+/);
  if (parts.length < 2) {
    ctx.appendMessage('system', chalk.yellow('Usage: /plugin <name> on|off'));
    return { handled: true };
  }
  const name = parts[0];
  const action = parts[1].toLowerCase();

  if (action === 'on') {
    const ok = ctx.pluginManager.enable(name);
    if (ok) {
      ctx.appendMessage('system', chalk.green(`Plugin "${name}" enabled.`));
      ctx.addLog('plugin', `Enabled ${name}`);
    } else {
      ctx.appendMessage('system', chalk.red(`Plugin "${name}" not found.`));
    }
  } else if (action === 'off') {
    const ok = ctx.pluginManager.disable(name);
    if (ok) {
      ctx.appendMessage('system', chalk.yellow(`Plugin "${name}" disabled.`));
      ctx.addLog('plugin', `Disabled ${name}`);
    } else {
      ctx.appendMessage('system', chalk.red(`Plugin "${name}" not found.`));
    }
  } else {
    ctx.appendMessage('system', chalk.yellow('Usage: /plugin <name> on|off'));
    return { handled: true };
  }

  ctx.updateSidebar();
  return { handled: true };
}

async function cmdTools(args, ctx) {
  const parts = args.trim().split(/\s+/).filter(Boolean);

  // /tools — list all
  if (parts.length === 0) {
    try {
      let tools;
      if (ctx.client && typeof ctx.client.getTools === 'function') {
        tools = await ctx.client.getTools();
      } else {
        tools = ctx.pluginManager.getTools();
      }
      if (!tools || tools.length === 0) {
        ctx.appendMessage('system', chalk.dim('No tools available.'));
        return { handled: true };
      }
      const lines = tools.map(t => {
        const id = t.id || t.name || 'unknown';
        const isSelected = ctx.settings.selectedTools.includes(id);
        const icon = isSelected ? chalk.green('[x]') : chalk.dim('[ ]');
        const title = t.title || t.name || id;
        const desc = t.description ? chalk.dim(` — ${t.description}`) : '';
        return `  ${icon} ${chalk.white(title)} ${chalk.dim(`(${id})`)}${desc}`;
      });
      const mode = ctx.settings.selectedTools.length > 0
        ? chalk.cyan(ctx.settings.selectedTools.join(', '))
        : chalk.dim('Auto-tools mode');
      const header = chalk.bold.white('Tools');
      ctx.appendMessage('system', `\n${header}\n${lines.join('\n')}\n\n  ${chalk.dim('Selected:')} ${mode}\n`);
    } catch (err) {
      ctx.appendMessage('system', chalk.red(`Error fetching tools: ${err.message}`));
    }
    return { handled: true };
  }

  const sub = parts[0];
  const toolId = parts[1];

  // /tools clear
  if (sub === 'clear') {
    ctx.settings.selectedTools = [];
    ctx.appendMessage('system', chalk.green('Auto-tools mode enabled.'));
    ctx.addLog('tools', 'Cleared tool selection');
    return { handled: true };
  }

  // /tools add <id>
  if (sub === 'add' && toolId) {
    if (!ctx.settings.selectedTools.includes(toolId)) {
      ctx.settings.selectedTools.push(toolId);
      ctx.appendMessage('system', chalk.green(`Added tool: ${toolId}`));
      ctx.addLog('tools', `Added ${toolId}`);
    } else {
      ctx.appendMessage('system', chalk.yellow(`Already selected: ${toolId}`));
    }
    return { handled: true };
  }

  // /tools remove <id>
  if (sub === 'remove' && toolId) {
    const idx = ctx.settings.selectedTools.indexOf(toolId);
    if (idx > -1) {
      ctx.settings.selectedTools.splice(idx, 1);
      ctx.appendMessage('system', chalk.green(`Removed tool: ${toolId}`));
      ctx.addLog('tools', `Removed ${toolId}`);
    } else {
      ctx.appendMessage('system', chalk.yellow(`Not found: ${toolId}`));
    }
    return { handled: true };
  }

  ctx.appendMessage('system', chalk.yellow('Usage: /tools [add|remove <id>|clear]'));
  return { handled: true };
}

async function cmdAuth(ctx) {
  // In TUI mode, show auth summary in chat panel
  if (ctx.tui) {
    try {
      const sess = ctx.authSdk.getSession();
      const lines = [
        chalk.bold.white('Authentication Info'),
        '',
        `  ${chalk.dim('Vault ID:')}    ${sess?.user?.vaultId || 'N/A'}`,
        `  ${chalk.dim('Auth Type:')}   ${sess?.authType || 'Password'}`,
        `  ${chalk.dim('App ID:')}      ${sess?.appId || 'emblem-agent-wallet'}`,
        `  ${chalk.dim('Expires:')}     ${sess?.expiresAt ? new Date(sess.expiresAt).toISOString() : 'N/A'}`,
        '',
        chalk.dim('Use /wallet for address info'),
      ];
      ctx.appendMessage('system', lines.join('\n'));
    } catch (err) {
      ctx.appendMessage('system', chalk.red(`Auth error: ${err.message}`));
    }
    return { handled: true };
  }

  // Simple mode — import and run the interactive auth menu
  try {
    const { authMenu } = await import('./auth.js');
    const result = await authMenu(ctx.authSdk, ctx.promptText);
    if (result === 'logout') {
      return { handled: true, logout: true };
    }
  } catch (err) {
    ctx.appendMessage('system', chalk.red(`Auth menu error: ${err.message}`));
  }
  return { handled: true };
}

async function cmdWallet(ctx) {
  try {
    const vaultInfo = await ctx.authSdk.getVaultInfo();
    const lines = [
      chalk.bold.white('Wallet Info'),
      '',
      `  ${chalk.dim('Vault ID:')}       ${vaultInfo.vaultId || 'N/A'}`,
      `  ${chalk.dim('Token ID:')}       ${vaultInfo.tokenId || vaultInfo.vaultId || 'N/A'}`,
    ];
    if (vaultInfo.evmAddress) {
      lines.push(`  ${chalk.dim('EVM Address:')}    ${chalk.white(vaultInfo.evmAddress)}`);
    }
    const solAddr = vaultInfo.solanaAddress || vaultInfo.address;
    if (solAddr) {
      lines.push(`  ${chalk.dim('Solana Address:')} ${chalk.white(solAddr)}`);
    }
    if (vaultInfo.hederaAccountId) {
      lines.push(`  ${chalk.dim('Hedera Account:')} ${chalk.white(vaultInfo.hederaAccountId)}`);
    }
    if (vaultInfo.btcAddresses) {
      lines.push(`  ${chalk.dim('BTC Addresses:')}`);
      if (vaultInfo.btcAddresses.p2pkh)
        lines.push(`    ${chalk.dim('P2PKH:')}   ${vaultInfo.btcAddresses.p2pkh}`);
      if (vaultInfo.btcAddresses.p2wpkh)
        lines.push(`    ${chalk.dim('P2WPKH:')}  ${vaultInfo.btcAddresses.p2wpkh}`);
      if (vaultInfo.btcAddresses.p2tr)
        lines.push(`    ${chalk.dim('P2TR:')}    ${vaultInfo.btcAddresses.p2tr}`);
    }
    if (vaultInfo.createdAt) {
      lines.push(`  ${chalk.dim('Created:')}        ${vaultInfo.createdAt}`);
    }
    lines.push('');
    ctx.appendMessage('system', lines.join('\n'));
    ctx.addLog('wallet', 'Displayed wallet info');
  } catch (err) {
    ctx.appendMessage('system', chalk.red(`Wallet error: ${err.message}`));
  }
  return { handled: true };
}

function cmdPortfolio() {
  // Return handled:false so the main loop sends "show my portfolio" as a chat message
  return { handled: false };
}

function cmdSettings(ctx) {
  const sess = ctx.authSdk.getSession();
  const lines = [
    chalk.bold.white('Current Settings'),
    '',
    `  ${chalk.dim('App ID:')}       emblem-agent-wallet`,
    `  ${chalk.dim('Vault ID:')}     ${sess?.user?.vaultId || 'N/A'}`,
    `  ${chalk.dim('Auth Mode:')}    Password (headless)`,
    `  ${chalk.dim('Model:')}        ${ctx.settings.model || chalk.dim('API default')}`,
    `  ${chalk.dim('Streaming:')}    ${ctx.settings.stream ? chalk.green('ON') : chalk.red('OFF')}`,
    `  ${chalk.dim('Debug:')}        ${ctx.settings.debug ? chalk.green('ON') : chalk.red('OFF')}`,
    `  ${chalk.dim('History:')}      ${ctx.settings.retainHistory ? chalk.green('ON') : chalk.red('OFF')}`,
    `  ${chalk.dim('Glow:')}         ${ctx.settings.glowEnabled ? chalk.green('ON') : chalk.dim('OFF')}`,
    `  ${chalk.dim('Logging:')}      ${ctx.settings.log ? chalk.green('ON') + chalk.dim(` → ${ctx.LOG_FILE}`) : chalk.dim('OFF')}`,
    `  ${chalk.dim('Messages:')}     ${ctx.history.messages.length}`,
    `  ${chalk.dim('Tools:')}        ${ctx.settings.selectedTools.length > 0 ? chalk.cyan(ctx.settings.selectedTools.join(', ')) : chalk.dim('Auto-tools mode')}`,
    '',
  ];
  ctx.appendMessage('system', lines.join('\n'));
  return { handled: true };
}

function cmdModel(args, ctx) {
  const modelArg = args.trim();

  // /model — show current
  if (!modelArg) {
    ctx.appendMessage('system', `${chalk.dim('Current model:')} ${ctx.settings.model || chalk.dim('API default')}`);
    return { handled: true };
  }

  // /model clear
  if (modelArg === 'clear') {
    ctx.settings.model = null;
    ctx.appendMessage('system', chalk.green('Model selection cleared. Using API default.'));
    ctx.addLog('model', 'Cleared model');
    return { handled: true };
  }

  // /model <id>
  ctx.settings.model = modelArg;
  ctx.appendMessage('system', chalk.green(`Model set to: ${modelArg}`));
  ctx.addLog('model', `Set to ${modelArg}`);
  return { handled: true };
}

function cmdStream(args, ctx) {
  const val = args.trim().toLowerCase();
  if (val === 'on') {
    ctx.settings.stream = true;
    ctx.appendMessage('system', chalk.green('Streaming enabled.'));
  } else if (val === 'off') {
    ctx.settings.stream = false;
    ctx.appendMessage('system', chalk.yellow('Streaming disabled.'));
  } else {
    ctx.appendMessage('system', `${chalk.dim('Streaming:')} ${ctx.settings.stream ? chalk.green('ON') : chalk.red('OFF')}`);
  }
  return { handled: true };
}

function cmdDebug(args, ctx) {
  const val = args.trim().toLowerCase();
  if (val === 'on') {
    ctx.settings.debug = true;
    ctx.appendMessage('system', chalk.green('Debug mode enabled.'));
  } else if (val === 'off') {
    ctx.settings.debug = false;
    ctx.appendMessage('system', chalk.yellow('Debug mode disabled.'));
  } else {
    ctx.appendMessage('system', `${chalk.dim('Debug:')} ${ctx.settings.debug ? chalk.green('ON') : chalk.red('OFF')}`);
  }
  return { handled: true };
}

function cmdHistory(args, ctx) {
  const val = args.trim().toLowerCase();
  if (val === 'on') {
    ctx.settings.retainHistory = true;
    ctx.appendMessage('system', chalk.green('History retention enabled.'));
  } else if (val === 'off') {
    ctx.settings.retainHistory = false;
    ctx.appendMessage('system', chalk.yellow('History retention disabled.'));
  } else {
    const count = ctx.history.messages.length;
    const lines = [
      `${chalk.dim('History:')} ${ctx.settings.retainHistory ? chalk.green('ON') : chalk.red('OFF')}`,
      `${chalk.dim('Messages:')} ${count}`,
    ];
    if (count > 0) {
      lines.push('', chalk.dim('Recent:'));
      ctx.history.messages.slice(-4).forEach(m => {
        const preview = m.content.substring(0, 60) + (m.content.length > 60 ? '...' : '');
        lines.push(`  ${chalk.cyan(m.role)}: ${preview}`);
      });
    }
    ctx.appendMessage('system', lines.join('\n'));
  }
  return { handled: true };
}

async function cmdPayment(args, ctx) {
  const parts = args.trim().split(/\s+/).filter(Boolean);

  // /payment — show status
  if (parts.length === 0) {
    try {
      const status = await ctx.client.getPaygStatus();
      const lines = [
        chalk.bold.white('PAYG Billing Status'),
        '',
        `  ${chalk.dim('Enabled:')}         ${status.enabled ? chalk.green('YES') : chalk.red('NO')}`,
        `  ${chalk.dim('Mode:')}            ${status.mode || 'N/A'}`,
        `  ${chalk.dim('Payment Token:')}   ${status.payment_token || 'N/A'}`,
        `  ${chalk.dim('Payment Chain:')}   ${status.payment_chain || 'N/A'}`,
        `  ${chalk.dim('Blocked:')}         ${status.is_blocked ? chalk.red('YES') : chalk.green('NO')}`,
        `  ${chalk.dim('Total Debt:')}      $${(status.total_debt_usd || 0).toFixed(4)}`,
        `  ${chalk.dim('Total Paid:')}      $${(status.total_paid_usd || 0).toFixed(4)}`,
        `  ${chalk.dim('Debt Ceiling:')}    $${(status.debt_ceiling_usd || 0).toFixed(2)}`,
        `  ${chalk.dim('Pending Charges:')} ${status.pending_charges || 0}`,
      ];
      if (status.available_tokens && status.available_tokens.length > 0) {
        lines.push('', `  ${chalk.dim('Available Tokens:')} ${status.available_tokens.join(', ')}`);
      }
      lines.push('');
      ctx.appendMessage('system', lines.join('\n'));
    } catch (err) {
      ctx.appendMessage('system', chalk.red(`PAYG error: ${err.message}`));
    }
    return { handled: true };
  }

  const sub = parts[0];

  // /payment enable
  if (sub === 'enable') {
    try {
      const result = await ctx.client.configurePayg({ enabled: true });
      ctx.appendMessage('system', result.success
        ? chalk.green('PAYG billing enabled.')
        : chalk.red('Failed to enable PAYG.'));
      ctx.addLog('payment', 'Enabled PAYG');
    } catch (err) {
      ctx.appendMessage('system', chalk.red(`Error: ${err.message}`));
    }
    return { handled: true };
  }

  // /payment disable
  if (sub === 'disable') {
    try {
      const result = await ctx.client.configurePayg({ enabled: false });
      ctx.appendMessage('system', result.success
        ? chalk.yellow('PAYG billing disabled.')
        : chalk.red('Failed to disable PAYG.'));
      ctx.addLog('payment', 'Disabled PAYG');
    } catch (err) {
      ctx.appendMessage('system', chalk.red(`Error: ${err.message}`));
    }
    return { handled: true };
  }

  // /payment token <T>
  if (sub === 'token' && parts[1]) {
    const token = parts[1].toUpperCase();
    try {
      const result = await ctx.client.configurePayg({ payment_token: token });
      ctx.appendMessage('system', result.success
        ? chalk.green(`Payment token set to: ${token}`)
        : chalk.red('Failed to set payment token.'));
      ctx.addLog('payment', `Token set to ${token}`);
    } catch (err) {
      ctx.appendMessage('system', chalk.red(`Error: ${err.message}`));
    }
    return { handled: true };
  }

  // /payment mode <M>
  if (sub === 'mode' && parts[1]) {
    const mode = parts[1];
    if (mode !== 'pay_per_request' && mode !== 'debt_accumulation') {
      ctx.appendMessage('system', chalk.yellow('Invalid mode. Use: pay_per_request or debt_accumulation'));
      return { handled: true };
    }
    try {
      const result = await ctx.client.configurePayg({ mode });
      ctx.appendMessage('system', result.success
        ? chalk.green(`Payment mode set to: ${mode}`)
        : chalk.red('Failed to set payment mode.'));
      ctx.addLog('payment', `Mode set to ${mode}`);
    } catch (err) {
      ctx.appendMessage('system', chalk.red(`Error: ${err.message}`));
    }
    return { handled: true };
  }

  ctx.appendMessage('system', chalk.yellow('Usage: /payment [enable|disable|token <T>|mode <M>]'));
  return { handled: true };
}

async function cmdSecrets(args, ctx) {
  const allSecrets = ctx.pluginManager.getPluginSecrets();
  if (allSecrets.length === 0) {
    ctx.appendMessage('system', chalk.dim('No plugins declare secrets.'));
    return { handled: true };
  }

  if (!ctx.promptText) {
    ctx.appendMessage('system', chalk.red('Interactive prompts not available in this mode.'));
    return { handled: true };
  }

  const { readPluginSecrets, writePluginSecrets } = await import('./auth.js');

  // Show menu
  const secrets = readPluginSecrets();
  const secretStatus = allSecrets.map(s => ({
    ...s,
    isSet: !!secrets[s.name]?.ciphertext,
  }));

  ctx.appendMessage('system', [
    '',
    chalk.bold.white('  Plugin Secrets'),
    chalk.dim('  ' + '\u2500'.repeat(30)),
    '',
    ...secretStatus.map(s => {
      const icon = s.isSet ? chalk.green('\u2713 set') : chalk.dim('\u2717 not set');
      return `  ${chalk.white(s.name)} ${chalk.dim(`(${s.label})`)} ${chalk.dim('\u2014')} ${chalk.dim(s.plugin)} ${chalk.dim('\u2014')} ${icon}`;
    }),
    '',
    `  ${chalk.cyan('1.')} Set a secret`,
    `  ${chalk.cyan('2.')} Remove a secret`,
    `  ${chalk.cyan('3.')} Back`,
    '',
  ].join('\n'));

  const choice = (await ctx.promptText(chalk.cyan('  Select (1-3): '))).trim();

  // ── Set a secret ──
  if (choice === '1') {
    ctx.appendMessage('system', [
      '',
      chalk.bold.white('  Select secret to set:'),
      ...allSecrets.map((s, i) => {
        const icon = secretStatus[i].isSet ? chalk.green('\u2713') : chalk.dim('\u2717');
        return `  ${chalk.cyan(`${i + 1}.`)} ${s.label} ${chalk.dim(`(${s.name})`)} ${icon}`;
      }),
      '',
    ].join('\n'));

    const pick = (await ctx.promptText(chalk.cyan(`  Select (1-${allSecrets.length}): `))).trim();
    const idx = parseInt(pick, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= allSecrets.length) {
      ctx.appendMessage('system', chalk.yellow('  Cancelled.'));
      return { handled: true };
    }

    const decl = allSecrets[idx];

    if (!ctx.authSdk) {
      ctx.appendMessage('system', chalk.red('  Not authenticated — cannot encrypt secrets.'));
      return { handled: true };
    }

    const value = await ctx.promptPassword(`  Enter ${decl.label}: `);
    if (!value) {
      ctx.appendMessage('system', chalk.yellow('  No value entered. Cancelled.'));
      return { handled: true };
    }

    try {
      const { encrypt } = await import('@emblemvault/auth-sdk/crypto');
      const encrypted = await encrypt(value, { config: { sdk: ctx.authSdk } });
      const freshSecrets = readPluginSecrets();
      freshSecrets[decl.name] = {
        ciphertext: encrypted.ciphertext,
        dataToEncryptHash: encrypted.dataToEncryptHash,
      };
      writePluginSecrets(freshSecrets);

      // Hot-reload the plugin with the new secret (no restart needed)
      const reloaded = await ctx.pluginManager.reloadPluginWithSecret(decl.plugin, decl.name, value);
      if (reloaded) {
        ctx.appendMessage('system', '\n' + chalk.green(`  Secret "${decl.name}" encrypted, stored, and applied.`));
      } else {
        ctx.appendMessage('system', '\n' + chalk.green(`  Secret "${decl.name}" encrypted and stored.`) + chalk.dim(' Restart to apply.'));
      }
      ctx.addLog('secrets', `Set ${decl.name}`);
    } catch (err) {
      ctx.appendMessage('system', chalk.red(`  Encryption failed: ${err.message}`));
    }
    return { handled: true };
  }

  // ── Remove a secret ──
  if (choice === '2') {
    const setSecrets = secretStatus.filter(s => s.isSet);
    if (setSecrets.length === 0) {
      ctx.appendMessage('system', chalk.dim('  No secrets are currently stored.'));
      return { handled: true };
    }

    ctx.appendMessage('system', [
      '',
      chalk.bold.white('  Select secret to remove:'),
      ...setSecrets.map((s, i) =>
        `  ${chalk.cyan(`${i + 1}.`)} ${s.label} ${chalk.dim(`(${s.name})`)} ${chalk.dim('\u2014')} ${chalk.dim(s.plugin)}`
      ),
      '',
    ].join('\n'));

    const pick = (await ctx.promptText(chalk.cyan(`  Select (1-${setSecrets.length}): `))).trim();
    const idx = parseInt(pick, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= setSecrets.length) {
      ctx.appendMessage('system', chalk.yellow('  Cancelled.'));
      return { handled: true };
    }

    const target = setSecrets[idx];
    const freshSecrets = readPluginSecrets();
    if (freshSecrets[target.name]) {
      delete freshSecrets[target.name];
      writePluginSecrets(freshSecrets);
      ctx.appendMessage('system', chalk.green(`  Secret "${target.name}" removed.`));
      ctx.addLog('secrets', `Removed ${target.name}`);
    }
    return { handled: true };
  }

  // ── Back ──
  return { handled: true };
}

function cmdGlow(args, ctx) {
  const val = args.trim().toLowerCase();
  if (val === 'on') {
    const info = ctx.glow.detectGlow();
    if (!info.installed) {
      ctx.appendMessage('system', chalk.yellow('glow is not installed. Install from: https://github.com/charmbracelet/glow'));
      return { handled: true };
    }
    ctx.settings.glowEnabled = true;
    ctx.appendMessage('system', chalk.green('Markdown rendering enabled (via glow).'));
  } else if (val === 'off') {
    ctx.settings.glowEnabled = false;
    ctx.appendMessage('system', chalk.yellow('Markdown rendering disabled.'));
  } else {
    const info = ctx.glow.detectGlow();
    ctx.appendMessage('system', [
      `${chalk.dim('Glow:')} ${ctx.settings.glowEnabled ? chalk.green('ON') : chalk.red('OFF')}`,
      `${chalk.dim('Installed:')} ${info.installed ? chalk.green('YES') : chalk.red('NO')}`,
      info.version ? `${chalk.dim('Version:')} ${info.version}` : '',
    ].filter(Boolean).join('\n'));
  }
  return { handled: true };
}

function cmdLog(args, ctx) {
  const val = args.trim().toLowerCase();
  if (val === 'on') {
    ctx.settings.log = true;
    ctx.logOpen();
    ctx.appendMessage('system', chalk.green(`Logging enabled → ${ctx.LOG_FILE}`));
  } else if (val === 'off') {
    ctx.logClose();
    ctx.settings.log = false;
    ctx.appendMessage('system', chalk.yellow('Logging disabled.'));
  } else {
    const lines = [
      `${chalk.dim('Logging:')} ${ctx.settings.log ? chalk.green('ON') : chalk.red('OFF')}`,
      `${chalk.dim('File:')} ${ctx.LOG_FILE}`,
      '',
      chalk.dim('Usage: /log on|off'),
      chalk.dim('CLI:   --log  --log-file <path>'),
    ];
    ctx.appendMessage('system', lines.join('\n'));
  }
  return { handled: true };
}

function cmdReset(ctx) {
  ctx.history.messages = [];
  ctx.history.created = new Date().toISOString();
  ctx.history.lastUpdated = new Date().toISOString();

  // Persist the cleared state to disk
  if (typeof ctx.saveHistory === 'function') ctx.saveHistory(ctx.history);

  // Clear chat panel in TUI mode
  if (ctx.tui && ctx.tui.panels && ctx.tui.panels.chat) {
    ctx.tui.panels.chat.setContent('');
    ctx.tui.screen.render();
  }

  ctx.appendMessage('system', chalk.green('Conversation cleared.'));
  ctx.addLog('reset', 'Conversation reset');
  return { handled: true };
}

function cmdExit(ctx) {
  if (ctx.tui) {
    ctx.tui.destroy();
  }
  process.exit(0);
}

// ============================================================================
// Main Router
// ============================================================================

/**
 * Process a slash command.
 *
 * @param {string} input - The raw user input (e.g. "/tools add foo")
 * @param {object} ctx - Runtime context
 * @returns {Promise<{ handled: boolean }>}
 */
export async function processCommand(input, ctx) {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return { handled: false };
  }

  // Split into command and arguments
  const spaceIdx = trimmed.indexOf(' ');
  const cmd = spaceIdx === -1 ? trimmed.toLowerCase() : trimmed.slice(0, spaceIdx).toLowerCase();
  const args = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1);

  switch (cmd) {
    case '/help':
      return cmdHelp(ctx);

    case '/plugins':
      return cmdPlugins(ctx);

    case '/plugin':
      return cmdPlugin(args, ctx);

    case '/tools':
      return cmdTools(args, ctx);

    case '/auth':
      return cmdAuth(ctx);

    case '/wallet':
      return cmdWallet(ctx);

    case '/portfolio':
      return cmdPortfolio();

    case '/settings':
      return cmdSettings(ctx);

    case '/model':
      return cmdModel(args, ctx);

    case '/stream':
      return cmdStream(args, ctx);

    case '/debug':
      return cmdDebug(args, ctx);

    case '/history':
      return cmdHistory(args, ctx);

    case '/payment':
      return cmdPayment(args, ctx);

    case '/secrets':
      return cmdSecrets(args, ctx);

    case '/glow':
      return cmdGlow(args, ctx);

    case '/log':
      return cmdLog(args, ctx);

    case '/reset':
    case '/clear':
      return cmdReset(ctx);

    case '/exit':
    case '/quit':
      return cmdExit(ctx);

    default:
      ctx.appendMessage('system', chalk.yellow(`Unknown command: ${cmd}`) + chalk.dim('  Type /help for available commands.'));
      return { handled: true };
  }
}

export default { processCommand, COMMANDS };
