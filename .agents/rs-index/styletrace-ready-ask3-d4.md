# READY ask 3 — D4 evidence: icon paint today + where the chain stops

Verdict: **feeds D4 = deferred-post-#5** (see ask 4). `width`/`height`
on the Collapsible chevron do not paint — no atom, no folding site; the
values evaporate. The package chain stops in **two** layered places, both
pinned empirically.

Probes (all `/tmp`, tree untouched): `/tmp/st-ready-ask3.mjs`,
`/tmp/st-ready-ask3b.mjs`, `/tmp/st-ready-ask3c.mjs`,
worlds `/tmp/st-icon-src`, `/tmp/st-icon-v2`, `/tmp/st-icon-v3`.

## (a) Does `width`/`height` on `<KeyboardArrowDownIcon>` paint?

**No.** Site: `packages/reference-lib/src/components/Collapsible/Collapsible.tsx:176`
(`{icon ?? <KeyboardArrowDownIcon width="1.25em" height="1.25em" />}`).

| Stage | What happens | Evidence |
|---|---|---|
| Compile | Icon tag is not a host (not in the 53, not traced) → site skipped. Unknown tags under a non-empty graph stay **silent** (`extract/jsx/mod.rs:213-228`, `report_dropped_tag`) — no error, no want | `1.25em` occurs **0 times** in `.reference-ui/styled/styles.css`; it is the only `1.25em` use-site in non-book lib src |
| Runtime | `{...rest}` carries `width`/`height` onto `IconShell` (= `Div`); the splitter classifies both as style props (both in the 873) → `css({width,height})` → **no compiled plan → no class** ("misses resolve to nothing", `runtime/css/css.ts:1-5`; dev-only `console.warn`) | `split.ts:52-80`, `factory.ts:52`, `css.ts:69-93` |
| DOM | Splitter consumed them as style props, so they do **not** leak through as element attributes either | same |

**Which atom, which site folds it: none and none.** The visible chevron
size comes from the `size`→inline-`style` path in
`packages/reference-icons/src/createIcon.tsx:53-66`
(`ICON_SIZE_TOKENS.base` = `var(--spacing-5r, 20px)`), which lands via
`elementProps.style` untouched.

Corollary for the D4 wave: making icons trace **will** move pixels — the
Collapsible site alone mints 2 new atoms (`w_1.25em`-class utilities) and
flips the chevron from the 20px token to 1.25em-driven sizing. Own oracle
loop required.

## (b) Where the package chain stops (lib re-export of an icon)

Chain root: `packages/reference-lib/src/index.ts:1899`
(`export { KeyboardArrowDownIcon } from '@reference-ui/icons'`, one of
3,857). Live-binary result: lib traces 53 names, **zero** `*Icon`.

**Stop 1 — package entry file (production stop).**
`@reference-ui/icons` resolves types-first
(`tasty/.../package_entry.rs:133-138`, conditions `types → import →
default → require` in `package_json.rs:32-42`) to
`packages/reference-icons/dist/index.d.ts` (top-level `types` field;
`exports["."]` agrees). The `export *` chain is followed through
`dist/generated/*.d.ts` (extensionless mapping prefers `.d.ts`;
`.mjs` is never consulted). Terminal: per-icon
`export declare const KeyboardArrowDownIcon: …` has **no initializer**,
so `collect_variable_symbols` skips it (`analysis/parser/mod.rs:376`)
and the name is never even registered as an export. Precise
characterization: **not** an extension refusal (`source_files.rs:62-69`
governs discovery only — edge modules parse regardless of extension)
and **not** a resolution failure — a *shape* stop: declarations without
bodies. Note `prefer_sync_root_source_module` (`resolver/path.rs:89-119`,
dist→src mapping) cannot fire: icons live outside the lib sync root.

**Stop 2 — file-local alias (deeper stop, proven by bisect).** Even the
real *sources* would not trace, because `const IconShell = Div as …`
(`createIcon.tsx:10`) is a file-local alias — gap-#3 class
(`jsx_target`/`identifier_target` require an import binding,
`walk/jsx.rs:92-120`; cf. `parser/component.rs:165-166`):

| World | Shape | Traced |
|---|---|---|
| `/tmp/st-icon-src` (V1, faithful source copy: factory + forwardRef + `IconShell` alias + rest spread) | alias | `[]` |
| `/tmp/st-icon-v2` (V2, identical except `<Div>` direct) | no alias | `["KeyboardArrowDownIcon"]` |
| `/tmp/st-icon-v3` (plain wrapper control) | — | `["PlainIcon"]` |

So the `createIcon`/forwardRef/rest-spread factory shape **is**
recognized — the alias alone stops it. D4 therefore needs *both* a
source-side entry (or compiled-shape factories) *and* binding/alias
resolution (Overmatch row), plus pixel attestation. All post-#5.
