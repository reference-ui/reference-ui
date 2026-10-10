# election

One document, one host. Every mount registers, the earliest live registration
wins, and a departing winner hands ownership to the next live mount in the same
document — standby mounts render nothing but their children, so runtime DOM
never duplicates across microfrontend roots. Elections are document-scoped by
construction: per-document stores hang off `globalThis`, which keeps iframe
documents independent and keeps server renders (no document, ephemeral store)
from ever electing. The hook drives registration and subscription; this module
owns the registry and the transitions, and its tests prove them against fake
documents with no browser involved.
