# system

The portable-system domain: what a system IS once published. A published
system is a name plus a fragment bundle plus a named fragment list plus a
portable sheet plus a roster — the BaseSystem shape every downstream extends
entry consumes. The named list (upstream first, own node last) is what extends
linearizes; the bundle string stays for readers that predate it. The
domain owns that shape and its assembly from discovery products plus config;
everything else hands it material or carries its output away.

NOT-owns: discovery and collection (collect), the native compile, the publish
act itself (the packager legs own the writes), and the runtime that reads the
published folder.
