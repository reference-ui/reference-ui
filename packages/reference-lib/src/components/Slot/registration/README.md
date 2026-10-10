# registration

The live-content contract between fillers and the registry. A filler
registers exactly one container for its lifetime; this module builds
that container so every field — slot id, element, meta, visibility —
reads through getters to the filler's latest options.

That indirection is the whole point of the kernel's version discipline.
A new element identity every render is normal React, not news, so
content refreshes without re-registering, without a version bump, and
without notifying subscribers. Structural change (presence, slot id,
declared deps) still goes through an explicit in-place `register` from
the hook, which is the only path that moves the version.
