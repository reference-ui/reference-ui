# CORE-REF shared helpers

Readiness, freshness, and text reads every CORE-REF spec shares. Specs await tasty readiness or freshness explicitly — one-shot processes exit before the background build fires, resident ones land after — then query the manifest or read the rendered page, polling for an anchor so assertions never race the async document load.
