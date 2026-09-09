export const TOAST_HOST_STYLES = `
[data-reference-toast-host] {
  --reference-toast-bg: #fff;
  --reference-toast-fg: #171717;
  --reference-toast-border: #ededed;
  --reference-toast-desc: #3f3f46;
  --reference-toast-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --reference-toast-close-bg: #fff;
  --reference-toast-close-border: #ededed;
  --reference-toast-action-bg: #171717;
  --reference-toast-action-fg: #fff;
  --reference-toast-cancel-bg: #f4f4f4;
  --reference-toast-cancel-fg: #171717;
  --reference-toast-focus: #171717;
}

[data-reference-toast-host][data-theme="dark"] {
  --reference-toast-bg: #000;
  --reference-toast-fg: #fff;
  --reference-toast-border: #262626;
  --reference-toast-desc: #a1a1aa;
  --reference-toast-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  --reference-toast-close-bg: #000;
  --reference-toast-close-border: #262626;
  --reference-toast-action-bg: #fff;
  --reference-toast-action-fg: #171717;
  --reference-toast-cancel-bg: #262626;
  --reference-toast-cancel-fg: #fff;
  --reference-toast-focus: #fff;
}

@media (prefers-color-scheme: dark) {
  [data-reference-toast-host][data-theme="system"] {
    --reference-toast-bg: #000;
    --reference-toast-fg: #fff;
    --reference-toast-border: #262626;
    --reference-toast-desc: #a1a1aa;
    --reference-toast-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    --reference-toast-close-bg: #000;
    --reference-toast-close-border: #262626;
    --reference-toast-action-bg: #fff;
    --reference-toast-action-fg: #171717;
    --reference-toast-cancel-bg: #262626;
    --reference-toast-cancel-fg: #fff;
    --reference-toast-focus: #fff;
  }
}

[data-reference-toast-id] {
  --reference-toast-swipe-x: 0px;
  --reference-toast-swipe-y: 0px;
  --reference-toast-offset: 0px;
  --reference-toast-scale: 1;
  --reference-toast-enter: 0px;
  transform: translate3d(
      var(--reference-toast-swipe-x),
      calc(var(--reference-toast-offset) + var(--reference-toast-enter) + var(--reference-toast-swipe-y)),
      0
    )
    scale(var(--reference-toast-scale));
  transform-origin: var(--reference-toast-origin, bottom center);
  opacity: 1;
  transition:
    transform 400ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 400ms ease;
  user-select: none;
}

[data-reference-toast-id][data-y="bottom"][data-state="closed"]:not([data-swipe-out="true"]) {
  --reference-toast-enter: 100%;
  opacity: 0;
}

[data-reference-toast-id][data-y="top"][data-state="closed"]:not([data-swipe-out="true"]) {
  --reference-toast-enter: -100%;
  opacity: 0;
}

[data-reference-toast-id][data-state="open"] {
  --reference-toast-enter: 0px;
  opacity: 1;
}

[data-reference-toast-id][data-exiting="true"] {
  animation: reference-toast-exit 200ms ease forwards;
}

@keyframes reference-toast-exit {
  from { opacity: 1; }
  to { opacity: 0; }
}

[data-reference-toast-id][data-state="closed"] {
  transition:
    transform 200ms ease,
    opacity 200ms ease;
}

[data-reference-toast-id][data-swipe-out="true"] {
  opacity: 0;
  transition:
    transform 200ms ease,
    opacity 200ms ease;
}

[data-reference-toast-id][data-swiping="true"] {
  transition: none !important;
}

[data-reference-toast-id]:focus-visible,
[data-reference-toast-id]:focus {
  outline: 2px solid var(--reference-toast-focus) !important;
  outline-offset: 2px !important;
}

[data-reference-toast-position][data-expanded="false"] [data-front="false"] {
  height: var(--reference-front-height, 68px);
  overflow: hidden;
}

[data-reference-toast-position][data-expanded="false"] [data-front="false"] [data-reference-toast-title],
[data-reference-toast-position][data-expanded="false"] [data-front="false"] [data-reference-toast-description],
[data-reference-toast-position][data-expanded="false"] [data-front="false"] [data-reference-toast-action],
[data-reference-toast-position][data-expanded="false"] [data-front="false"] [data-reference-toast-cancel],
[data-reference-toast-position][data-expanded="false"] [data-front="false"] [data-reference-toast-close] {
  opacity: 0 !important;
  pointer-events: none !important;
}

[data-reference-toast-root] {
  box-sizing: border-box;
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  background: var(--reference-toast-bg);
  color: var(--reference-toast-fg);
  border: 1px solid var(--reference-toast-border);
  box-shadow: var(--reference-toast-shadow);
  position: relative;
}

[data-reference-toast-root][data-unstyled="true"] {
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: inherit;
}

[data-reference-toast-root][data-invert="true"] {
  background: #171717;
  color: #fff;
  border-color: #262626;
}

[data-reference-toast-host][data-theme="dark"] [data-reference-toast-root][data-invert="true"],
[data-reference-toast-host][data-theme="system"] [data-reference-toast-root][data-invert="true"] {
  background: #fff;
  color: #171717;
  border-color: #ededed;
}

@media (prefers-color-scheme: light) {
  [data-reference-toast-host][data-theme="system"] [data-reference-toast-root][data-invert="true"] {
    background: #171717;
    color: #fff;
    border-color: #262626;
  }
}

[data-reference-toast-title] {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: inherit;
}

[data-reference-toast-description] {
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--reference-toast-desc);
  user-select: text;
}

[data-reference-toast-close] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

[data-reference-toast-close][data-corner] {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: translate(-35%, -35%);
  padding: 0;
  border: 1px solid var(--reference-toast-close-border);
  background: var(--reference-toast-close-bg);
  z-index: 2;
}

[data-reference-toast-host][dir="rtl"] [data-reference-toast-close][data-corner],
[data-reference-toast-position][dir="rtl"] [data-reference-toast-close][data-corner] {
  left: auto;
  right: 0;
  transform: translate(35%, -35%);
}

[data-reference-toast-close][data-corner]:hover {
  background: var(--reference-toast-cancel-bg);
}

[data-reference-toast-close]:focus,
[data-reference-toast-close]:focus-visible {
  outline: 2px solid var(--reference-toast-focus) !important;
  outline-offset: 2px !important;
}

[data-reference-toast-action],
[data-reference-toast-cancel] {
  appearance: none;
  box-sizing: border-box;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

[data-reference-toast-action] {
  background: var(--reference-toast-action-bg);
  color: var(--reference-toast-action-fg);
}

[data-reference-toast-cancel] {
  background: var(--reference-toast-cancel-bg);
  color: var(--reference-toast-cancel-fg);
}

[data-reference-toast-icon] {
  position: relative;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

[data-reference-toast-icon] [data-reference-toast-loader],
[data-reference-toast-icon] [data-reference-toast-type-icon] {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 200ms ease;
}

[data-reference-toast-icon] [data-reference-toast-loader] {
  opacity: 0;
}

[data-reference-toast-icon] [data-reference-toast-type-icon] {
  opacity: 1;
}

[data-reference-toast-icon][data-type="loading"] [data-reference-toast-loader] {
  opacity: 1;
}

[data-reference-toast-icon][data-type="loading"] [data-reference-toast-type-icon] {
  opacity: 0;
}

[data-reference-toast-loader] {
  width: 16px;
  height: 16px;
}

[data-reference-toast-loader] span {
  position: absolute;
  left: 7px;
  top: 1px;
  width: 2px;
  height: 4px;
  border-radius: 1px;
  background: currentColor;
  transform-origin: center 7px;
  transform: rotate(calc(var(--index) * 30deg));
  animation: reference-toast-bar 1.2s linear infinite;
  animation-delay: calc(var(--index) * -0.1s);
  opacity: 0.25;
}

@keyframes reference-toast-bar {
  0% { opacity: 1; }
  100% { opacity: 0.15; }
}

[data-reference-toast-root][data-rich-colors="true"][data-type="success"] {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #052e16;
}

[data-reference-toast-root][data-rich-colors="true"][data-type="error"] {
  background: #fef2f2;
  border-color: #fecaca;
  color: #450a0a;
}

[data-reference-toast-root][data-rich-colors="true"][data-type="warning"] {
  background: #fffbeb;
  border-color: #fde68a;
  color: #451a03;
}

[data-reference-toast-root][data-rich-colors="true"][data-type="info"] {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #172554;
}

[data-reference-toast-root][data-rich-colors="true"][data-type="success"] [data-reference-toast-close][data-corner],
[data-reference-toast-root][data-rich-colors="true"][data-type="error"] [data-reference-toast-close][data-corner],
[data-reference-toast-root][data-rich-colors="true"][data-type="warning"] [data-reference-toast-close][data-corner],
[data-reference-toast-root][data-rich-colors="true"][data-type="info"] [data-reference-toast-close][data-corner] {
  background: inherit;
  color: inherit;
  border-color: inherit;
}

@media (prefers-reduced-motion: reduce) {
  [data-reference-toast-id] {
    transition: none !important;
    animation: none !important;
    --reference-toast-enter: 0px !important;
  }
  [data-reference-toast-id][data-state="open"] {
    opacity: 1;
  }
  [data-reference-toast-id][data-state="closed"] {
    opacity: 0;
  }
  [data-reference-toast-id][data-exiting="true"] {
    animation: none !important;
    opacity: 0 !important;
  }
  [data-reference-toast-loader] span {
    animation: none !important;
    opacity: 0.7;
  }
  [data-reference-toast-icon] [data-reference-toast-loader],
  [data-reference-toast-icon] [data-reference-toast-type-icon] {
    transition: none !important;
  }
}

[data-reference-toast-host][data-reduced-motion="true"] [data-reference-toast-id] {
  transition: none !important;
  animation: none !important;
  --reference-toast-enter: 0px !important;
}
`
