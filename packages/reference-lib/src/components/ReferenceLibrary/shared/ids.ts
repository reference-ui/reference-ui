/**
 * Stable host ids for ReferenceLibrary mounts. `nextLibraryHostId` mints a
 * fresh `ref-lib-N` handle per mount so the election registry can tell sibling
 * roots apart; ids only need process-wide uniqueness, so a module counter is
 * the whole implementation, and each mount captures its id in a ref on first
 * render so StrictMode replays and rerenders never re-mint.
 */
let libraryIdCounter = 0

export function nextLibraryHostId(): string {
  libraryIdCounter += 1
  return `ref-lib-${libraryIdCounter}`
}
