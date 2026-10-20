# Shared native helpers

Path, target, contract, and freshness logic shared by the loader and the pack tooling. `targets.ts` maps host platform keys to Rust triples and distribution package names; `native-contract.ts` composes the host export requirement with each product's native export manifest; `native-inputs.ts` hashes exactly the files Cargo reads (manifests, lockfile, Rust sources) with package-relative framing so stamps stay portable; `native-freshness.ts` compares and records those stamps through pure path-in functions; `paths.ts` anchors the package roots and artifact directories.
