# StyleTrace Discovery Ledger (Slice #2)

Date: 2026-09-18. Mission: `docs/missions/styletrace.md` § "Slice #2", steps 3–5.
Scope: read-only. Every name in lib's 53-line `jsxElements`
(`packages/reference-lib/ui.config.ts:22-34`) classified by how it traces;
every PascalCase tag used with style props in lib `src`+`book` that does
*not* trace gets a verdict (*refusal-by-design* or *tracer gap*) and, for
gaps, a pixel question. D4 (package re-exports) evidence in §4.

Method: use-site scan `/tmp/styletrace-lib-use-sites.mjs` (re-run 2026-09-18
against the freshly synced tree): 145 `.tsx` files, style-prop universe =
873-name `StylePropName` union from `.reference-ui/react/react.d.mts` plus
`css`/`colorMode` (875 total). Definitions verified by hand per name; line
numbers are def sites (`src/` = `packages/reference-lib/src/`).

Headline: traced 53/53 (`/tmp/st-slice2-quick.mjs`: 0 missing, 0 extra).
16 of the 53 have styled use-sites in lib+book; 37 are
*vestigial-at-use-site* (§2). 25 further tags carry style props without
tracing: 19 refusals-by-design, 6 tracer gaps (§3).

## 1. The 53 — trace mechanisms

Four buckets. **A** (50): `PrimitiveProps`-family boundary + rest spread into
a direct primitive import. **B** (1): `StyleProps` boundary + renamed rest.
**C** (1): whole-props spread into a traced host via direct identifier.
**D** (1): value flow with no style types and no spread.

Bucket A boundary spellings: bare `PrimitiveProps<'x'>` (24) ·
`PrimitiveProps<'x'> & {…}` (14) · `Omit<PrimitiveProps<'x'>,…> & {…}` (11) ·
bare `Omit<PrimitiveProps<'input'>,…>` (1: ComboboxInput).
`Styled×N` = files in lib src+book using the tag with ≥1 style-prop attr
(member spellings noted — 9 of the 16 styled names are used *only* via member
spellings, painting through the concat rule).

