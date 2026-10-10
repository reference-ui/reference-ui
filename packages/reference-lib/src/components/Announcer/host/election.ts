/**
 * Announcer's single-host election: two AnnouncerHost trees on one document
 * would double-speak, so the first mount to claim a document wins and every
 * later mount stays silent until the winner releases. Keyed by Document in
 * a WeakMap so iframe documents elect independently and collect cleanly.
 * The host hook claims on mount and releases on unmount; rendering reads
 * the winner through getPrimaryHost.
 */

const activePrimaryHosts = new WeakMap<Document, string>()

export function claimPrimaryHost(doc: Document, hostId: string): boolean {
  const currentPrimary = activePrimaryHosts.get(doc)
  if (!currentPrimary) {
    activePrimaryHosts.set(doc, hostId)
    return true
  }
  return currentPrimary === hostId
}

export function releasePrimaryHost(doc: Document, hostId: string) {
  if (activePrimaryHosts.get(doc) === hostId) {
    activePrimaryHosts.delete(doc)
  }
}

export function getPrimaryHost(doc: Document): string | undefined {
  return activePrimaryHosts.get(doc)
}
