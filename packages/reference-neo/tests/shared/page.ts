// page.ts — the one home for the Playwright surface the harness and its specs touch.
// Playwright is an optional peer resolved only at run time, so these interfaces stay local
// instead of importing its types. The runner passes the real page; specs name only the members
// they call, importing these shapes rather than redeclaring rival copies of them.

// Structural view of the Playwright page surface the runner touches: navigation for setup,
// screenshots for artifacts and snapshots, and locator aria snapshots for a11y dumps
// (page.accessibility is gone in modern Playwright; ariaSnapshot is the API).
export interface SpecPage {
  goto(url: string, opts: { waitUntil: string }): Promise<unknown>;
  screenshot(opts: { path: string }): Promise<unknown>;
  viewportSize(): { width: number; height: number } | null;
  setViewportSize(size: { width: number; height: number }): Promise<void>;
  locator(selector: string): SpecLocator;
}

// Structural view of the locator surface specs assert through: wait for the node, read it,
// and measure it. Kept beside SpecPage so specs import one page module, not two.
export interface SpecLocator {
  waitFor(): Promise<void>;
  evaluate<T>(fn: (el: HTMLElement) => T): Promise<T>;
  boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>;
  ariaSnapshot(): Promise<string>;
}
