/**
 * TUI Core — Blessed-based terminal UI layout
 * Main screen, panels, focus management, key bindings
 */

import blessed from 'blessed';

/**
 * Create the full TUI layout.
 * @param {object} opts - Optional overrides
 * @returns {{ screen, panels, destroy }}
 */
export function createTUI(opts = {}) {
  const screen = blessed.screen({
    smartCSR: false,
    fastCSR: false,
    title: opts.title || 'EMBLEM AI - Agent Command & Control',
    mouse: true,
    fullUnicode: false,
    autoPadding: false,
    warnings: false,
  });

  // ── Banner — top row, full width, single line ────────────────────────
  const bannerBox = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    tags: true,
    style: {
      fg: 'cyan',
      bg: 'black',
      bold: true,
    },
  });

  // ── Sidebar — left 25%, from row 1 to bottom-4 ──────────────────────
  const sidebarBox = blessed.box({
    parent: screen,
    top: 1,
    left: 0,
    width: '25%',
    height: '100%-5',
    border: { type: 'line' },
    label: ' Plugins ',
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    mouse: true,
    keys: true,
    vi: true,
    style: {
      border: { fg: 'gray' },
      label: { fg: 'cyan', bold: true },
      scrollbar: { fg: 'cyan' },
    },
    scrollbar: {
      ch: '|',
      style: { fg: 'cyan' },
    },
  });

  // ── Chat — right 75%, from row 1 to bottom-4 ────────────────────────
  const chatBox = blessed.box({
    parent: screen,
    top: 1,
    left: '25%',
    width: '75%',
    height: '100%-5',
    border: { type: 'line' },
    label: ' Chat ',
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    mouse: true,
    keys: true,
    vi: true,
    scrollbar: {
      ch: '|',
      style: { fg: 'cyan' },
    },
    style: {
      border: { fg: 'gray' },
      label: { fg: 'cyan', bold: true },
    },
  });

  // ── Event Log — left 25%, bottom 3 rows ──────────────────────────────
  const eventLogBox = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '25%',
    height: 3,
    border: { type: 'line' },
    label: ' Log ',
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    mouse: true,
    style: {
      border: { fg: 'gray' },
      label: { fg: 'yellow', bold: true },
    },
  });

  // ── Input — right 75%, bottom 3 rows ─────────────────────────────────
  const inputBox = blessed.textarea({
    parent: screen,
    bottom: 0,
    left: '25%',
    width: '75%',
    height: 3,
    border: { type: 'line' },
    label: ' You ',
    inputOnFocus: true,
    mouse: true,
    keys: true,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'cyan', bold: true },
      focus: {
        border: { fg: 'white' },
      },
    },
  });

  // ── Focus cycling: Tab ────────────────────────────────────────────────
  const focusable = [inputBox, chatBox, sidebarBox];
  let focusIndex = 0;

  screen.key(['tab'], () => {
    focusIndex = (focusIndex + 1) % focusable.length;
    focusable[focusIndex].focus();
    screen.render();
  });

  screen.key(['S-tab'], () => {
    focusIndex = (focusIndex - 1 + focusable.length) % focusable.length;
    focusable[focusIndex].focus();
    screen.render();
  });

  // ── Exit: Ctrl+C ─────────────────────────────────────────────────────
  screen.key(['C-c'], () => {
    screen.destroy();
    process.exit(0);
  });

  // ── Start focused on input ────────────────────────────────────────────
  inputBox.focus();
  screen.render();

  const panels = {
    banner: bannerBox,
    sidebar: sidebarBox,
    chat: chatBox,
    eventLog: eventLogBox,
    input: inputBox,
  };

  return {
    screen,
    panels,
    destroy() {
      screen.destroy();
    },
  };
}
