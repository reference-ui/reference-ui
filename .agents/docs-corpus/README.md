# docs-corpus

The tooling for the `docs-corpus` memex collection is tracked in this folder. Its data is gitignored vendor state: the source clones, the manifest, and the normalized output.

`clone.sh` makes the sparse per-source clones and writes the manifest; the normalizer turns the clones into normalized Markdown plus the records file the memex CLI reads (see the normalizer readme). Search it with `memex search <words> --in docs-corpus`, narrow to one library with `source:<name>`, and read a hit with `memex show docs-corpus:<id>`.

The corpus is a read-only reference of other design systems' docs source (MDX/MD), with their demo and nav-config source and first-party `llms*.txt` files.
Use it to study structure, topic coverage and voice, such as how production systems write getting-started and guide pages.
Our docs must never copy prose from it. Licences are mixed: see the manifest for each source's commit, SPDX licence and extras (tailwind declares none).
Each source is a sparse, depth-1 git clone; images, video and lockfiles are removed; fetched llms files sit beside it.
Re-run with `bash .agents/docs-corpus/clone.sh` to refresh every clone, the llms files and the manifest, or name sources to refresh only those (`bash .agents/docs-corpus/clone.sh radix tailwind`).
The radix source includes a companion clone of radix-ui/themes, nested inside it and listed in its manifest entry.
