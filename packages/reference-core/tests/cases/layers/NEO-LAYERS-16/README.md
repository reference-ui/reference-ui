# NEO-LAYERS-16 — a layer-only token is not in the consumer's typed vocabulary under strict colours: its colour prop fails with TS2322 naming it, while the consumer's own token typechecks

With `strict: ['colors']` in ui.config, sync narrows every colour position of the generated
declarations to the consumer's own tokens. The upstream (`upstreams/up`) defines one token, `upInk`,
and the consumer lists that upstream under `layers`. The spec syncs the upstream for real, rewrites the
consumer config to `layers: [up]`, and re-syncs. Then it materializes temp consumers and typechecks
each one against the generated `react.d.mts` and `styled/types/index.d.ts`:

- Under layers, `<Div color="consumerInk" />` and `css({ color: 'consumerInk' })` assign: the
  consumer's own token is in the typed vocabulary.
- Under layers, `<Div color="upInk" />` fails with TS2322 at its own line, naming `"upInk"`.
  `css({ color: 'upInk' })` fails with TS2345 naming `"upInk"`. A layer-only token is not a
  `ColorToken`, so the strict surface rejects it.
- The generated `styled/types/index.d.ts` carries `StrictColorProps<BaseStyleProps>` and no `'upInk'`
  literal under layers.

The spec then rewrites the consumer config to `extends: [up]` and re-syncs, as a control. The same
`<Div color="upInk" />` assigns there, so the rejection comes from the layer boundary and not from a
token name that exists nowhere. The canonical config is restored in a `finally`.

NEO-LAYERS-02 pins the typegen omission in open mode (no `strict`). It does not typecheck a consumer
colour prop, so the strict rejection is asserted here and not by extending 02.

Evidence: `src/config/types.ts` (the `strict` field: a strict category accepts only its tokens),
`src/config/validate.ts` (the strict list), `src/sync/index.ts` (the `strict` pass-through to typegen),
`src/packager/types-bundle.ts` (strict is omitted in open mode). Siblings: NEO-TYPE-09 (strict colours
reject off-token values, the typecheck pattern this case follows), NEO-LAYERS-02 (the open-mode typegen
boundary), NEO-LAYERS-01 (a layer paints without joining the roster or the types).

> Search terms: layers, layer-only token, typed vocabulary, strict colours, ColorToken, StrictColorProps, TS2322, TS2345, off-token colour, consumer typecheck, extends control, NEO-TYPE-09, NEO-LAYERS-01, NEO-LAYERS-02
