# Generator

JavaScript ingest for the canon crate. Reads `@webref/css` and
`@webref/elements`, joins them with the Reference dialect, and emits static
Rust tables into `modules/canon/src`.

The specs live on npm. There is no Rust crate that dumps living W3C / WHATWG
data. This folder is the ingest; the crate is the consumer.

## Join

Platform is the browser. Dialect is Reference UI: PascalCase primitives,
aliases (`mt`, `bg`), extensions (`r`, `container`, `font`, `weight`,
`colorMode`), conditions. Unknown tags, unverified properties, and shorthand
longhands that disagree with `@webref` fail the generator.

## Regeneration

```bash
pnpm --filter @reference-ui/rust run canon
```

Do not hand-edit generated tables. Lookup facades live in `src/lib.rs` and
are re-emitted with the tables.
