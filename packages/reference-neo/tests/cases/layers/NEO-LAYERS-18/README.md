# NEO-LAYERS-18 — extendSystem misuse fails a real sync with its named message

`extendSystem(base, { tokens })` themes a published base system by appending one override block to
the base's own token stream. Its misuse has to fail at config load, through a real `ref sync`, with a
message that names the mistake. The spec syncs a base upstream for real, then rewrites the world's
`ui.config.ts` once per leg and drives the spawned `bin/ref.ts sync` over each one.

The legs, with the check that owns each (`src/system/base/extend.ts`, `validate.ts`, `config/validate.ts`):

1. An unknown token, `colors.brandMissing`. `extendSystem` throws while the config module evaluates, so
   `LoadConfigError` wraps the message. The override must name the dotted path and the base.
2. A base and its extension in one field, `layers: [base, branded]`. `validateBaseSystemLinks` rejects the
   repeat by name, because both systems publish the same name.
3. A name with a double quote, on an extended system renamed to `neo-layers18"base`. The
   `[data-layer="…"]` selector is not escaped, so `validateBaseSystemEntries` rejects the name before any
   other entry check.

Each rejected leg exits 1, prints its named message, and leaves the world's published system
byte-identical to the canonical sync. The canonical config is restored in a `finally` with a resync.

Three valid shapes then sync in-process, so the misuse legs cannot pass by rejecting everything. The base
declares `brandInk` (light and dark), `brandSoft` (light only) and `brandAccent` (light and dark).

- A light-only override of a token the base darkens (`brandInk`, with `brandSoft` beside it) publishes its
  light rule and a dark rule, and the page paints the override in dark mode. The base's dark rule is more
  specific than a light-only rule, so the dark stamp shows the base dark value unless the dark rule is printed.
  The untouched `brandAccent` keeps its base values in each mode.
- A leaf with its own dark value (`brandAccent`) paints its dark value in dark mode and its light value in
  light mode, and the base dark value of the other tokens stays in force.
- `extends: [branded]` publishes the `extend:<base>` fragment node after the base's node, and the world's
  evaluated tokens carry the merged override. A light-only leaf drops the base dark value there.

Evidence: `src/system/base/extend.ts` (`extendSystem`, `extendFragmentNode`),
`src/system/base/fragments.ts` (`fragmentNodesOf`), `src/system/base/validate.ts`
(`assertBaseSystemName`, `validateBaseSystemLinks`), `src/config/validate.ts` (`validateName`).
Siblings: NEO-LAYERS-14 (the relation rejections this case copies) and NEO-LAYERS-05 (the shapes).

> Search terms: extendSystem, theme, override, tokens, branded, extend node, extend:, unknown token,
> repeated entry, duplicate name, double quote, data-layer selector, dark rule, paint, named message,
> ref sync, LoadConfigError, NEO-LAYERS-14