| # | Name | Def (`src/…`) | Boundary | Forward | Target | Styled | Mark |
|---|---|---|---|---|---|---|---|
| 1 | Accordion | `Accordion/Accordion.tsx:33` fwdRef | Omit PP<'div'> & | rest | Div | ×3 direct | — |
| 2 | Calendar | `Calendar/Calendar.tsx:407` fn | Omit PP<'div'> & | rest | Div | 0 | VESTIGIAL |
| 3 | CalendarGrid | `Calendar/Calendar.tsx:218` fn | PP<'table'> | rest | Table | 0 | VESTIGIAL |
| 4 | CalendarHeader | `Calendar/Calendar.tsx:58` fn | PP<'div'> | rest | Div | 0 | VESTIGIAL |
| 5 | CalendarHeading | `Calendar/Calendar.tsx:82` fn | PP<'button'> | rest | Button | 0 | VESTIGIAL |
| 6 | CalendarNextButton | `Calendar/Calendar.tsx:173` fn | PP<'button'> | rest | Button | 0 | VESTIGIAL |
| 7 | CalendarPrevButton | `Calendar/Calendar.tsx:128` fn | PP<'button'> | rest | Button | 0 | VESTIGIAL |
| 8 | CollapsibleContent | `Collapsible/Collapsible.tsx:299` fwdRef | PP<'div'> | rest→same-file panel | Presence→Panel→Div | 0 | VESTIGIAL |
| 9 | CollapsibleTrigger | `Collapsible/Collapsible.tsx:119` fn | PP<'button'> & | rest | Button | 0 | VESTIGIAL |
| 10 | ComboboxInput | `Combobox/Combobox.tsx:31` fn | Omit PP<'input'> | rest | Input | 0 | VESTIGIAL |
| 11 | ComboboxOption | `Combobox/Combobox.tsx:287` fn | whole `ListboxOptionProps` | full spread | ListboxOption (host) | 0 | VESTIGIAL · C |
| 12 | ComboboxTrigger | `Combobox/Combobox.tsx:216` fn | PP<'button'> | rest | Button | ×1 member | — |
| 13 | DateField | `DateField/DateField.tsx:221` fwdRef | Omit PP<'input'> & | rest | Input | 0 | VESTIGIAL |
| 14 | DateFieldInput | `DateField/DateField.tsx:34` fn | PP<'input'> | rest | Input | 0 | VESTIGIAL |
| 15 | Field | `Field/Field.tsx:21` fwdRef | Omit PP<'div'> & | rest | Div | ×5 direct | — |
| 16 | ListboxEmpty | `Listbox/Listbox.tsx:426` fn | PP<'div'> | rest | Div | 0 | VESTIGIAL |
| 17 | ListboxHeader | `Listbox/Listbox.tsx:397` fn | PP<'span'> | rest | Span | 0 | VESTIGIAL |
| 18 | ListboxOption | `Listbox/Listbox.tsx:38` fn | PP<'div'> & | rest | RovingFocus.Item→Div | ×1 member | — |
| 19 | ListboxSection | `Listbox/Listbox.tsx:352` fn | PP<'div'> & | rest | Div | 0 | VESTIGIAL |
| 20 | MenuItem | `Menu/Menu.tsx:195` fn | PP<'div'> & | rest | RovingFocus.Item→Div | ×1 member | — |
| 21 | MenuSeparator | `Menu/Menu.tsx:280` fn | PP<'div'> | rest | Div | 0 | VESTIGIAL |
| 22 | MonoText | `Reference/components/shared/MonoText.tsx:17` fn | `StyleProps` & | RENAMED rest `...styleProps` | Code | ×4 direct | — · B |
| 23 | NumberField | `NumberField/NumberField.tsx:250` fwdRef | Omit PP<'div'> & | rest | Div | ×1 direct | — |
| 24 | NumberFieldDecrement | `NumberField/NumberField.tsx:174` fwdRef | PP<'button'> | rest | Button | 0 | VESTIGIAL |
| 25 | NumberFieldIncrement | `NumberField/NumberField.tsx:95` fwdRef | PP<'button'> | rest | Button | 0 | VESTIGIAL |
| 26 | NumberFieldInput | `NumberField/NumberField.tsx:36` fwdRef | PP<'input'> | rest | Input | 0 | VESTIGIAL |
| 27 | OverlayArrow | `Overlay/parts/Arrow.tsx:10` fn | PP<'div'> & | rest | Div | 0 | VESTIGIAL |
| 28 | OverlayBackdrop | `Overlay/parts/Backdrop.tsx:13` fn | PP<'div'> | rest | Presence→Div | ×3 member | — |
| 29 | OverlayContent | `Overlay/parts/Content.tsx:23` fn | PP<'div'> & geometry | rest (`offset` JS-shadowed) | Div | ×12 member | — |
| 30 | OverlayHandle | `Overlay/parts/Handle.tsx:16` fn | PP<'div'> | rest | Div | 0 | VESTIGIAL |
| 31 | OverlayTrigger | `Overlay/parts/Trigger.tsx:9` fn | PP<'button'> | rest | Button | ×2 member | — |
| 32 | PopoverClose | `Popover/Popover.tsx:629` fn | PP<'button'> | rest | Button | ×2 member | — |
| 33 | Slider | `Slider/Slider.tsx:399` fwdRef | Omit PP<'div'> & | rest | Div | 0 | VESTIGIAL |
| 34 | SliderRange | `Slider/Slider.tsx:108` fn | PP<'div'> | rest | Div | 0 | VESTIGIAL |
| 35 | SliderThumb | `Slider/Slider.tsx:156` fn | PP<'div'> & | rest | Div | 0 | VESTIGIAL |
| 36 | SliderTrack | `Slider/Slider.tsx:51` fwdRef | PP<'div'> | rest | Div | 0 | VESTIGIAL |
| 37 | Splitter | `Splitter/Splitter.tsx:494` fwdRef | Omit PP<'div'> & | rest | Div | ×3 direct | — |
| 38 | SplitterHandle | `Splitter/Splitter.tsx:166` fn | PP<'div'> & | rest | Div | 0 | VESTIGIAL |
| 39 | SplitterPanel | `Splitter/Splitter.tsx:34` fn | PP<'div'> & | rest | Div | ×3 member | — |
| 40 | SplitterThumb | `Splitter/Splitter.tsx:80` fn | PP<'div'> & | rest | Div | 0 | VESTIGIAL |
| 41 | Switch | `Switch/Switch.tsx:41` fwdRef | Omit PP<'button'> & | rest | Button | 0 | VESTIGIAL |
| 42 | SwitchThumb | `Switch/Switch.tsx:20` fn | PP<'span'> | rest | Span | 0 | VESTIGIAL |
| 43 | Tab | `Tabs/Tabs.tsx:187` fn | Omit PP<'button'> & | rest | Button | 0 | VESTIGIAL |
| 44 | TabPanel | `Tabs/Tabs.tsx:299` fn | Omit PP<'div'> & | rest | Div | 0 | VESTIGIAL |
| 45 | TabsList | `Tabs/Tabs.tsx:86` fn | PP<'div'> & | rest | Div | 0 | VESTIGIAL |
| 46 | ToastDescription | `Toast/ToastChrome.tsx:60` fn | PP<'div'> | rest | Div | 0 | VESTIGIAL |
| 47 | ToastHost | `Toast/ToastSystem.tsx:867` fn | OWN `ToastHostProps` (no style types) | NO spread; `gap={gap}` → same-file stack | ToastPositionStack→JS/inline | ×1 direct (dynamic) | — · D |
| 48 | ToastRoot | `Toast/ToastChrome.tsx:19` fn | PP<'div'> & | rest | Div | ×1 member | — |
| 49 | ToastTitle | `Toast/ToastChrome.tsx:41` fn | PP<'div'> | rest | Div | 0 | VESTIGIAL |
| 50 | Tree | `Tree/Tree.tsx:389` fwdRef | Omit PP<'div'> & | rest | Div | ×2 direct | — |
| 51 | TreeExpander | `Tree/Tree.tsx:310` fn | PP<'button'> & | rest | Button | 0 | VESTIGIAL |
| 52 | TreeGroup | `Tree/Tree.tsx:265` fn | PP<'div'> | rest | Div | 0 | VESTIGIAL |
| 53 | TreeItem | `Tree/Tree.tsx:53` fn | PP<'div'> & | rest | Div | 0 | VESTIGIAL |

