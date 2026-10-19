# hooks

The AnnouncerHost lifecycle as one session hook: claim the host
election, register the document for untargeted resolution, subscribe to
the store, and replay pending pre-mount speech — then release,
unsubscribe, and reset on unmount. The hook returns the host ref, the
stable election id, and the resolved document; rendering stays in the
root, and every decision it wraps lives in `store.ts` or `host/`.

Up: [Announcer](../README.md).
