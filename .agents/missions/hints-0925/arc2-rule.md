RULED

# HINTS-2 ARC-2 RULE log

Scope: survey every warning-code emit site per module, specify the
instance `help` line per site, specify Neo's render rule (engine help
vs static hint), specify per-module verification, recommend exec split.

## Rule (oracle cell, 2026-09-25)

Method: every emit body below was opened and read; grep only located
candidates. Line numbers are as of this date. Codes counted: 53
`-W-` table rows, 52 minted (ATM-W-TOKEN-CATEGORY-MISMATCH is retired
with no emit site). Errors (`-E-`) and infos (`-I-`) are out of scope.

Instance-help voice (match WARNING_HINTS): lowercase imperative, no
trailing period, backticked names. One help line per diagnostic, except
suggestion codes may carry two lines: `did you mean ...?` + fix line.

### ARC-2 seams (where help attaches)

- Atomic funnel codes (Dynamic* via `warn_dynamic`): single seam is
  `Policy::render_extract` (`policy/extract.rs:14`). Pushed lines and
  compiler-channel re-renders both flow through it, so help attached
  there survives the partition. No vocabulary change (dynamic codes
  are not suggestion codes).
- Atomic note codes (every `ctx.warn` site): pushed line is built at
  the site, but the compiler re-render reconstructs with `help: None`
  (`channels/render.rs:74-84`). Exec MUST extend `ExtractNote` with a
  help field, thread it through `extract_note()` (`adapters/extract.rs`),
  re-attach it in `channels/render.rs`, and add a `warn_help` sibling
  to the four ctx types (ExtractContext `extract/mod.rs:201`,
  ExpressionWalk `walk/mod.rs:100`, ObjectWalk `object/mod.rs:90`;
  `warn_default` needs no help — see LEAF-11 flag). Exec must also
  confirm `proof/lines.rs` strip identity still matches with help set.
- Atomic resolve codes: pushed lines and false-refusal re-renders both
  flow through `Policy::render_resolve` (`policy/resolve.rs:17`).
  Instance help (name echo) derives from the detail there. Suggestions
  need candidates the detail lacks: exec threads a precomputed
  suggestion (emit site has `session.system`) into the detail or the
  report — exact field placement is exec's call, but the fact MUST
  carry it so the compiler re-render preserves it.