(`PP` = `PrimitiveProps`; `fn` = `export function`, `fwdRef` = `export const … =
React.forwardRef`. All bucket-A/B targets are imported from
`@reference-ui/react` in the defining file.)

Bucket notes:

- **B · MonoText** (`MonoText.tsx:5,17-19`): boundary `StyleProps &
  { children, color }`, renamed rest `...styleProps` spread into `<Code>`
  after static `fontFamily`/`color`/`css`. The only `StyleProps`-typed
  boundary in the 53; the tracer follows the rename.
- **C · ComboboxOption** (`Combobox.tsx:287-288`): one-liner
  `(props: ListboxOptionProps) => <ListboxOption {...props} />`. Host-to-host
  chain through a **direct identifier** target — traced. Contrast §3:
  PopoverContent/MenuTrigger/TooltipContent forward into **member**
  (`Overlay.Content`, `Overlay.Trigger`) targets and do not trace. The member
  target, not the alias/typeof boundary, is the discriminator (Divider, with
  a `typeof` boundary but a direct `<Div>` target, is the opposite
  control — also untraced, so both legs have independent gaps).
- **D · ToastHost** (`ToastSystem.tsx:840-885,987-994`): boundary carries no
  style types; destructures `gap`/`offset` (style-prop *names*) and forwards
  `gap={gap}` into the same-file **non-exported** `ToastPositionStack`
  (`:678`), where they become JS layout numbers feeding inline styles. The
  single styled-by-name use-site (`ReferenceLibrary.tsx:161-177`) passes
  dynamic values (`gap={toaster?.gap}`), so no extraction occurs there today.
  Traced by the destructure-name rule; keep (mission: the host rule is "a
  value that reaches a primitive style prop" — here the value reaches `Div`
  only as computed inline style, but the boundary name-match is what the
  tracer sees, and deleting it risks the only fold point).
