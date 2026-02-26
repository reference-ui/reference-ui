/**
 * Global teardown - force exit if process hangs.
 * Prevents vitest from hanging indefinitely when open handles (Playwright, dev servers) remain.
 */
export default function teardown() {
  setTimeout(() => process.exit(0), 2000)
}
