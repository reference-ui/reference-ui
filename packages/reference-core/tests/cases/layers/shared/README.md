# CORE-LAYERS shared upstream helper

Syncs a real upstream for real, reads the baseSystem it published, rewrites the consumer config to import and list each upstream under extends or layers, and restores the canonical spelling with a resync. Emits the published-system reader, the config rewriter, the served sheet reader, and the layer block span; each case states its own wiring and claims.