- **OverlayContent** (`parts/Content.tsx:23-47`) destructures `offset = 8` /
  `collisionPadding = 8` as JS numbers while its boundary *includes*
  `PrimitiveProps`: a static `offset` at a use-site would both extract (as a
  style) and flow as JS. No such static use-site exists in lib+book. See the
  `offset` caution (§5).
- **CollapsibleContent** (`:299`) spreads into `<Presence>` + same-file
  `CollapsibleContentPanel`, which spreads into `<Div>` — a same-file chain
  the tracer crosses (contrast ToastHost, where the same-file hop ends in JS
  math rather than a primitive).

## 2. Vestigial-at-use-site (37) — information only, not a deletion list

Zero styled call sites in lib `src`+`book` (scan §-head): the boundary accepts
style props and forwards them, but no in-repo use-site passes any.

> Calendar, CalendarGrid, CalendarHeader, CalendarHeading, CalendarNextButton,
> CalendarPrevButton, CollapsibleContent, CollapsibleTrigger, ComboboxInput,
> ComboboxOption, DateField, DateFieldInput, ListboxEmpty, ListboxHeader,
> ListboxSection, MenuSeparator, NumberFieldDecrement, NumberFieldIncrement,
> NumberFieldInput, OverlayArrow, OverlayHandle, Slider, SliderRange,
> SliderThumb, SliderTrack, SplitterHandle, SplitterThumb, Switch, SwitchThumb,
> Tab, TabPanel, TabsList, ToastDescription, ToastTitle, TreeExpander,
> TreeGroup, TreeItem.

Why they stay hosts: each is a live boundary (typed + forwarding), so any
downstream consumer — `extends` packages, external users, future Book stories —
can style it today through the published `baseSystem.jsxElements`. Spot-check
beyond scan scope: no direct JSX use of sampled vestigial names (`Tab`,
`Switch`, `Slider`, `TreeItem`) in `matrix/` (matrix consumes lib's
*published hosts*, e.g. the distro `MonoText` pin, rather than rendering lib
components). Deleting a vestigial name from discovery would silently unpaint
exactly those downstream uses — which is why slice #5 deletes the *config
list*, not the *discovered set*.

## 3. Not-traced witnesses — verdicts

25 tags carry style props at use-sites but are not in the 53 (scan §c).
Verdict key: **R** = refusal-by-design (the tracer is right to stay silent) ·
**G** = tracer gap (a shape discovery should eventually emit). Every G names
its pixel question ("does this prop paint today?"); every R names the reason.

