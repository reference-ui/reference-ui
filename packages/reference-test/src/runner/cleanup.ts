/**
 * Resource cleanup coordination.
 * Tracks processes, dev server, ports. Ensures cleanup on test failure.
 */

const resources: Array<{ name: string; cleanup: () => Promise<void> }> = []

export function registerCleanup(name: string, cleanup: () => Promise<void>): void {
  resources.push({ name, cleanup })
}

export async function runCleanup(): Promise<void> {
  for (const { name, cleanup } of resources.reverse()) {
    try {
      await cleanup()
    } catch (err) {
      console.error(`Cleanup failed for ${name}:`, err)
    }
  }
  resources.length = 0
}
