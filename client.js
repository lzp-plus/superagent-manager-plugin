window.__ModuleLoader__.load({
  id: '@local/superagent-manager',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useRef, useState } = React;

    const NS = 'superagentManager';
    const PANEL_ID = 'superagent-manager';
    const POLL_MS = 10000;

    /* The panel is a Harness page, not its own product surface: every colour
     * comes from the host theme aliases, so light/dark switching is inherited
     * and the page sits beside Plugin Manager without a seam. */
    const CSS = `
.sam-page {
  --sam-inset: clamp(24px, 4vw, 48px);
  --sam-top: 28px;
  box-sizing: border-box;
  height: 100%;
  min-height: 100%;
  overflow-y: auto;
  padding: 0 var(--sam-inset) 48px;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
}

.sam-column {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
  container-type: inline-size;
}

@media (max-width: 767px) {
  .sam-page {
    --sam-inset: 20px;
  }
}

/* The entry-page head bar spans the page so its whole top strip, including the
   macOS window clearance, is the drag region; the head inside stays on the
   960px content column. */
.sam-head-bar {
  box-sizing: border-box;
  flex: none;
  width: calc(100% + 2 * var(--sam-inset));
  margin-inline: calc(-1 * var(--sam-inset));
  padding: var(--sam-top) var(--sam-inset) 0;
}

html[data-platform='darwin'] .sam-head-bar {
  padding-top: calc(var(--sam-top) + var(--dsh-frame-top-clearance, 0px));
}

.sam-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
}

.sam-title {
  margin: 0;
  font-size: 20px;
  line-height: 28px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
}

.sam-toolbar {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

/* Buttons mirror the host primitive: 32px md, 28px sm, 36px lg. */
.sam-btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--dsw-radius-md);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color .16s var(--ds-ease-in-out, ease), color .16s var(--ds-ease-in-out, ease);
}

.sam-btn:disabled { cursor: not-allowed; opacity: .4; }
.sam-btn-sm { height: 28px; padding: 0 10px; border-radius: var(--dsw-radius-sm); font-size: 12px; line-height: 18px; }
.sam-btn-lg { height: 36px; padding: 0 14px; font-size: 14px; line-height: 22px; }
.sam-btn-primary { background: var(--dsw-alias-button-primary-fill); color: var(--dsw-alias-label-primary-foreground); }
.sam-btn-outline { box-shadow: inset 0 0 0 .5px var(--dsw-alias-border-l3); }
.sam-btn-ghost:active:not(:disabled) { background: var(--dsw-alias-interactive-bg-active); }
.sam-btn-danger { background: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-label-primary-foreground); }

@media (hover: hover) {
  .sam-btn-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
  .sam-btn-outline:hover:not(:disabled),
  .sam-btn-ghost:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
  .sam-btn-danger:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 86%, var(--dsw-alias-label-primary)); }
}

.sam-btn:focus-visible,
.sam-icon-btn:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}

.sam-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-caption);
  cursor: pointer;
  transition: background-color .16s var(--ds-ease-in-out, ease), color .16s var(--ds-ease-in-out, ease);
}

.sam-icon-btn:active:not(:disabled) { background: var(--dsw-alias-interactive-bg-active); }
.sam-icon-btn:disabled { opacity: .5; cursor: default; }
.sam-icon-btn-danger { color: var(--dsw-alias-state-error-primary); }

@media (hover: hover) {
  .sam-icon-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-secondary); }
  .sam-icon-btn-danger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover-danger); color: var(--dsw-alias-state-error-primary); }
}

/* Keyboard focus gets the host tooltip's surface; the native title attribute
   covers the pointer-only hover. */
.sam-icon-btn:focus-visible::after {
  content: attr(data-label);
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  max-width: min(240px, calc(100vw - 48px));
  padding: 4px 8px;
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-tooltip-bg);
  color: var(--dsw-alias-tooltip-label);
  font: inherit;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  text-align: start;
  white-space: normal;
  pointer-events: none;
  box-shadow: var(--dsw-shadow-lv3, 0 8px 24px rgba(0, 0, 0, .18));
}

.sam-spinner {
  display: inline-block;
  flex: none;
  width: 14px;
  height: 14px;
  border: 1.5px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: sam-spin .8s linear infinite;
}

.sam-spinning {
  animation: sam-spin .9s linear infinite;
  transform-origin: center;
}

@keyframes sam-spin { to { transform: rotate(360deg); } }

.sam-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: .5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-module-platform);
}

.sam-banner-icon { flex: none; display: inline-flex; margin-top: 2px; color: var(--dsw-alias-label-tertiary); }
.sam-banner[data-tone='error'] .sam-banner-icon { color: var(--dsw-alias-state-error-primary); }
.sam-banner[data-tone='warning'] .sam-banner-icon { color: var(--dsw-alias-state-warn-primary); }

.sam-banner-main { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }

.sam-banner-title {
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
}

.sam-banner[data-tone='error'] .sam-banner-title { color: var(--dsw-alias-state-error-primary); }
.sam-banner[data-tone='warning'] .sam-banner-title { color: var(--dsw-alias-state-warn-label); }

.sam-banner-message {
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-label-secondary);
  overflow-wrap: anywhere;
}

.sam-banner-hint {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
}

.sam-banner-action { flex: none; align-self: center; }

.sam-group { display: flex; flex-direction: column; gap: 8px; }
.sam-group-head { display: flex; align-items: baseline; gap: 8px; }

.sam-group-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
}

.sam-group-count {
  font-size: 12px;
  line-height: 18px;
  font-weight: 400;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}

.sam-rows {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Rows sit on the page ground one hairline apart, the way Plugin Manager lists
   its packages: 2px inset, 12px rhythm, and no hover because the row itself is
   not a control (its actions are). */
.sam-row {
  margin: 0;
  padding: 12px 2px;
  border-bottom: .5px solid var(--dsw-alias-border-l2);
}

.sam-row:last-child { border-bottom: 0; }

.sam-row-line { display: flex; align-items: center; gap: 16px; min-width: 0; }

.sam-row-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: .5px solid var(--dsw-alias-border-l3);
  border-radius: var(--dsw-radius-md);
  color: var(--dsw-alias-label-secondary);
}

.sam-row-main { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.sam-row-title { display: flex; align-items: center; gap: 8px; min-width: 0; }

.sam-name {
  display: block;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sam-row-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0 6px;
  min-width: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
}

.sam-meta-sep { color: var(--dsw-alias-label-dimmed); }

.sam-mono {
  font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-variant-numeric: tabular-nums;
}

.sam-row-end { box-sizing: border-box; display: inline-flex; flex: none; align-items: center; gap: 8px; }

.sam-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
}

.sam-state[data-tone='warning'] { color: var(--dsw-alias-state-warn-label); }
.sam-state[data-tone='error'] { color: var(--dsw-alias-state-error-primary); }
.sam-state[data-tone='idle'] { color: var(--dsw-alias-label-tertiary); }

.sam-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.sam-dot[data-tone='success'] { color: var(--dsw-alias-state-success-primary); }
.sam-dot[data-tone='warning'] { color: var(--dsw-alias-state-warn-primary); }
.sam-dot[data-tone='error'] { color: var(--dsw-alias-state-error-primary); }
.sam-dot[data-tone='idle'] { color: var(--dsw-alias-state-idle-primary); }

/* Detail lines start under the title, past the 40px icon and its 16px gap. */
.sam-details { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; padding-left: 56px; }

.sam-load { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-width: 0; }

.sam-load-text {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
  font-variant-numeric: tabular-nums;
}

.sam-load-track {
  display: flex;
  flex: none;
  width: 96px;
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--dsw-alias-bg-skeleton);
}

.sam-load-running,
.sam-load-queued {
  display: block;
  height: 100%;
  transition: width .3s var(--ds-ease-in-out, ease);
}

.sam-load-running { background: var(--dsw-alias-state-business-primary); }
.sam-load-queued { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 35%, transparent); }

.sam-health { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 14px; }

.sam-health-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
}

.sam-health-item[data-tone='warning'] { color: var(--dsw-alias-state-warn-label); }
.sam-health-item[data-tone='error'] { color: var(--dsw-alias-state-error-primary); }

.sam-health-key {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sam-chats { display: flex; flex-wrap: wrap; gap: 6px; }

.sam-chat {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  max-width: 240px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 17px;
}

.sam-chat-hash { color: var(--dsw-alias-label-tertiary); }
.sam-chat-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.sam-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-state-warn-label);
  overflow-wrap: anywhere;
}

.sam-alert[data-tone='error'] { color: var(--dsw-alias-state-error-primary); }
.sam-alert-icon { flex: none; margin-top: 2px; }

.sam-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 24px;
  text-align: center;
}

.sam-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 4px;
  border: .5px solid var(--dsw-alias-border-l3);
  border-radius: var(--dsw-radius-lg);
  color: var(--dsw-alias-label-tertiary);
}

.sam-empty-title {
  margin: 0;
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
}

.sam-empty .sam-btn { margin-top: 8px; }

.sam-skeleton-row { display: flex; align-items: center; gap: 16px; margin: 0; padding: 12px 2px; }
.sam-skeleton-icon { flex: none; width: 40px; height: 40px; border-radius: var(--dsw-radius-md); }
.sam-skeleton-lines { display: flex; flex: 1; flex-direction: column; gap: 7px; min-width: 0; }
.sam-skeleton-bar { height: 12px; border-radius: var(--dsw-radius-xs); }
.sam-skeleton-fill { background: var(--dsw-alias-bg-skeleton); animation: sam-pulse 2s cubic-bezier(.36, 0, .64, 1) infinite; }

@keyframes sam-pulse {
  0% { opacity: 1; }
  40% { opacity: .6; }
  80%, 100% { opacity: 1; }
}

.sam-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.sam-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(24px, var(--dsh-frame-overlay-top, 24px)) 24px;
  background: var(--dsw-alias-bg-mask-1);
  backdrop-filter: var(--dsw-mask-blur, blur(4px));
}

.sam-dialog {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: min(440px, 100%);
  max-height: calc(100vh - 2 * max(24px, var(--dsh-frame-overlay-top, 24px)));
  max-height: calc(100dvh - 2 * max(24px, var(--dsh-frame-overlay-top, 24px)));
  padding: 0 0 24px;
  overflow: hidden;
  border: 0;
  border-radius: var(--dsw-radius-panel);
  background: var(--dsw-alias-bg-layer-2);
  box-shadow: var(--dsw-elevation-prominent, 0 24px 64px rgba(0, 0, 0, .2));
  animation: sam-dialog-in .2s var(--ds-ease-in-out, ease);
  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
}

.sam-dialog:focus { outline: none; }

.sam-dialog-head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 22px 14px 12px 24px;
}

.sam-dialog-title {
  margin: 0;
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
  overflow-wrap: anywhere;
}

.sam-dialog-desc {
  flex: none;
  margin: 0;
  padding: 0 24px;
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-label-secondary);
  overflow-wrap: anywhere;
}

.sam-dialog-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
  padding: 0 24px;
  overflow-y: auto;
}

.sam-dialog-foot {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 24px;
}

@keyframes sam-dialog-in { from { opacity: 0; } to { opacity: 1; } }

.sam-form { display: flex; flex-direction: column; gap: 12px; }
.sam-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }

.sam-label { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--dsw-alias-label-primary); }

.sam-input {
  box-sizing: border-box;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: .5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 14px;
  line-height: 22px;
  outline: none;
  transition: border-color .15s var(--ds-ease-in-out, ease);
}

.sam-input::placeholder { color: var(--dsw-alias-label-dimmed); }
.sam-input:focus { border-color: var(--dsw-alias-state-business-primary); }
.sam-input[aria-invalid='true'] { border-color: var(--dsw-alias-state-error-primary); }

.sam-hint { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }
.sam-hint[data-tone='error'] { color: var(--dsw-alias-state-error-primary); }

.sam-toast {
  position: fixed;
  top: 40px;
  left: 50%;
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
  max-width: min(640px, calc(100vw - 48px));
  padding: 12px 16px;
  border-radius: var(--dsw-radius-lg);
  background: var(--dsw-alias-toast-bg);
  color: var(--dsw-alias-toast-label);
  box-shadow: var(--dsw-shadow-lv3, 0 8px 24px rgba(0, 0, 0, .18));
  font-size: 14px;
  line-height: 22px;
  pointer-events: none;
  transform: translateX(-50%);
  animation: sam-toast-in .16s ease-out, sam-toast-fade 1s ease var(--sam-toast-hold, 4s) forwards;
}

.sam-toast-icon { display: grid; flex: none; place-items: center; color: var(--dsw-alias-state-warn-label); }
.sam-toast-icon[data-tone='success'] { color: var(--dsw-alias-state-success-primary); }
.sam-toast-icon[data-tone='error'] { color: var(--dsw-alias-state-error-primary); }

.sam-toast-msg { min-width: 0; overflow-wrap: anywhere; }

@keyframes sam-toast-in {
  0% { opacity: 0; transform: translate(-50%, -6px); }
  to { opacity: 1; transform: translate(-50%); }
}

@keyframes sam-toast-fade { to { opacity: 0; visibility: hidden; } }

@container (max-width: 680px) {
  .sam-row-line { flex-wrap: wrap; }
  .sam-row-end { width: 100%; padding-left: 56px; justify-content: flex-start; }
  .sam-details { padding-left: 0; }
}

@container (max-width: 520px) {
  .sam-toolbar { width: 100%; justify-content: flex-start; }
  .sam-row-end { padding-left: 0; }
  .sam-load-track { width: 72px; }
}

/* iOS Safari zooms the visual viewport for a field under 16px and leaves the
   page pannable afterwards; the host pages take the same floor. */
@media (pointer: coarse) {
  .sam-input { font-size: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .sam-spinner,
  .sam-spinning { animation: none; }
  .sam-skeleton-fill { animation: none; }
  .sam-dialog { animation: none; }
  .sam-toast { animation: sam-toast-fade 1s ease var(--sam-toast-hold, 4s) forwards; }
  .sam-load-running,
  .sam-load-queued { transition: none; }
}
`;

    const ICONS = {
      refresh: [
        { t: 'path', d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' },
        { t: 'path', d: 'M8 16H3v5' },
        { t: 'path', d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' },
        { t: 'path', d: 'M21 3v5h-5' },
      ],
      plus: [
        { t: 'path', d: 'M12 5v14' },
        { t: 'path', d: 'M5 12h14' },
      ],
      external: [
        { t: 'path', d: 'M15 3h6v6' },
        { t: 'path', d: 'M10 14 21 3' },
        { t: 'path', d: 'M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5' },
      ],
      restart: [
        { t: 'path', d: 'M21 12a9 9 0 1 1-3-6.7L21 8' },
        { t: 'path', d: 'M21 3v5h-5' },
      ],
      play: [
        { t: 'path', d: 'M8 5v14l11-7L8 5Z' },
      ],
      stop: [
        { t: 'rect', x: 6.5, y: 6.5, width: 11, height: 11, rx: 2 },
      ],
      trash: [
        { t: 'path', d: 'M4 7h16' },
        { t: 'path', d: 'M10 11v6' },
        { t: 'path', d: 'M14 11v6' },
        { t: 'path', d: 'M6 7l1 13h10l1-13' },
        { t: 'path', d: 'M9 7V4h6v3' },
      ],
      alert: [
        { t: 'path', d: 'M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z' },
        { t: 'path', d: 'M12 9v4' },
        { t: 'path', d: 'M12 17h.01' },
      ],
      check: [
        { t: 'path', d: 'M20 6 9 17l-5-5' },
      ],
      close: [
        { t: 'path', d: 'M18 6 6 18' },
        { t: 'path', d: 'M6 6l12 12' },
      ],
      robot: [
        { t: 'path', d: 'M12 3v3' },
        { t: 'rect', x: 5, y: 6, width: 14, height: 11, rx: 2.5 },
        { t: 'circle', cx: 9.5, cy: 11.5, r: 1.1, fill: 'currentColor', stroke: 'none' },
        { t: 'circle', cx: 14.5, cy: 11.5, r: 1.1, fill: 'currentColor', stroke: 'none' },
        { t: 'path', d: 'M9.5 15h5' },
        { t: 'path', d: 'M8 21l1.5-4' },
        { t: 'path', d: 'M16 21l-1.5-4' },
      ],
    };

    const Icon = ({ name, size = 16, className }) => {
      const shapes = ICONS[name] || ICONS.robot;
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className,
        'aria-hidden': true,
        focusable: 'false',
      }, shapes.map((shape, index) => {
        const { t: tag, ...attributes } = shape;
        return h(tag, { key: index, ...attributes });
      }));
    };

    const BotIcon = ({ size = 18 }) => h(Icon, { name: 'robot', size });

    async function api(path, options) {
      const response = await fetch(`/superagent-manager/api/${path}`, {
        ...options,
        cache: 'no-store',
        headers: {
          'x-superagent-manager': '1',
          ...(options && options.body ? { 'content-type': 'application/json' } : {}),
        },
      });
      const value = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(value.error || `HTTP ${response.status}`);
      return value;
    }

    function tr(t, key, params) {
      let text = String(t(key) ?? key);
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.split(`{${name}}`).join(String(value));
        }
      }
      return text;
    }

    function cleanMessage(value, max = 600) {
      const raw = value && typeof value === 'object' && 'message' in value ? value.message : value;
      const text = String(raw ?? '')
        .replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
        .trim();
      return text.length > max ? `${text.slice(0, max)}…` : text;
    }

    /* --- live instance state -------------------------------------------- */

    function useInstances() {
      const [state, setState] = useState({ data: undefined, error: undefined, refreshing: false });
      const alive = useRef(true);
      const inFlight = useRef(false);
      const sequence = useRef(0);

      const load = useCallback(async (force = false, foreground = false) => {
        if (inFlight.current && !force) return;
        const id = sequence.current + 1;
        sequence.current = id;
        inFlight.current = true;
        if (foreground || force) setState((current) => ({ ...current, refreshing: true }));
        try {
          const data = await api('instances');
          if (alive.current && id === sequence.current) {
            setState({ data, error: undefined, refreshing: false });
          }
        } catch (error) {
          if (alive.current && id === sequence.current) {
            setState((current) => ({ ...current, error: cleanMessage(error), refreshing: false }));
          }
        } finally {
          if (alive.current && id === sequence.current) {
            inFlight.current = false;
            setState((current) => (current.refreshing ? { ...current, refreshing: false } : current));
          }
        }
      }, []);

      useEffect(() => {
        alive.current = true;
        inFlight.current = false;
        void load(false, true);
        const timer = setInterval(() => {
          if (!document.hidden) void load(false, false);
        }, POLL_MS);
        const onVisibility = () => {
          if (!document.hidden) void load(false, false);
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
          alive.current = false;
          clearInterval(timer);
          document.removeEventListener('visibilitychange', onVisibility);
        };
      }, [load]);

      const refresh = useCallback(() => { void load(true, true); }, [load]);
      return { ...state, refresh };
    }

    /* --- status model ---------------------------------------------------- */

    /* The owning plugin Context, captured in apply() so panel actions can
     * reach optional shell services (the sidebar browser tab) safely. */
    let hostCtx = null;

    /** Open a URL in the app's built-in sidebar browser tab when that service
     * and its 'browser' page type are present (the same route chat external
     * links take). Returns true when handled; callers fall back to a plain
     * window.open, which the desktop shell routes to the system browser. */
    function openInSidebarTab(url) {
      try {
        const sidebarRight = hostCtx && typeof hostCtx.get === 'function'
          ? hostCtx.get('sidebarRight')
          : undefined;
        const tabs = hostCtx && typeof hostCtx.get === 'function'
          ? hostCtx.get('sidebarRightTabs')
          : undefined;
        if (sidebarRight && typeof sidebarRight.openTab === 'function'
          && tabs && typeof tabs.get === 'function' && tabs.get('browser')) {
          sidebarRight.openTab('browser', { params: { url } });
          return true;
        }
      } catch { /* service absent in this shell — caller falls back */ }
      return false;
    }

    const HEALTH_ERROR = /^(error|failed|failure)$/i;
    const HEALTH_WARN = /^(paused|starting|pending|queued|loading|stopped|degraded)$/i;
    const HEALTH_OK = /^(ok|done|active|healthy|ready|running)$/i;

    function healthEntries(instance) {
      return Object.entries(instance.health || {}).map(([key, value]) => {
        const state = typeof value === 'string'
          ? value
          : value && typeof value === 'object'
            ? String(value.state ?? value.status ?? '')
            : '';
        return [key, state];
      });
    }

    function healthTone(state) {
      if (HEALTH_ERROR.test(state)) return 'error';
      if (HEALTH_WARN.test(state)) return 'warning';
      if (HEALTH_OK.test(state)) return 'success';
      return 'idle';
    }

    function instanceTone(instance) {
      const health = healthEntries(instance).map(([, value]) => value);
      const detail = String(instance.detail || '');
      if (instance.running) {
        if (health.some((value) => HEALTH_ERROR.test(value))) return 'error';
        if (detail.startsWith('state unavailable')) return 'error';
        if (instance.setup || health.some((value) => HEALTH_WARN.test(value))) return 'warning';
        return 'success';
      }
      if (/wrapper script not found/i.test(detail)) return 'warning';
      if (detail === 'not answering') return 'error';
      return 'idle';
    }

    function detailText(instance, t) {
      const detail = String(instance.detail || '');
      if (!detail) return null;
      if (detail === 'manually stopped') return t('detailManuallyStopped');
      if (detail === 'not answering') return t('detailNotAnswering');
      const wrapper = /^wrapper script not found:\s*(.+)$/.exec(detail);
      if (wrapper) return tr(t, 'detailNoWrapper', { path: wrapper[1] });
      const unavailable = /^state unavailable:\s*(.+)$/.exec(detail);
      if (unavailable) return tr(t, 'detailStateUnavailable', { error: unavailable[1] });
      return detail;
    }

    function healthLabel(state, t) {
      if (HEALTH_OK.test(state)) return t('healthOk');
      if (!state) return t('healthUnknown');
      if (HEALTH_ERROR.test(state)) return t('healthError');
      if (HEALTH_WARN.test(state)) {
        if (/^(paused|stopped)$/i.test(state)) return t('healthPaused');
        return t('healthStarting');
      }
      return state;
    }

    function stateLabel(tone, t) {
      if (tone === 'success') return t('stateHealthy');
      if (tone === 'warning') return t('stateDegraded');
      if (tone === 'error') return t('stateError');
      return t('stateStopped');
    }

    function suggestPort(instances) {
      const used = new Set((instances || []).map((instance) => Number(instance.port)).filter(Boolean));
      let port = 3082;
      while (used.has(port) && port < 65535) port += 1;
      return String(port);
    }

    /* --- primitives ------------------------------------------------------ */

    const Button = ({ variant = 'ghost', size = 'md', icon, busy, disabled, onClick, type = 'button', form, autoFocus, title, ariaLabel, children }) => {
      const sizeClass = size === 'sm' ? ' sam-btn-sm' : size === 'lg' ? ' sam-btn-lg' : '';
      const iconSize = size === 'sm' ? 13 : 15;
      return h('button', {
        type,
        form,
        title,
        autoFocus,
        'aria-label': ariaLabel,
        className: `sam-btn sam-btn-${variant}${sizeClass}`,
        disabled: disabled || busy,
        'aria-busy': busy ? 'true' : undefined,
        onClick,
      },
      busy ? h('span', { className: 'sam-spinner', 'aria-hidden': true }) : icon ? h(Icon, { name: icon, size: iconSize }) : null,
      children === undefined || children === null ? null : h('span', null, children));
    };

    const IconButton = ({ icon, label, tone = 'default', busy, spinning, disabled, onClick, size = 16 }) =>
      h('button', {
        type: 'button',
        className: `sam-icon-btn${tone === 'danger' ? ' sam-icon-btn-danger' : ''}`,
        'aria-label': label,
        'data-label': label,
        title: label,
        disabled: disabled || busy,
        'aria-busy': busy ? 'true' : undefined,
        onClick,
      },
      busy
        ? h('span', { className: 'sam-spinner', 'aria-hidden': true })
        : h(Icon, { name: icon, size, className: spinning ? 'sam-spinning' : undefined }));

    const StateDot = ({ tone = 'idle' }) => h('span', { className: 'sam-dot', 'data-tone': tone, 'aria-hidden': true });

    const AlertLine = ({ tone = 'warning', live = true, children }) =>
      h('div', { className: 'sam-alert', 'data-tone': tone, role: tone === 'error' && live ? 'alert' : undefined },
        h(Icon, { name: 'alert', size: 14, className: 'sam-alert-icon' }),
        h('span', null, children));

    const Banner = ({ tone = 'info', title, message, hint, action }) =>
      h('div', { className: 'sam-banner', 'data-tone': tone, role: tone === 'error' ? 'alert' : undefined },
        h('span', { className: 'sam-banner-icon' }, h(Icon, { name: 'alert', size: 16 })),
        h('div', { className: 'sam-banner-main' },
          title ? h('span', { className: 'sam-banner-title' }, title) : null,
          message ? h('span', { className: 'sam-banner-message' }, message) : null,
          hint ? h('span', { className: 'sam-banner-hint' }, hint) : null),
        action ? h('div', { className: 'sam-banner-action' }, action) : null);

    /* --- dialogs --------------------------------------------------------- */

    function Modal({ t, title, description, onClose, children, footer, busy = false }) {
      const panel = useRef(null);
      const restore = useRef(typeof document === 'undefined' ? null : document.activeElement);
      const closeRef = useRef(onClose);
      const busyRef = useRef(busy);
      closeRef.current = onClose;
      busyRef.current = busy;

      useEffect(() => {
        const node = panel.current;
        const selector = 'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
        const focusables = () => (node ? Array.from(node.querySelectorAll(selector)).filter((element) => element.getClientRects().length > 0) : []);
        const timer = window.setTimeout(() => {
          if (!node || node.contains(document.activeElement)) return;
          const first = focusables()[0];
          if (first) first.focus();
          else node.focus();
        }, 0);

        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            if (!busyRef.current) {
              event.preventDefault();
              closeRef.current();
            }
            return;
          }
          if (event.key !== 'Tab' || !node) return;
          const items = focusables();
          if (!items.length) {
            event.preventDefault();
            node.focus();
            return;
          }
          const first = items[0];
          const last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        };

        document.addEventListener('keydown', onKey, true);
        const previousOverflow = document.body.style.overflow;
        const scrollHost = node ? node.closest('.sam-page') : null;
        const previousHostOverflow = scrollHost ? scrollHost.style.overflowY : '';
        document.body.style.overflow = 'hidden';
        if (scrollHost) scrollHost.style.overflowY = 'hidden';
        return () => {
          window.clearTimeout(timer);
          document.removeEventListener('keydown', onKey, true);
          document.body.style.overflow = previousOverflow;
          if (scrollHost) scrollHost.style.overflowY = previousHostOverflow;
          const target = restore.current;
          if (target && target.isConnected && typeof target.focus === 'function') target.focus();
        };
      }, []);

      return h('div', {
        className: 'sam-overlay',
        'data-window-drag-exclude': true,
        onMouseDown: (event) => {
          if (event.target === event.currentTarget && !busyRef.current) closeRef.current();
        },
      },
      h('div', {
        ref: panel,
        className: 'sam-dialog',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'sam-dialog-title',
        'aria-describedby': description ? 'sam-dialog-desc' : undefined,
        tabIndex: -1,
      },
      h('div', { className: 'sam-dialog-head' },
        h('h2', { className: 'sam-dialog-title', id: 'sam-dialog-title' }, title),
        h(IconButton, {
          icon: 'close',
          label: t('close'),
          disabled: busy,
          onClick: () => { if (!busyRef.current) closeRef.current(); },
        })),
      description ? h('p', { className: 'sam-dialog-desc', id: 'sam-dialog-desc' }, description) : null,
      children ? h('div', { className: 'sam-dialog-body' }, children) : null,
      footer ? h('div', { className: 'sam-dialog-foot' }, footer) : null));
    }

    /* Accept owner/name as typed, or a copied GitHub URL, and keep only the two
     * path segments the manifest needs. GitHub route words and dot-only names
     * are rejected so `github.com/settings/profile` cannot become an instance. */
    const REPOSITORY_OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
    const REPOSITORY_NAME = /^[A-Za-z0-9._-]+$/;
    const RESERVED_OWNERS = new Set([
      'settings', 'orgs', 'users', 'marketplace', 'topics', 'collections', 'sponsors',
      'notifications', 'new', 'login', 'join', 'features', 'about', 'pricing', 'explore',
      'search', 'apps', 'codespaces', 'dashboard', 'issues', 'pulls', 'trending', 'site',
      'security', 'enterprise',
    ]);

    const isRepositoryOwner = (value) => REPOSITORY_OWNER.test(value) && !RESERVED_OWNERS.has(value.toLowerCase());
    const isRepositoryName = (value) => REPOSITORY_NAME.test(value) && value !== '.' && value !== '..' && !/^\.+$/.test(value);

    function normalizeRepository(value) {
      let text = String(value || '').trim();
      if (!text) return '';
      text = text.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
      text = text.replace(/^git@[^/:]+[:/]/i, '');
      text = text.replace(/^www\./i, '');
      text = text.replace(/^github\.com\//i, '');
      text = text.replace(/^\/+/, '');
      text = text.replace(/[?#].*$/, '');
      text = text.replace(/\/+$/, '');
      text = text.replace(/(?:\.git)+$/i, '');
      const strict = /^([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/.exec(text);
      if (strict && isRepositoryOwner(strict[1]) && isRepositoryName(strict[2])) return `${strict[1]}/${strict[2]}`;
      const parts = text.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const owner = parts[0];
        const name = parts[1].replace(/(?:\.git)+$/i, '');
        if (isRepositoryOwner(owner) && isRepositoryName(name)) return `${owner}/${name}`;
      }
      return '';
    }

    /* The only thing a person supplies is the repository: the instance id, the
     * display name, and the port all follow from it and the current manifest. */
    function deriveInstance(repository, instances) {
      const name = repository.split('/')[1];
      let base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (!base) base = 'instance';
      if (!/^[a-z]/.test(base)) base = `sa-${base}`;
      base = base.slice(0, 48).replace(/-+$/g, '') || 'instance';
      const used = new Set((instances || []).map((instance) => instance.id));
      let id = base;
      let suffix = 2;
      while (used.has(id)) {
        id = `${base}-${suffix}`;
        suffix += 1;
      }
      return { id, name, repository, port: Number(suggestPort(instances)) };
    }

    function validateRepository(input, instances, t) {
      const repository = normalizeRepository(input);
      if (!repository) return { error: t('invalidRepository') };
      const lower = repository.toLowerCase();
      if ((instances || []).some((instance) => String(instance.repository || '').toLowerCase() === lower)) {
        return { error: t('repositoryTaken') };
      }
      return { repository };
    }

    function CreateDialog({ t, instances, onClose, onCreated, notify }) {
      const [value, setValue] = useState('');
      const [error, setError] = useState(null);
      const [busy, setBusy] = useState(false);

      const submit = async (event) => {
        event.preventDefault();
        if (busy) return;
        const checked = validateRepository(value, instances, t);
        if (checked.error) {
          setError(checked.error);
          const input = document.getElementById('sam-create-repository');
          if (input) input.focus();
          return;
        }
        const created = deriveInstance(checked.repository, instances);
        setBusy(true);
        setError(null);
        try {
          await api('instances', { method: 'POST', body: JSON.stringify(created) });
          notify('success', tr(t, 'registered', { name: created.name, id: created.id }));
          onCreated();
        } catch (failure) {
          setError(cleanMessage(failure, 800));
        } finally {
          setBusy(false);
        }
      };

      return h(Modal, {
        t,
        title: t('newInstance'),
        onClose,
        busy,
        footer: h(React.Fragment, null,
          h(Button, { size: 'lg', variant: 'outline', onClick: onClose, disabled: busy }, t('cancel')),
          h(Button, { size: 'lg', variant: 'primary', type: 'submit', form: 'sam-create-form', busy, disabled: busy }, t('create'))),
      },
      h('form', { className: 'sam-form', id: 'sam-create-form', onSubmit: submit, noValidate: true },
        h('div', { className: 'sam-field' },
          h('label', { className: 'sam-label', htmlFor: 'sam-create-repository' }, t('fieldRepository')),
          h('input', {
            className: 'sam-input',
            id: 'sam-create-repository',
            value,
            readOnly: busy,
            'aria-busy': busy ? 'true' : undefined,
            onChange: (event) => {
              setValue(event.target.value);
              setError(null);
            },
            onKeyDown: (event) => {
              if (event.key !== 'Enter' || busy) return;
              if (event.nativeEvent && event.nativeEvent.isComposing) return;
              event.preventDefault();
              void submit(event);
            },
            placeholder: t('fieldRepositoryPlaceholder'),
            autoFocus: true,
            autoComplete: 'off',
            autoCapitalize: 'off',
            autoCorrect: 'off',
            spellCheck: false,
            'aria-invalid': error ? 'true' : undefined,
            'aria-describedby': error ? 'sam-create-repository-error' : undefined,
          }),
          error ? h('span', { className: 'sam-hint', 'data-tone': 'error', id: 'sam-create-repository-error', role: 'alert' }, error) : null)));
    }

    function DestroyDialog({ t, instance, onClose, onDestroyed, notify }) {
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState(null);

      const destroy = async () => {
        if (busy) return;
        setBusy(true);
        setError(null);
        try {
          await api(`instances/${instance.id}`, { method: 'DELETE' });
          notify('success', tr(t, 'doneDestroy', { name: instance.name }));
          onDestroyed();
        } catch (failure) {
          setError(cleanMessage(failure));
        } finally {
          setBusy(false);
        }
      };

      return h(Modal, {
        t,
        title: tr(t, 'confirmDestroyTitle', { name: instance.name, id: instance.id }),
        description: tr(t, 'confirmDestroy', { repository: instance.repository || instance.id }),
        onClose,
        busy,
        footer: h(React.Fragment, null,
          h(Button, { size: 'lg', variant: 'outline', onClick: onClose, disabled: busy, autoFocus: true }, t('cancel')),
          h(Button, { size: 'lg', variant: 'danger', busy, disabled: busy, onClick: destroy }, t('destroy'))),
      },
      error ? h(AlertLine, { tone: 'error' }, error) : null);
    }

    /* --- instance row ---------------------------------------------------- */

    function LoadMeter({ load, t }) {
      const running = Math.max(0, Number(load.running) || 0);
      const queued = Math.max(0, Number(load.queued) || 0);
      const rawMax = Number(load.maxWorkers);
      const hasMax = Number.isFinite(rawMax) && rawMax > 0;
      const max = hasMax ? rawMax : Math.max(1, running + queued);
      const runningPercent = Math.min(100, Math.round((running / max) * 100));
      const queuedPercent = Math.min(100 - runningPercent, Math.round((queued / max) * 100));
      const visible = [];
      if (running) visible.push(tr(t, 'loadRunning', { count: running }));
      if (queued) visible.push(tr(t, 'loadQueued', { count: queued }));
      const text = visible.length ? visible.join(' · ') : '';
      if (!text) return null;
      const full = hasMax ? `${text} · ${tr(t, 'loadMax', { max })}` : text;

      return h('div', { className: 'sam-load', role: 'img', 'aria-label': full, title: full },
        h('span', { className: 'sam-load-text' }, text),
        h('span', { className: 'sam-load-track', 'aria-hidden': true },
          h('span', { className: 'sam-load-running', style: { width: `${runningPercent}%` } }),
          h('span', { className: 'sam-load-queued', style: { width: `${queuedPercent}%` } })));
    }

    function HealthList({ instance, t }) {
      /* Only a subsystem that is not fine earns a line: a healthy row stays as
       * quiet as a native list row, and an unhealthy one names the part. */
      const entries = healthEntries(instance).filter(([, value]) => healthTone(value) !== 'success');
      if (!entries.length) return null;
      return h('div', { className: 'sam-health' }, entries.map(([key, value]) => {
        const tone = healthTone(value);
        return h('span', { key, className: 'sam-health-item', 'data-tone': tone, title: `${key}: ${healthLabel(value, t)}` },
          h(StateDot, { tone }),
          h('span', { className: 'sam-health-key' }, key),
          h('span', { className: 'sam-health-state' }, healthLabel(value, t)));
      }));
    }

    function ChatList({ chats, t }) {
      if (!chats.length) return null;
      const visible = chats.slice(0, 3);
      const rest = chats.slice(3);
      return h('div', { className: 'sam-chats', role: 'group', 'aria-label': t('chats') },
        visible.map((chat) => h('span', { key: chat, className: 'sam-chat', title: chat },
          h('span', { className: 'sam-chat-hash', 'aria-hidden': true }, '#'),
          h('span', { className: 'sam-chat-name' }, chat))),
        rest.length ? h('span', { key: 'rest', className: 'sam-chat', title: rest.join(', ') }, `+${rest.length}`) : null);
    }

    function InstanceRow({ instance, t, onRefresh, notify, onDestroy }) {
      const [busy, setBusy] = useState(null);
      const [note, setNote] = useState(null);

      /* An action's captured error is useful while it is recent; after that the
       * row's live state is the truth, so the red line clears itself. */
      useEffect(() => {
        if (!note) return undefined;
        const timer = window.setTimeout(() => setNote(null), 10000);
        return () => window.clearTimeout(timer);
      }, [note]);

      const tone = instanceTone(instance);
      const detail = detailText(instance, t);
      const running = instance.running;
      const provisioned = typeof instance.provisioned === 'boolean'
        ? instance.provisioned
        : !/wrapper script not found/i.test(String(instance.detail || ''));
      const setupPending = !provisioned && !running;
      const starting = healthEntries(instance).some(([, value]) => /^(starting|pending|queued|loading)$/i.test(value));
      const label = setupPending ? t('stateSetup') : starting ? t('stateStarting') : stateLabel(tone, t);
      const detailTone = setupPending ? 'warning' : 'error';
      const nameId = `sam-instance-${instance.id}-name`;

      const act = async (action, doneKey) => {
        setBusy(action);
        setNote(null);
        try {
          const result = await api(`instances/${instance.id}/${action}`, { method: 'POST' });
          if (result && typeof result.exitCode === 'number' && result.exitCode !== 0) {
            const message = cleanMessage(result.error || `exit ${result.exitCode}`);
            setNote(message);
            notify('error', tr(t, 'actionFailed', { error: message }));
          } else {
            notify('success', tr(t, doneKey, { name: instance.name }));
          }
        } catch (error) {
          const message = cleanMessage(error);
          setNote(message);
          notify('error', tr(t, 'actionFailed', { error: message }));
        } finally {
          setBusy(null);
          onRefresh();
        }
      };

      const openPanel = async () => {
        setBusy('panel');
        setNote(null);
        try {
          const result = await api(`panel/${instance.id}`);
          const url = String(result && result.url || '');
          if (!/^https?:\/\//i.test(url)) throw new Error('panel URL missing');
          /* Preferred: the app's built-in sidebar browser tab — the same route
           * chat external links take (ctx.sidebarRight.openTab('browser')).
           * Fallback: window.open with the real URL; the desktop shell hands
           * http(s) links to the system browser via shell.openExternal. Both
           * happen without any popup permission, so the old "allow pop-ups"
           * dead end is gone. */
          const sidebarRight = openInSidebarTab(url);
          if (!sidebarRight) window.open(url, '_blank', 'noopener,noreferrer');
        } catch (error) {
          const message = cleanMessage(error);
          setNote(message);
          notify('error', tr(t, 'actionFailed', { error: message }));
        } finally {
          setBusy(null);
        }
      };

      const loadRunning = running && instance.load ? Math.max(0, Number(instance.load.running) || 0) : 0;
      const loadQueued = running && instance.load ? Math.max(0, Number(instance.load.queued) || 0) : 0;
      const hasLoad = Boolean(instance.load) && (loadRunning > 0 || loadQueued > 0);
      const showDetail = Boolean(detail) && (tone === 'error' || setupPending);

      const hasDetails = Boolean(
        hasLoad
        || healthEntries(instance).some(([, value]) => healthTone(value) !== 'success')
        || (instance.chats && instance.chats.length)
        || instance.setup
        || showDetail
        || note);

      return h('li', { className: 'sam-row', 'aria-labelledby': nameId, 'aria-busy': busy ? 'true' : undefined },
        h('div', { className: 'sam-row-line' },
          h('div', { className: 'sam-row-icon' }, h(Icon, { name: 'robot', size: 20 })),
          h('div', { className: 'sam-row-main' },
            h('div', { className: 'sam-row-title' },
              h('span', { className: 'sam-name', id: nameId, title: instance.id }, instance.name)),
            h('div', { className: 'sam-row-meta' },
              h('span', { className: 'sam-mono', title: `${t('port')} ${instance.port}`, 'aria-label': `${t('port')} ${instance.port}` }, `:${instance.port}`),
              instance.repository ? h(React.Fragment, null,
                h('span', { className: 'sam-meta-sep', 'aria-hidden': true }, '·'),
                h('span', null, instance.repository)) : null,
              !running && detail && tone !== 'error' && !setupPending ? h(React.Fragment, null,
                h('span', { className: 'sam-meta-sep', 'aria-hidden': true }, '·'),
                h('span', null, detail)) : null)),
          h('div', { className: 'sam-row-end' },
            h('span', { className: 'sam-state', 'data-tone': tone, title: label },
              h(StateDot, { tone }),
              tone === 'warning' || tone === 'error' ? label : h('span', { className: 'sam-sr' }, label)),
            running ? h(Button, {
              size: 'sm',
              variant: 'outline',
              icon: 'external',
              busy: busy === 'panel',
              disabled: Boolean(busy),
              onClick: openPanel,
              ariaLabel: `${t('openPanel')} ${instance.name}`,
            }, t('openPanel')) : null,
            running
              ? h(IconButton, {
                icon: 'restart',
                label: `${t('restart')} ${instance.name}`,
                busy: busy === 'restart',
                disabled: Boolean(busy),
                onClick: () => act('restart', 'doneRestart'),
              })
              : null,
            provisioned ? h(IconButton, {
              icon: running ? 'stop' : 'play',
              label: `${running ? t('stop') : t('start')} ${instance.name}`,
              busy: busy === 'stop' || busy === 'start',
              disabled: Boolean(busy),
              onClick: () => act(running ? 'stop' : 'start', running ? 'doneStop' : 'doneStart'),
            }) : null,
            h(IconButton, {
              icon: 'trash',
              label: `${t('destroy')} ${instance.name}`,
              tone: 'danger',
              disabled: Boolean(busy),
              onClick: () => onDestroy(instance),
            }))),
        hasDetails ? h('div', { className: 'sam-details' },
          hasLoad ? h(LoadMeter, { load: instance.load, t }) : null,
          h(HealthList, { instance, t }),
          h(ChatList, { chats: instance.chats || [], t }),
          instance.setup ? h(AlertLine, { tone: 'warning' },
            `${t('setupProblem')}: ${instance.setup.detail || instance.setup.code || ''}`) : null,
          showDetail ? h(AlertLine, { tone: detailTone, live: false }, detail) : null,
          note ? h(AlertLine, { tone: 'error', live: false }, note) : null) : null);
    }

    /* --- page ------------------------------------------------------------ */

    const Group = ({ id, title, count, children }) =>
      h('section', { className: 'sam-group', 'aria-labelledby': id },
        h('div', { className: 'sam-group-head' },
          h('h2', { className: 'sam-group-title', id, 'aria-label': `${title} (${count})` },
            title,
            h('span', { className: 'sam-group-count', 'aria-hidden': true }, String(count)))),
        h('ul', { className: 'sam-rows' }, children));

    const SkeletonRows = ({ t }) =>
      h('div', { className: 'sam-rows', 'aria-busy': 'true' },
        h('span', { className: 'sam-sr', role: 'status' }, t('loading')),
        [0, 1].map((index) => h('div', { key: index, className: 'sam-skeleton-row', 'aria-hidden': true },
          h('div', { className: 'sam-skeleton-icon sam-skeleton-fill' }),
          h('div', { className: 'sam-skeleton-lines' },
            h('div', { className: 'sam-skeleton-bar sam-skeleton-fill', style: { width: index ? '38%' : '46%' } }),
            h('div', { className: 'sam-skeleton-bar sam-skeleton-fill', style: { width: index ? '62%' : '68%' } })))));

    const Empty = ({ t, onCreate }) =>
      h('div', { className: 'sam-empty' },
        h('div', { className: 'sam-empty-icon' }, h(Icon, { name: 'robot', size: 22 })),
        h('h2', { className: 'sam-empty-title' }, t('emptyTitle')),
        h(Button, { variant: 'primary', icon: 'plus', onClick: onCreate }, t('newInstance')));

    const Toast = ({ toast, onClose }) => {
      useEffect(() => {
        if (!toast) return undefined;
        const timer = window.setTimeout(onClose, toast.tone === 'error' ? 8000 : 5000);
        return () => window.clearTimeout(timer);
      }, [toast, onClose]);

      if (!toast) return null;
      return h('div', {
        className: 'sam-toast',
        role: toast.tone === 'error' ? 'alert' : 'status',
        'aria-atomic': 'true',
        style: { '--sam-toast-hold': toast.tone === 'error' ? '7s' : '4s' },
      },
      h('span', { className: 'sam-toast-icon', 'data-tone': toast.tone },
        h(Icon, { name: toast.tone === 'error' ? 'alert' : 'check', size: 16 })),
      h('span', { className: 'sam-toast-msg' }, toast.message));
    };

    function Manager({ t }) {
      const { data, error, refreshing, refresh } = useInstances();
      const [creating, setCreating] = useState(false);
      const [destroying, setDestroying] = useState(null);
      const [toast, setToast] = useState(null);

      const notify = useCallback((tone, message) => {
        setToast({ id: Date.now() + Math.random(), tone, message: cleanMessage(message, 400) });
      }, []);
      const dismissToast = useCallback(() => setToast(null), []);
      const modalOpen = Boolean(creating || destroying);

      const instances = data && Array.isArray(data.instances) ? data.instances : [];

      const groups = useMemo(() => {
        const attention = [];
        const running = [];
        const stopped = [];
        for (const instance of instances) {
          const tone = instanceTone(instance);
          if (tone === 'error' || tone === 'warning') attention.push(instance);
          else if (tone === 'success') running.push(instance);
          else stopped.push(instance);
        }
        return { attention, running, stopped };
      }, [data]);

      const openCreate = useCallback(() => setCreating(true), []);
      const closeCreate = useCallback(() => setCreating(false), []);
      const created = useCallback(() => {
        setCreating(false);
        void refresh();
      }, [refresh]);
      const closeDestroy = useCallback(() => setDestroying(null), []);
      const destroyed = useCallback(() => {
        setDestroying(null);
        void refresh();
      }, [refresh]);

      const retry = h(Button, { size: 'sm', variant: 'outline', icon: 'refresh', busy: refreshing, onClick: refresh }, t('retry'));
      const stale = Boolean(data);

      return h(React.Fragment, null,
        h('style', { key: 'sam-styles' }, CSS),
        h('div', { className: 'sam-page' },
          h('div', { className: 'sam-column', inert: modalOpen ? '' : undefined },
            h('div', { className: 'sam-head-bar', 'data-window-drag': true },
              h('header', { className: 'sam-head' },
                h('h1', { className: 'sam-title' }, t('panel')),
                h('div', { className: 'sam-toolbar' },
                  h(IconButton, {
                    icon: 'refresh',
                    label: refreshing ? t('refreshing') : t('refresh'),
                    spinning: refreshing,
                    disabled: refreshing,
                    onClick: refresh,
                  }),
                  h(Button, { variant: 'primary', icon: 'plus', onClick: openCreate }, t('newInstance'))))),
            data && data.watchdogInstalled === false
              ? h(Banner, { tone: 'warning', title: t('watchdogMissing'), message: t('watchdogMissingHint') })
              : null,
            error
              ? h(Banner, {
                tone: 'error',
                title: stale ? t('refreshFailed') : t('offline'),
                message: error,
                hint: stale ? t('staleHint') : null,
                action: retry,
              })
              : null,
            !data && !error
              ? h(SkeletonRows, { t })
              : data && instances.length === 0
                ? h(Empty, { t, onCreate: openCreate })
                : h(React.Fragment, null,
                  groups.attention.length
                    ? h(Group, { id: 'sam-group-attention', title: t('groupAttention'), count: groups.attention.length },
                      groups.attention.map((instance) => h(InstanceRow, {
                        key: instance.id, instance, t, notify, onRefresh: refresh, onDestroy: setDestroying,
                      })))
                    : null,
                  groups.running.length
                    ? h(Group, { id: 'sam-group-running', title: t('groupRunning'), count: groups.running.length },
                      groups.running.map((instance) => h(InstanceRow, {
                        key: instance.id, instance, t, notify, onRefresh: refresh, onDestroy: setDestroying,
                      })))
                    : null,
                  groups.stopped.length
                    ? h(Group, { id: 'sam-group-stopped', title: t('groupStopped'), count: groups.stopped.length },
                      groups.stopped.map((instance) => h(InstanceRow, {
                        key: instance.id, instance, t, notify, onRefresh: refresh, onDestroy: setDestroying,
                      })))
                    : null)),
            creating
              ? h(CreateDialog, {
                t, instances, onClose: closeCreate, onCreated: created, notify,
              })
              : null,
            destroying
              ? h(DestroyDialog, {
                t, instance: destroying, onClose: closeDestroy, onDestroyed: destroyed, notify,
              })
              : null,
            toast ? h(Toast, { key: toast.id, toast, onClose: dismissToast }) : null));
    }

    /* --- dictionaries ---------------------------------------------------- */

    const dictionaries = {
      zh: {
        panel: 'Super-agent 实例',
        refresh: '刷新',
        refreshing: '正在刷新',
        newInstance: '新建实例',
        groupAttention: '需要处理',
        groupRunning: '运行中',
        groupStopped: '已停止',
        stateHealthy: '运行中',
        stateDegraded: '部分降级',
        stateError: '异常',
        stateStarting: '启动中',
        stateSetup: '需置备',
        stateStopped: '已停止',
        port: '端口',
        chats: '监听群',
        loadRunning: '{count} 运行',
        loadQueued: '{count} 排队',
        loadMax: '上限 {max}',
        setupProblem: '待配置',
        detailManuallyStopped: '手动停止',
        detailNotAnswering: '无响应',
        detailNoWrapper: '还没有包装命令：{path}。按插件说明完成置备。',
        detailStateUnavailable: '状态不可用：{error}',
        healthOk: '正常',
        healthPaused: '已暂停',
        healthStarting: '启动中',
        healthError: '异常',
        healthUnknown: '未知',
        openPanel: '打开面板',
        restart: '重启',
        stop: '停止',
        start: '启动',
        destroy: '销毁',
        confirmDestroyTitle: '销毁 {name}（{id}）？',
        confirmDestroy: '将停止 {repository} 并删除其 DSH_HOME；状态库与代码克隆会保留。',
        create: '创建',
        cancel: '取消',
        close: '关闭',
        emptyTitle: '还没有实例',
        offline: '管理接口不可用',
        refreshFailed: '刷新失败',
        staleHint: '显示上次读取到的状态。',
        retry: '重试',
        watchdogMissing: '未安装看门狗',
        watchdogMissingHint: '停止的实例不会自动拉起。',
        loading: '正在加载实例',
        actionFailed: '操作失败：{error}',
        doneStart: '{name} 已启动',
        doneStop: '{name} 已停止',
        doneRestart: '{name} 已重启',
        doneDestroy: '{name} 已销毁',
        registered: '已登记 {name}（{id}）。按插件说明完成置备。',
        popupBlocked: '面板未能打开：{url}',
        fieldRepository: 'GitHub 仓库',
        fieldRepositoryPlaceholder: 'owner/name 或 GitHub 链接',
        invalidRepository: '输入 owner/name 或 GitHub 链接。',
        repositoryTaken: '这个仓库已经在管理中了。',
      },
      en: {
        panel: 'Super-agent instances',
        refresh: 'Refresh',
        refreshing: 'Refreshing',
        newInstance: 'New instance',
        groupAttention: 'Needs attention',
        groupRunning: 'Running',
        groupStopped: 'Stopped',
        stateHealthy: 'Running',
        stateDegraded: 'Degraded',
        stateError: 'Error',
        stateStarting: 'Starting',
        stateSetup: 'Setup',
        stateStopped: 'Stopped',
        port: 'Port',
        chats: 'Chats',
        loadRunning: '{count} running',
        loadQueued: '{count} queued',
        loadMax: 'max {max}',
        setupProblem: 'Setup needed',
        detailManuallyStopped: 'manually stopped',
        detailNotAnswering: 'not answering',
        detailNoWrapper: 'No wrapper yet: {path}. Complete setup from the plugin details.',
        detailStateUnavailable: 'State unavailable: {error}',
        healthOk: 'ok',
        healthPaused: 'paused',
        healthStarting: 'starting',
        healthError: 'error',
        healthUnknown: 'unknown',
        openPanel: 'Open panel',
        restart: 'Restart',
        stop: 'Stop',
        start: 'Start',
        destroy: 'Destroy',
        confirmDestroyTitle: 'Destroy {name} ({id})?',
        confirmDestroy: 'This stops {repository} and removes its DSH_HOME. The state database and code clones are kept.',
        create: 'Create',
        cancel: 'Cancel',
        close: 'Close',
        emptyTitle: 'No instances yet',
        offline: 'Management API unavailable',
        refreshFailed: "Couldn't refresh",
        staleHint: 'Showing the last known state.',
        retry: 'Retry',
        watchdogMissing: 'Watchdog not installed',
        watchdogMissingHint: "Stopped instances won't be restarted automatically.",
        loading: 'Loading instances',
        actionFailed: 'Action failed: {error}',
        doneStart: '{name} started',
        doneStop: '{name} stopped',
        doneRestart: '{name} restarted',
        doneDestroy: '{name} destroyed',
        registered: 'Registered {name} ({id}). Complete setup from the plugin details.',
        popupBlocked: 'Panel did not open: {url}',
        fieldRepository: 'GitHub repository',
        fieldRepositoryPlaceholder: 'owner/name or GitHub URL',
        invalidRepository: 'Enter owner/name or a GitHub URL.',
        repositoryTaken: 'This repository is already managed.',
      },
    };

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        hostCtx = ctx;
        ctx.effect(() => ctx.locale.register(NS, dictionaries), 'superagent-manager: locale');
        // bind() returns the stable translate function for the namespace; the
        // framework also injects `t` into registered components via `locale: NS`.
        const t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main', key: PANEL_ID, locale: NS,
        }, (props) => h(Manager, { t: props.t || t }))), 'superagent-manager: main panel');
        ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: PANEL_ID, order: 11, locale: NS, label: () => t('panel'),
        }, BotIcon)), 'superagent-manager: sidebar entry');
      },
    };
  },
});