| Tag | Files | Attrs (sample) | Import | V | Reason / pixel question |
|---|---|---|---|---|---|
| AddIcon | 1 | size | `@reference-ui/icons` | R | package chain stops at `dist/*.mjs` (D4, §4). `size` paints via inline style, no atoms. |
| AtSignIcon | 1 | size | relative `./AtSignIcon` | R | Own SVG: renders bare `<svg>`, `size`→`width/height` attrs (`Reference/.../AtSignIcon.tsx:14-30`). Paints via SVG attrs. |
| CheckIcon | 2 | size,color / width,height,color | `@reference-ui/icons` | R | D4. `width="4r"` classes exist in sheet by coincidence (sibling Span) but always lose to the icon's inline default (§4). |
| CloseIcon | 1 | size | `@reference-ui/icons` | R | D4, as AddIcon. |
| DarkModeIcon | 1 | size | `@reference-ui/icons` | R | D4, as AddIcon. |
| Divider | 1 | marginBottom | relative `./shared/Divider` | **G** | `ComponentPropsWithoutRef<typeof Div>` boundary + rest into direct `<Div>` (`Divider.tsx:4-16`) — the typeof leg. **Pixel Q: does `marginBottom="2r"` paint on `ReferenceMemberList.tsx:104`?** (src, not book). |
| FilterListIcon | 1 | color | `@reference-ui/icons` | R | D4. |
| IconComp | 1 | size,color | none (local cast, `Icon.book.tsx:858`) | R | Not a definition: `Comp as ComponentType<…>` inside a map; underlying icons are the D4 case. |
| KeyboardArrowDownIcon | 3 | width,height / size | `@reference-ui/icons` | R | D4 headliner: `Collapsible.tsx:176` static `width/height="1.25em"` do **not** paint — no `1.25em` utility in the frozen sheet; chevron renders at the 20px inline default (§4). |
| LayerBadge | 1 | zIndex | none (book-local, `Overlay.book.tsx:19`) | R | Non-exported book helper; `zIndex:number` is JS. Discovery never emits non-exports; paint invariant across this mission. |
| LightModeIcon | 1 | size | `@reference-ui/icons` | R | D4, as AddIcon. |
| Listbox | 2 | border,borderColor,borderRadius,p,bg | relative | **G** | `Omit<PrimitiveProps<'div'>,…>` + rest into `<Div>`, but exported as `X = Base as T` alias + member attach (`Listbox.tsx:227-228,459-463`) — the aliased-export shape. **Pixel Q: do the `border/p/bg` props paint on `Listbox.book.tsx:10`?** (book-only). |
| Menu.Trigger | 1 | alignSelf | relative `./Menu` | **G** | `ComponentPropsWithoutRef<typeof Overlay.Trigger>` + rest into **member** `<Overlay.Trigger>` (`Menu.tsx:63-103`) — typeof boundary × member target. **Pixel Q: does `alignSelf` paint on `Showcase.book.tsx:265`?** |
| Overlay | 14 | isolation | relative | R | Own `OverlayIsolation` prop (`isolation = true`), JS-consumed via `resolveIsolation` (`Overlay.tsx:51,79`); root renders a bare context provider, no element. Name collision (§5). |
| Overlay.Portal | 7 | container | relative | R | `container` is a DOM mount target passed through to `<Portal>` (`parts/Portal.tsx:5`); `PortalProps['container']` accepts Element/ref/fn. Name collision (§5). |
| Popover.Content | 4 | p,bg,color,borderRadius,border[,offset] | relative | **G** | `OverlayContentProps` alias + rest into **member** `<Overlay.Content>` (`Popover.tsx:567-613`) — the member-target gap; cf. ComboboxOption (C) which traces through a direct identifier. **Pixel Q: do the padding/surface props paint on `Popover.book.tsx:12` / `Popover.story.tsx:16`?** (4 files — the widest gap). |
| Popover.Trigger | 1 | w | relative | **G** | `OverlayTriggerProps` alias + rest into member (`Popover.tsx:495-560`). **Pixel Q: does `w` paint on `Popover.book.tsx:66`?** (book-only). |
| Portal | 3 | container | relative | R | As Overlay.Portal: own mount-target prop (`Portal.tsx:13-51`). |
| ReferenceMemberRows | 1 | css | none (same-file, `ReferenceMemberList.tsx:74`) | R | Non-exported; `css` object forwarded into `<Div css>` (`:82`). Discovery can't reach non-exports; paint invariant across this mission. |
| SearchIcon | 1 | color | `@reference-ui/icons` | R | D4. |
| SectionCard | 2 | scale / color | none (book-local, both files) | R | Non-exported book helpers that **drop** extra props (no `...rest`: `Icon.book.tsx:41`, `Primitives.book.tsx:95`) — the style-looking attrs are provably inert. |
| SettingsIcon | 1 | size | `@reference-ui/icons` | R | D4, as AddIcon. |
| TitleFiller | 1 | visibility | none (story-local, `Slot.story.tsx:125`) | R | `visibility` is a `SlotVisibility` **object** (`{visible, hidden}`), JS-consumed into inline style. Name collision (§5). |
| ToastPositionStack | 1 | position,gap,offset | none (same-file, `ToastSystem.tsx:678`) | R | Non-exported; `position`/`gap`/`offset` are JS layout numbers/strings feeding inline styles (`:725-727,751-770`). The scanner flags names, not values. |
| Tooltip.Content | 1 | offset,p,bg,color,borderRadius | relative | **G** | Same shape as Popover.Content (`Tooltip.tsx:395+`, alias + member target). **Pixel Q: do the surface props paint on `Tooltip.story.tsx:14`?** (story-only). |

