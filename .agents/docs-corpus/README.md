# docs-corpus

The tooling for the `docs-corpus` Memex collection is tracked in this folder. Its data is gitignored under `vendor/docs/`: the source clones, `manifest.json` and `_normalized/`.

`clone.sh` makes the sparse clones in `vendor/docs/<source>/` and writes the manifest; `normalize/` turns the clones into `vendor/docs/_normalized/` plus the search index Memex loads (see `normalize/README.md`).

The corpus is a read-only reference of other design systems' docs source (MDX/MD), with their demo and nav-config source and first-party `llms*.txt` files.
Use it to study structure, topic coverage and voice, such as how production systems write getting-started and guide pages.
Our docs must never copy prose from it. Licences are mixed: see `vendor/docs/manifest.json` for each source's commit, SPDX licence and extras (tailwind declares none).
Each folder is a sparse, depth-1 git clone; images, video and lockfiles are removed; `llms/` holds the fetched `llms*.txt` files.
Re-run with `bash .agents/docs-corpus/clone.sh` to refresh every clone, the llms files and the manifest, or name sources to refresh only those (`bash .agents/docs-corpus/clone.sh radix tailwind`).
`radix/themes-src` is a companion clone of radix-ui/themes, nested in the radix folder and listed in radix's manifest entry.
