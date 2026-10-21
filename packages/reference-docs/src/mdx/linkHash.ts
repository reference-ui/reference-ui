// Hash split for internal docs links.
// It takes an href such as `/global-css#the-reset` and emits the page path and the section hash
// as separate values. The router encodes a path param, so a hash left inside it arrives as %23;
// passed as the Link `hash` option, it stays a real fragment that scrolls to the heading.

/**
 * Splits an href at its first `#`. `hash` is absent when the href has none; otherwise it is the
 * text after the `#`, without the `#`.
 */
export function splitLinkHash(href: string): { path: string; hash?: string } {
  const at = href.indexOf('#')
  if (at === -1) return { path: href }
  return { path: href.slice(0, at), hash: href.slice(at + 1) }
}
