# CORE-TYPE-10 — lib props follow the consumer's synced system

A publisher named `@reference-ui/lib` declares an empty `SyncedSystem` register in its generated `react.d.mts` and types its public style names through it. A consumer whose `node_modules/@reference-ui/lib` resolves gets one `declare module '@reference-ui/lib'` fill from its own sync, pointing the register at its synced `StyleProps`. A `Div` imported from lib then takes that consumer's colour rules.

The case builds the whole fixture in a mkdtemp dir. The publisher manifest is named `@reference-ui/lib` and its `exports` types point at `./.reference-ui/react/react.d.mts`. Three consumers sit beside it: strict, open and unsynced. Each symlinks `node_modules/@reference-ui/lib` to the publisher, and the strict and open consumers are synced after the link. Each consumer file imports `Div` only from lib and sets `color="coreOffToken10"` on one line and a declared token (`brand`) on another.

The checks typecheck each consumer with the CORE-TYPE-01 options (NodeNext, `skipLibCheck` false, react shims):

- Strict, with `/// <reference types="@reference-ui/react" />` in the env types: the run fails, TS2322 names `coreOffToken10`, the only error sits on the off-token line, and nothing under the publisher path errors.
- Strict without the env line: exit 0. This pins the documented limitation: the fill lives in the consumer's generated react types, so a consumer that never loads them stays open. A lib-only app adds the env line or stays open.
- Open with the env line: exit 0. The fill is present, and open colours accept the value. Open carries the env line too, so the strict option is the only difference from the strict run.
- Unsynced, with no generated folder: exit 0. Lib's own open types apply with zero errors and no peer dependency.
- Sanity flip: the strict world with the `declare module` block stripped from its `react.d.mts`: exit 0. The register is what narrows, not the env line alone.

Evidence: commit `1a0ef649e` (role detection and the register emit), CORE-TYPE-01 (the tsc options and the consumer compile), CORE-TYPE-09 (strict colours narrow on JSX).

> Search terms: SyncedSystem, register, module augmentation, declare module, lib props, consumer types, publisher, consumer, strict colours, unsynced, env types, reference types, type/synced-register, CORE-TYPE-01, CORE-TYPE-09
