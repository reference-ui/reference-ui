# TST-IMP-09 — A type re-exported from another package is emitted with its members, JSDoc and @default tags

`export type { IconProps, IconTone } from 'tasty-case-acme-icons'` in a scanned file follows the re-export through the package's own
declaration files (`index.d.ts` re-exporting `./types`). The symbol lands in the index under the package's library name with its
description, every member's description and `@default` tag, and the types it names, so a library can document a type it only
re-exports, without declaring it a second time.

The package is the fixture `tests/node_modules/tasty-case-acme-icons`, committed with `git add -f` because package resolution
walks up from the scan root (`tests/`), never from the case folder.
