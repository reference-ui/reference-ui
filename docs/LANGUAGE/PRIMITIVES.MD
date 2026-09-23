# Primitives

**Status**: Living contract (rebuilt verified-true 2026-09-23; every claim
carries file:line proof).
**Scope**: The generated primitive components (`@reference-ui/react` entry).

## Tag universe

`TAGS` holds exactly 101 platform tags (`a` … `wbr`;
`packages/reference-neo/src/primitives/tags.ts:6-109`, count verified).
JSX names derive via `toJsxName` (`tags.ts:112-117`) with two exceptions —
`object` → `Obj`, `var` → `Var` (`tags.ts:113-114`) — collected as
`PRIMITIVE_JSX_NAMES` (`tags.ts:119`). Box, Flex, and Grid are patterns,
never tags, so the map rule holds by construction (`tags.ts:3-4`).

## Generation

`neo sync` emits the generated entry from the tag list:
`generateReactEntrySource` (`packages/reference-neo/src/primitives/generate/generate.ts:29`)
plus the types twin `generateReactTypesSource` (`:70`). The request admits
every generated primitive without an import (`sync/index.ts:167` D12 block).

## Factory

Each render goes through `createPrimitive`
(`packages/reference-neo/src/primitives/runtime/factory.ts:43`): split props
(`split.ts`), resolve style props through the shared `css()`, stamp the
scope attributes. Ref rides `forwardRef`, so it reaches the host on React
17/18/19 alike, with ref-as-prop behavior preserved on 19
(`factory.ts:5-8,40-41`).

## Stamped attributes

Agreed between sheets and primitives
(`packages/reference-neo/src/primitives/runtime/context.ts`):

| Attribute | Rule | Proof |
|---|---|---|
| `data-layer` | First primitive in a tree stamps `ui.config.name`; nested ones inherit | `context.ts:3,33,101-102` |
| `data-variant` | Stamped when `variant` is non-null and non-empty | `context.ts:56,109-110` |
| `data-color-mode` | Canonical color-mode attribute both sides agree on | `context.ts:12-14` |

## Props contract

Style props resolve through `css()`; unknown props are refused loudly at
the engine (see [`FEATURES/NEO_CSS_COMPOSITION.md`](../FEATURES/NEO_CSS_COMPOSITION.md) for `css()` as the static
fragment collector, and [`FEATURES/RS_ATOMIC.md`](../FEATURES/RS_ATOMIC.md) for Want → AtomSet). There
is no polymorphic `as` prop and no runtime `layer` prop — scope comes from
context, identity from config.