Tally: **19 refusals** (9 package icons + IconComp + Overlay + Overlay.Portal +
Portal + ToastPositionStack + 3 book/story-local helpers + AtSignIcon +
ReferenceMemberRows) and **6 tracer gaps** in three shapes: typeof-boundary
(Divider), aliased-export (Listbox root), member-target forward
(PopoverContent, PopoverTrigger, MenuTrigger, TooltipContent). No gap has a
styled use-site in a CT-covered path (all are book/story/src-doc), so none
affects the 338/343 tally either way — they are Book-eyes questions for the
wave that claims them.

## 4. D4 evidence — package re-exports as hosts (for HQ)

**Does `width`/`height` on `<KeyboardArrowDownIcon>` in `Collapsible.tsx`
paint today? No.** Use-site (`Collapsible.tsx:176`):
`{icon ?? <KeyboardArrowDownIcon width="1.25em" height="1.25em" />}` (static
strings). Findings:

1. **No atom exists.** The frozen sheet
   (`styletrace-baseline/styles.css`) contains zero occurrences of `1.25em`.
   Neither the use-site (icon is not a host) nor the factory interior
   (`<IconShell … {...rest}>`, dynamic spread) can extract.
2. **No atom *could* win.** `createIcon` (`reference-icons/src/createIcon.tsx:36-83`)
   funnels `width`/`height` into `...rest`, spread onto `IconShell` (= `Div`,
   a non-exported file-local alias, `:10-12`) *after* an always-present
   `style={{ width: resolvedSize, height: resolvedSize, … }}` (`:60-67`).
   Any extracted class would lose to the inline default
   (`formatIconSize(undefined)` = `base` = `var(--spacing-5r, 20px)`).
   The chevron renders 20×20 regardless. (Amusingly, `1.25em` ≈ 20px at a
   16px base — the intended size equals the default.)
3. **The 4r icons don't paint 4r either.** `Listbox.tsx:215` and
   `Showcase.book.tsx:467` pass `width/height="4r"`; `.w_4r`/`.h_4r` *do*
   exist in the sheet (extracted thanks to neighboring primitive `Span`s) and
   the icon's `Div` *does* take those classes at runtime — but the inline
   20px default overrides them. Paint-by-coincidence that still loses.
4. **The live sizing path is `size`** (inline style via `formatIconSize`, no
   atoms — all `size` use-sites paint), and the live tint path is `color`
   (`color={color}` + `fill="currentColor"`, runtime inheritance). A future
   D4 wave that makes icons hosts would extract width/height/color classes of
   which only `color` could move pixels — unless `createIcon` also changes
   (e.g. dropping the inline default when explicit dims are present).

**Where exactly does the package chain stop? At the entry file + extension,
not the factory shape:**

- `src/index.ts:53+`: `export { XIcon } from '@reference-ui/icons'`
  (package specifier, 3,857 re-exports).
- `@reference-ui/icons` `package.json` exports `.` → `./dist/index.mjs`
  (import) / `./dist/index.d.ts` (types). `dist/index.mjs` is a pure barrel
  (`export { … } from './generated/*.mjs'`, zero `createIcon` calls).