- Atomic direct pushes (static_css.rs, stylesheet/global/*): no facts,
  userspace only — attach `.with_help()` inline at the site.
- Atomic proof/hosts: `policy/proof.rs` (from key), `policy/hosts.rs`
  (from file).
- Satellites (atlas/tasty/styletrace/typegen): single seam each — the
  constructor fns in `diagnostics/mod.rs`. Call-site context is exactly
  the constructor params, verified at each caller.

### ATOMIC survey (35 rows, 34 minted)

DYNAMIC-EXPRESSION — walk/call.rs:49-56 (call-arg, detail phrase),
call.rs:87-92 (generic), walk/member.rs:126-131 (chain generic),
object/spread.rs:95-99 (spread-call refusal, `message_for_spread`).
Context: prop, when, span; call-arg detail phrase. Help: `hoist the
expression for '{prop}' into a static literal or variant`.

DYNAMIC-MEMBER — walk/member.rs:44-49. Context: prop only (Generic
detail; the member path is NOT carried). Help: `replace the member
lookup with a literal value for '{prop}'`. Stretch (optional):
thread `member_path_text` into the detail.

DYNAMIC-IDENTIFIER — walk/leaf.rs:54-59. Context: name + prop. Help:
`replace '{name}' with a literal or token for '{prop}'`.

MUTATED-BINDING — leaf.rs:73-81 (value pos + detail phrase),
spread.rs:120-130 + 231-238 (spread + write), css/mod.rs:203-212
(css arg + site), jsx/mod.rs:326-335 (JSX attr + prop),
attrs.rs:134-142 (bag + prop), responsive.rs:64-72 (array + prop),
element.rs:59-60 (element refusal → MutatedBase name+write via
policy/extract.rs:85). Context: binding name + write phrase + site
kind. Help per site, e.g. `hoist '{name}' above the style call and
stop reassigning it ({write})`.

DYNAMIC-TEMPLATE — leaf.rs:109-120 + 159-170 (nested), literal.rs:108-117
(literal, part index + detail + part span). Context: prop, part, detail.
Help: `make template part {N} ({detail}) static for '{prop}'`, whole-
template variant when part is None.

DYNAMIC-UNARY — leaf.rs:99-108 + 149-158. Context: prop + operator
phrase. Help: `fold the unary expression to a literal for '{prop}'
({detail})`. DYNAMIC-BINARY — leaf.rs:139-148, same shape.

UNFOLDABLE-KEY — object/mod.rs:157-163, responsive.rs:147-153.
Context: span ONLY, no spelling. FLAG: static wins
(`use a static key instead of the computed key`) unless the stretch
(threads key snippet via `ctx.source` slice) lands.

UNKNOWN-PROPERTY — resolve/mod.rs:149-157 (prop + location + key),
static_css.rs:30-33 (prop, unlocated), global/value.rs:38-43 (prop +
fragment location), object/mod.rs:191-195 (key + key span),
object/lower.rs:108-113 (spread const key), call_lower.rs:117-122
(folded spread key). No `warn_dynamic` funnel site exists (note arm
only). Context: bad name everywhere. Suggestion candidates need no
system: `CANONICAL_PROPERTIES` names + `ALIASES` + `REFERENCE_PROPS`
(canon). Help: `did you mean '{candidate}'?` + `remove '{prop}' or
check its spelling`. Highest-value instance help in the arc.

UNKNOWN-BREAKPOINT — keys.rs:35-40 (trimmed + key span),
entries.rs:245-250 (recorded r sub), call_lower.rs:141-146 (folded r
key). Context: bad name + scale (`ctx.breakpoints` /
`walk.breakpoints` at every site). Help: `did you mean '{bp}'? use a
breakpoint from the theme` over `scale.names()`.

NON-OBJECT-CONDITION — entries.rs:186-190 (key in scope),
entries.rs:316-318 (key+sub in scope), condition.rs:66-71 (key is
`when.last()`, pushed by caller), call_lower.rs:164-168 (`when` in
scope). Messages are static but the key is always in reach. Help:
`give condition '{key}' a style object`. Instance wins, cheap.

UNFOLDABLE-SPREAD — spread.rs:37-41 (generic), spread.rs:107-111
(non-object call result), spread.rs:241-245 + unpack paths (base name
via `spread_base_name`/root), css/mod.rs:193-195 + attrs.rs:124-128
(import-residue `marker.message()`), responsive.rs:140-145 (responsive
object). Help: miss paths `define '{name}' as a static style object
or inline it`; generic sites keep static. Import-residue markers:
exec opens `import_unfoldable` marker context; carry what it names.

UNKNOWN-CONDITION — resolve/mod.rs:288-298 (name + location + key),
walker.rs:198-201 (sub + prop), walker.rs:250-253 (cond),
policy/proof.rs:14-21 (reason-carrying proof lines keep resolver
code). Context: name; candidates `NAMED_CONDITIONS` + system condition
keys + breakpoint names (system in reach at resolve + walker sites).
Help: `did you mean '{c}'? use a condition from the theme`. FLAG:
proof-carried lines render without a system in reach — static
fallback there (same code, two helps; acceptable, documented).

MISSING-CONTAINER-ROOT — conditions/mod.rs:63-76. Context: NONE
(aggregate advisory, unlocated). FLAG: static wins
(`add a container root for the @container atom`). Stretch: name one
container-conditioned prop from `atom_set` (in scope).

NON-CANONICAL-NUMERIC — unit.rs:127-149 (prop + spelling),
runtime/values.rs:87-119 (plan pass, same pair). Help: `write
'{spelling}' as a plain decimal on '{prop}'`.

INVALID-CSS-VALUE — unit.rs:208-217 (EmptyString + prop),
unit.rs:244-257 (Bool + prop + value), global/value.rs:134-139 (bool
on standard prop + fragment location). (proof/rejects.rs:92 and
proof/render.rs:280,297 are test fixtures, not emit sites.) Help:
``'{prop}' rejects '{value}'; use a CSS keyword, token, or accepted
value``; EmptyString: `remove the empty value on '{prop}'`.

MALFORMED-OPACITY — tokens/mod.rs:84-93. Context: text + prop. Help:
`write the opacity modifier as /<0-100> (got '{text}')`.

UNKNOWN-TOKEN-PATH — tokens/mod.rs:154-162. Context: path + prop +
system. Candidates: `system.tokens` iter keys. Help: `did you mean
'{path}'? point the path at an existing token`.

TOKEN-CATEGORY-MISMATCH — FLAG: retired, zero emit sites (grep
confirms codes.rs only). Static row retained for wire stability; no
engine help ever.

UNKNOWN-COLOR — tokens/mod.rs:183-191. Context: text + prop + system.
Candidates: colors-category token names + CSS keywords. Help: `did
you mean '{c}'? use a color token or CSS color`.

UNTERMINATED-BRACE — interpolate.rs:77-86. Context: whole value +
prop. Help: `close the '{' in '{value}'`.

STATIC-WILDCARD — static_css.rs:76-80. Context: prop. Help: `'{prop}'
has no token category; list concrete values instead of '*'`.

EMPTY-AT-RULE — walker.rs:78-82 + 219-223. Context: at_key (+
selector at the nested site). Help: `fill in the query on '{at_key}'
or drop the key`.

UNSUPPORTED-GLOBAL-VALUE — walker.rs:178-182. Context: prop + sub.
Help: `use a single value for '{prop}.{sub}'`.

TRACE-SKIPPED — policy/hosts.rs:11-17. Context: file + StyleTrace
sentence. Help: `check the StyleTrace host graph for '{file}'` when
file is Some, else static.

NON-OBJECT-CSS-ARG — css/mod.rs:59-66 (spread + site), css/mod.rs:225-233
(site + `block_value_kind`), css/mod.rs:291-298 (merge spread).
Context: arg/element index + kind phrase (identifier names included).
Help: `pass a static style object as css() {site} (got {kind})`.

NON-OBJECT-JSX-STYLE — jsx/mod.rs:121-125 (element value + name),
jsx/mod.rs:352-360 (prop + kind), attrs.rs:148-156 (bag css/r),
attrs.rs:206-211 (bag merge spread). Help: `pass a static style
object to '{prop}' (got {kind})`.

RESPONSIVE-ARRAY-SPREAD — responsive.rs:76-83. Context: prop. Help:
`remove the spread from the '{prop}' value array`.

TAGGED-TEMPLATE-SITE — extract/mod.rs:479-483. Context: none. FLAG:
message already carries the complete fix (`use css({...})`); no
engine help, static fallback stays (duplicative but harmless).

UNFOLDABLE-OBJECT-PROP — entries.rs:28-35 (key+name), 114-121
(key.sub+name), 163-170, 209-216, 262-269, 294-301. Context: key path
+ const object name + span. Help: `give '{key}' of '{name}' a static
value or drop it from the spread`.

PARTIAL-OBJECT-PROP — entries.rs residue arms (key+name), keys.rs:70-75
(path), member.rs:28-33 (path), member.rs:69-75 (base[index]+prop),
member.rs:116-122 (chain path), call.rs:58-64 (subject),
spread.rs:144-149 (subject), responsive.rs:155-161 (path). Help:
`make the dynamic arm of '{path}' static or drop it`.

TOKEN-CALL-REFUSED — token.rs:55-95, emitted via call.rs:28-35.
Context: TokenReason (Surface/Arity/EmptyPath/Path/Fallback) + prop
+ arg span. Help per reason: Surface `call token(path) or
token.var(path) for '{prop}'`; Arity `pass a path and an optional
fallback`; EmptyPath `pass a non-empty token path`; Path `pass a
string literal or const string path`; Fallback `pass a string or
number literal fallback`.

MISSING-STYLE-PLAN — policy/proof.rs:26-31. Context: key (prop +
value spelling + when). Help: `make the '{prop}: {value}' lookup
static so the plan can serve it`.

RESPONSIVE-LEAF-IMPORTANT — responsive.rs:194-201 (`warn_default`,
prop + leaf key). FLAG: message already carries the full fix
(`remove the '!' or move it to a scalar prop`); no engine help,
static fallback stays. No `warn_default` help variant needed.

UNREALIZABLE-EXTENSION — resolve/mod.rs:218-230. Context: prop.
Help: `drop '{prop}'; the dialect has no served css form`.

### ATLAS survey (4 warnings; seam `diagnostics/mod.rs`)

UNRESOLVED-PROPS-TYPE — mod.rs:17-29, caller resolver.rs:109.
Context: source, component, type_name; the `modules` map in scope
holds candidate declared type names. Help: `import '{type}' for
'{component}' or define it in scope`. FLAG: did-you-mean over
declared types needs an SUGGESTION_CODES amendment (ATL codes are
not gated) — stretch, NOT in ARC-2.

UNSUPPORTED-PROPS-ANNOTATION — mod.rs:32-43, caller resolver.rs:90.
Context: source, component. Help: `name the props type of
'{component}' instead of inlining the object`.

UNRESOLVED-INCLUDE-PACKAGE — mod.rs:46-51, caller analyzer.rs:74.
Context: package; `include_packages` keys in scope. Help: `check the
name of '{package}' or install it alongside the app`. Same
suggestion-gate flag as above.

PACKAGE-SCAN-FAILED — mod.rs:63-74, callers analyzer.rs:97,104.
Context: package + reason (reason already in message). Help: `fix
'{package}' so it scans or drop it from include`.

### TASTY survey (5 warnings; seam `diagnostics/mod.rs`)

PARSE-ERROR — mod.rs:17-23, caller pipeline.rs:250. Context:
file_id + error_count, both already in message/location. FLAG:
static wins (`fix the syntax error so the file parses cleanly`).
Stretch: thread the first Oxc error span/message if `ScannedFile`
carries it.

DUPLICATE-DECLARATION — mod.rs:26-36, caller merge.rs:65. Context:
file, name, kinds. Help: `merge the duplicate '{name}' ({kinds}) or
rename one`.

DUPLICATE-MEMBER — mod.rs:39-49, caller merge.rs:136. Context:
file, interface, member. Help: `remove the duplicate '{member}'
from interface '{interface}' or rename one`.

STAR-AMBIGUITY — mod.rs:52-65, caller index.rs:263. Context:
barrel, name, first_source, second_source. Help: `re-export '{name}'
explicitly from '{barrel}'`.

DUPLICATE-SYMBOL-NAME — mod.rs:68-79, caller manifest.rs:102.
Context: name, count, matches (`id (library)` pairs). Help: `look
up '{name}' by symbol id ({matches}) or a scoped lookup`.

### STYLETRACE survey (1 warning; seam `diagnostics/mod.rs`)

SKIPPED-FILE — mod.rs:22-32 via `push_skipped` (mod.rs:39-43),
callers analyzer.rs:377, surface.rs:275, surface.rs:298. Context:
file? + legacy sentence (already names file + reason; byte-pinned
by atomic goldens). FLAG: static wins (`fix the file so it parses
and reads cleanly`). Do NOT classify parse-vs-read from the message
(brittle); message stays byte-identical.

### TYPEGEN survey (8 warnings; seam `diagnostics/mod.rs`)

Note: UNKNOWN-TOKEN-CATEGORY and UNKNOWN-STRICT-CATEGORY already
append `did you mean` to the MESSAGE (mod.rs:29-39, 87-97). Engine
help adds the fix action; it must NOT repeat the suggestion line.

UNKNOWN-TOKEN-CATEGORY — mod.rs:21-44 (category, count;
candidates `known_token_categories()`). Help: `move the {count}
token(s) from '{category}' into a printed category`.
INVALID-RECIPE-NAME — mod.rs:47-52 (name). Help: `rename '{name}'
so it forms a TypeScript type name`.
EMPTY-RECIPE — mod.rs:55-60 whole (name), mod.rs:63-68 axis
(name, axis). Help per site: `fill in variant axes for '{name}' or
drop the recipe` / `fill in axis '{axis}' of '{name}' or drop the
axis`.
INVALID-COMPOUND-VARIANT — mod.rs:72-82 (name, row, axis, value).
Help: `point row {row} of '{name}' at a declared value of '{axis}'`.
UNKNOWN-STRICT-CATEGORY — mod.rs:85-102 (name; candidates
`KNOWN_STRICT_CATEGORIES`). Help: `use colors, radii, or spacing
instead of '{name}'`.
ABSENT-STRICT-CATEGORY — mod.rs:105-110 (name). Help: `declare
{name} tokens or drop '{name}' from strict`.
EMPTY-FONT-FAMILY — mod.rs:113-118 (name). Help: `declare weights
for '{name}' or drop the family`.
DUPLICATE-RECIPE-STEM — mod.rs:122-129 (name, stem). Help: `rename
'{name}' so its stem no longer collides on '{stem}'`.

### Neo render rule (format.ts)

In `formatVerboseWarningLine` (`format.ts:85-96`), the ` — tail`
resolves in this order, exactly one tail, never both:

1. Engine help present: `entry.help` is non-empty (defensive
   trim-filter; transport already rejects blanks) → tail is
   `' — ' + help.join('; ')`. Join (not first-only): the verbose row
   stays one line with no loss; the JSON report keeps the array
   verbatim (exec verifies json.ts surfaces `help`).
2. Else static fallback: `warningHintFor(code)` → `' — ' + hint`.
3. Else no tail.

Engine help wins even when `code` is undefined (codeless legacy
items with help render it). Rationale for one-not-both: instance
help echoes the static remedy with names; printing both reads as a
stutter. Static table is RETAINED as the fallback (hints.test.ts
coverage keeps pinning all 52 rows; no rows deleted).

Dedupe interplay: `diagnosticKey` (format.ts:41-53) already includes
`help` JSON — no change. Same instance ×N still folds to `×N`;
distinct names stay separate lines (correct: different instances
deserve own lines). Transport already passes `help` through
(transport.ts:99-101, 176, 223-226); only format.ts ignores it today.

### Per-module verification

- Atomic RS: `pnpm agentrs v <file>` per touched file; new help
  assertions in policy/resolve, policy/extract, resolve, extract
  unit tests; station suite (`tests/cases.test.ts`) — `diagnostics.json`
  goldens pin full wire bytes today (14 warning codes appear across
  cases), so re-bless with `--update-goldens` / `UPDATE_GOLDENS=1`
  (`testing/goldens.ts:24`) and review the diff: ONLY added `help`
  keys, message/code/location bytes identical. `pnpm agentrs q` gate.
- Atlas/tasty/styletrace/typegen RS: module unit tests via agentrs;
  exact-wire-byte tests (`diagnostics/mod.rs` tests, incl.
  typegen `every_warning_pins_its_exact_wire_bytes` and styletrace
  `skipped_file_pins_exact_wire_bytes`) MUST be updated to the new
  bytes + help assertions. `pnpm agentrs q`.
- diagnostics/js: hints.test.ts + index.test.ts stay green untouched
  (fallback table unchanged).
- Neo: `vitest run src/diagnostics src/cli/output.test.ts` (136
  baseline); output.test.ts static-tail pins stay valid for help-absent
  entries — ADD engine-help-first, join-with-`;`, and never-both cases;
  sweep `tests/cases/diag/**/repro.spec.ts` + case.json for pinned
  ` — ` tails and re-verify; `pnpm agentneo q`; `tsc --noEmit`
  src-clean. RS `build:js` before Neo verify (standing rule; help
  rides the existing wire field, no contract change).

### Recommended ARC-2 exec split

Wave order respects the sequential shared checkout; file sets are
disjoint within the wave.

- Crew 1 — atomic kernel: policy/extract.rs, policy/resolve.rs,
  policy/proof.rs, policy/hosts.rs, resolve/*, runtime/values.rs,
  static_css.rs, stylesheet/global/*, channels/render.rs note
  re-attach, lines.rs identity check, resolve suggestion threading,
  station re-bless + diff review.
- Crew 2 — atomic extract notes: all `ctx.warn` sites in extract/*,
  fold/token.rs reason help, adapters/extract.rs (`extract_note`
  help field), `warn_help` on the 3 ctx types (no `warn_default`
  variant — LEAF-11 flag), site unit tests. Suggestion candidates
  here need no system (canon consts, `ctx.breakpoints`) — no shared
  code with Crew 1's system-candidate helpers.
- Crew 3 — satellites: atlas + tasty + styletrace + typegen
  `diagnostics/mod.rs` constructors + wire-byte test updates.
  Smallest; may pair with Crew 4.
- Crew 4 — neo render: format.ts rule, output.test.ts additions,
  diagnostics tests, diag case-spec sweep, agentneo q + tsc.

Order: Crews 1–3 in one wave (disjoint files), RS build:js, station
re-bless review, then Crew 4. Captain commits per standing rules.