- The tracer refuses at three independent gates (`source_files.rs`):
  `is_traceable_source_file` accepts only `ts/tsx/js/jsx/mts` (`.mjs`
  refused) and rejects `.d.ts`/`.d.mts`; `should_skip_directory` skips
  `dist`. The in-repo `src/createIcon.tsx` is unreachable — no exports entry
  points there.
- The factory shape is *covered*: the `icon_factory` styletrace case exists,
  and `createIcon → IconShell → Div` with rest spread is exactly that shape.
  If the entry resolved to traceable source, icons would trace (modulo the
  non-exported `IconShell` alias, which the extractor — not the tracer —
  must see through, cf. gap #3 / Overmatch handoff).

Recommendation to HQ: D4 stays deferred behind slice #5 as planned, and its
wave needs two halves — entry resolution (tracer) *and* a `createIcon`
contract change (otherwise extracted dims stay dead per finding 2). The
chevron is correctly sized today by accident (finding 2's 20px coincidence).

## 5. Name-collision caution list

Style-prop names that are also component props with unrelated meaning. Any
future strictness (e.g. warning on style props at non-host sites) must consult
this list or it will false-positive on:

| Name | Style meaning | Component meaning (site) |
|---|---|---|
| `isolation` | CSS `isolation` | `Overlay`'s `OverlayIsolation` (bool-ish stacking/portal policy), 14 use-sites |
| `container` | container queries | `Portal`/`Overlay.Portal` DOM mount target (Element/ref/fn), 10 use-sites |
| `offset` | `offset` (anchor positioning) | `OverlayContent` geometry number (default 8); `ToastHost`/`ToastPositionStack` layout value |
| `size` | `size` shorthand (w+h) | icon `IconSizeValue` (token/px/`Nr`/CSS width → inline style); `AtSignIcon` number |
| `width`/`height` | dims | icon rest → dead vs inline (see §4); `AtSignIcon` SVG attrs (live) |
| `position` | CSS `position` | `ToastPositionStack` placement string (`'top'…`) |
| `gap` | flex/grid gap | `ToastHost`/`ToastPositionStack` JS pixel gap between toasts |
| `color` | text color | icon tint incl. `color="currentColor"` passthrough on raw SVG |
| `visibility` | CSS `visibility` | `TitleFiller`'s `SlotVisibility` object |
| `css` | style object | `ReferenceMemberRows` static-object forward (same-file; runtime-object semantics, not an atom) |

## 6. Method appendix

- Scan flags *names*, not values: dynamic props (`gap={toaster?.gap}`,
  `color={color}`) count the same as static ones. "Styled use-site" therefore
  over-approximates extraction sites; the ledger text corrects the notable
  cases (ToastHost, icons).
- Only `.tsx` scanned; `.ts` barrels contribute no JSX. Member tags
  (`Overlay.Content`) are mapped to hand-listed names via the concat rule
  (`NS.Panel` ↔ `NSPanel`); `Combobox.Trigger`-style uses are the *only*
  styled evidence for 9 of the 16 non-vestigial names.
- The tracer's export rule (only exported components become hosts) is taken
  as ground truth for the R verdicts on non-exported tags; their paint is
  invariant across slices #3–#5 by construction.
- Probes (all `/tmp`, re-runnable, no tree writes):
  `/tmp/styletrace-lib-use-sites.mjs` (this ledger's scan; output
  `/tmp/st-slice2-usesites.txt`), `/tmp/st-slice2-quick.mjs` (53 = 53),
  `/tmp/st-slice2-defs.mjs` (§1 digest; output `/tmp/st-slice2-defs.txt`).
- Baseline artifacts: `packages/reference-neo/docs/evidence/styletrace-baseline/`
  (README + five frozen files). CT tally frozen alongside: E2E 338/343 (5
  pre-existing stale-baseline fails, all Sep-13 page snaps vs the landing-era
  sheet — see slice report), unit 189/189.
