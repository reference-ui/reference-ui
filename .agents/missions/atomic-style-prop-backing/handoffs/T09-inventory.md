# T09 (W1) — Root-forwarding audit + lib-internal icon sites + stale-comment draft

Status: **DONE** (read-only; no source file edited, nothing committed)

Package: `packages/reference-lib`. Wave: W1 (inventory only; the W3 fixes are gated on G1).
Method: `grep -rl PrimitiveProps` + per-part render bodies opened (tree is clean for
`packages/reference-lib`; the pre-existing lib refactor is already committed — e.g. Toast is now
`Toast/parts/*`, so the plan's `ToastChrome.tsx:19-75` path is stale).

---

## 0. How the "26" reconciles

`grep -rl PrimitiveProps packages/reference-lib/src` returns **27** hits: **25** passthrough files,
plus `Showcase/__e2e__/Showcase.ct.spec.ts` (a test) and `Showcase.book.tsx` (a prose string only).
Excluding the `.ct.spec.ts` test gives **26 rows** — the file-based count CONSULT.generalize used.
Each row below is one of those 26 files; the parts it defines and their render forwarding verdict
are given from the opened bodies. "rest→root?" is a source-level question (does the props object
spread onto the nearest rendered host?); it is independent of whether the class is *backed* today.

---

## 1. The 26-row inventory table

Legend — **rest→root?**: `YES` props object spreads onto the part's root host; `SLOT` props reach
the host only by unfolding a registered slot; `N/A` no host of its own. **Stripped/pinned**: keys
removed or re-pinned after the spread (style props unless noted). **Verdict**: `CORRECT` = root
stylable today, `PINNED` = root reachable but some style keys pinned by later literals,
`N/A` = not a passthrough.

| # | File (grep hit) | Part(s) + render site | rest→root? | Stripped/pinned keys | Verdict |
|---|---|---|---|---|---|
| 1 | `Accordion/types.ts` | `Accordion` root → `Accordion.tsx:87` `<Div … onKeyDown={…} {...props}>` | YES | none (onKeyDown destructured out before spread) | CORRECT |
| 2 | `Calendar/types.ts` | `Calendar` root `:288`; Header `Header.tsx:16`; Heading `:37`; Grid `Grid.tsx:313`; Weekdays `:34`; Days `:117`; Day `Day.tsx:88`; Month `:35`; Year `:32`; Prev/Next `:31`; Months `:176`; Years `:181` — all spread `…props` last | YES | Day strips managed id/tabIndex/disabled/aria-*/data-*; Grid pins aria-label/labelledby; Weekdays/Days `ref` | CORRECT |
| 3 | `Collapsible/types.ts` | Root renders no node (`Collapsible.tsx:42`). Trigger → `parts/Trigger.tsx:97` `<Button type {...props} … style>`; Content → `parts/Content.tsx:35` → `Panel.tsx:80` `<Div {...props} … hidden/aria/style>` | YES | Trigger re-applies `borderBottomWidth` after spread (managed); Panel re-applies `style` (merged) after spread | CORRECT |
| 4 | `Combobox/types.ts` | Root renders only `<Overlay>` (no host). Input `parts/Input.tsx:120` `{...props} ref role… className/style`; Trigger `parts/Trigger.tsx:94` `{...props} ref … className/style`; Popover `parts/Popover.tsx:77` → `Overlay.Content` rest last; VirtualItem clones child (`style` merged) | YES / N/A root | Input/Trigger: managed role/aria/disabled after spread (non-style); Popover pins none | CORRECT (root N/A) |
| 5 | `DateField/types.ts` | Root childless `DateField.tsx:212` `<Input {...props} type …>`; compound root `:280` `<Div … className style {...wrapperProps}>`; Range root `DateFieldRange.tsx:207` `<Div … className style {...props}>`. Input/Start/End/Trigger are **slot registrars** that render `null`; props unfold via `parts/EndpointInput.tsx:158` (`{...restExplicitProps}` first) and `SingleLayout.tsx:234` | YES / SLOT | childless Input: managed type/disabled/readOnly/required/aria after spread; EndpointInput strips managed id/type/role/aria/value/onChange… (non-style) | CORRECT (slot indirection) |
| 6 | `Field/types.ts` | `Field` root → `Field.tsx:22` `<Div ref {...restProps} data-reference-field data-status>` | YES | `strip-prohibited.ts:16` removes 6 ARIA keys (role, aria-invalid/disabled/readonly/required/errormessage); `data-reference-field`/`data-status` pinned **after** spread (non-style) | CORRECT |
| 7 | `Listbox/types.ts` | Root `Listbox.tsx:154` `<Div … className style {...props}>`; Option `parts/Option.tsx:120` `{...props}` last; Section/Header/Empty `parts/Section.tsx:20/61/88` `{...props}` last | YES | none (style props); managed aria/data applied before spread | CORRECT |
| 8 | `Menu/types.ts` | Root `parts/root.tsx:116` `<Div … className style onKeyDown {...props} ref>`; Item `item.tsx:82`; LinkItem `link-item.tsx:90`; Checkbox `checkbox-item.tsx:87`; RadioItem `radio-item.tsx:81`; RadioGroup `radio-group.tsx:24`; Separator `separator.tsx:13`; Trigger `trigger.tsx:139` — all `{...props}` last | YES | none (style props); managed role/aria/data before spread | CORRECT |
| 9 | `Menubar/types.ts` | Root `Menubar.tsx:38` `<Div role display flex alignItems gap {...props} ref>`; Trigger → `Popover.Trigger` (`parts/trigger.tsx:124`, `{...triggerProps}` = rest+ref); Content → `Popover.Content` (`parts/content.tsx:60`) | YES | none (style props); Trigger injects role/aria/disabled/id after | CORRECT |
| 10 | `NumberField/types.ts` | Root `NumberField.tsx:326` `<Div ref {...props} data-… className style>`; Group `parts/Group.tsx:142` `{...restProps}` first (5 ARIA stripped); Input `parts/Input.tsx:234` rest first (many managed stripped); StepperButton `parts/StepperButton.tsx:166` `{...restProps}` last | YES | root/Group/Input re-pin managed data + className/style after spread; StepperButton re-pins its kernel style props (height/aspectRatio/p/m/…) **before** rest | CORRECT |
| 11 | `Overlay/parts/Arrow.tsx` | `OverlayArrow` `:34` `<Div {...props} data ref position width height pointerEvents className style>` | YES | **`position`, `width`, `height`, `pointerEvents` pinned after spread** | **PINNED** |
| 12 | `Overlay/parts/Backdrop.tsx` | `OverlayBackdrop` `:48` `<Div … style={{…style}} {...props}>` | YES | none (style props) | CORRECT |
| 13 | `Overlay/parts/Content.tsx` | `OverlayContent` `:109` `<Div data className style={{zIndex,…style,…lock}} {...props} ref>` | YES | none (style props) | CORRECT |
| 14 | `Overlay/parts/Handle.tsx` | `OverlayHandle` `:92` `<Div {...props} data ref … width height borderRadius bg mx my cursor touchAction className style>` | YES | **`width`, `height`, `borderRadius`, `bg`, `mx`, `my`, `cursor`, `touchAction` pinned after spread** | **PINNED** |
| 15 | `Overlay/parts/Trigger.tsx` | `OverlayTrigger` `:47` `<Button type {...props} ref disabled data aria onClick>` | YES | none (style props); managed disabled/data/aria/onClick after (non-style) | CORRECT |
| 16 | `Popover/parts/Arrow.tsx` | `PopoverArrow` `:17` → `Overlay.Arrow` `{...props}`; inherits Arrow's pinned width/height | YES | via Overlay.Arrow (`position/width/height/pointerEvents`) | PINNED (delegate) |
| 17 | `Popover/parts/Close.tsx` | `PopoverClose` `:26` `<Button type {...props} onClick>` | YES | none (style props) | CORRECT |
| 18 | `RovingFocus/types.ts` | `Root`/`Item` are transparent slot parts (`RovingFocus.tsx:81`, `parts/Item.tsx:83`) that `cloneElement` the single child with `mergeSlotProps` | SLOT | `ROOT_EXCLUDED_PROPS`/`ITEM_EXCLUDED_PROPS` + authoritative `tabIndex`; style props merge onto the child host | CORRECT |
| 19 | `Showcase.book.tsx` | prose only (`:448` "Props extending PrimitiveProps for type safety.") — not a component | N/A | — | **N/A** |
| 20 | `Slider/types.ts` | Root `Slider.tsx:292` `<Div … className style {...props}>`; Track `parts/Track.tsx:91`; Range `parts/Range.tsx:50`; Thumb `parts/Thumb.tsx:184` — all `{...props}` last | YES | none (style props); managed aria/data before spread | CORRECT |
| 21 | `Splitter/types.ts` | Root `Splitter.tsx:216`; Panel `parts/Panel.tsx:74` (`...rest` last); Thumb `parts/Thumb.tsx:39`; Handle `parts/Handle.tsx:188` (`...rest` last) | YES | Panel/Handle strip deleted `index`; Thumb merges `style` then spreads rest | CORRECT |
| 22 | `Switch/types.ts` | Root `Switch.tsx:65` `{...managedProps} type role ref disabled aria data onClick className style`; Thumb `parts/Thumb.tsx:18` `data className style {...props}` | YES | root deletes `aria-pressed`; managed type/role/disabled/aria/data after | CORRECT |
| 23 | `Tabs/types.ts` | List `parts/list.tsx:95` `className style ref {...listProps}`; Tab `parts/tab.tsx:264` `className style {...tabProps}`; Panel `parts/panel.tsx:87` `className style {...panelProps}` | YES | List drops aria-orientation/data-orientation; Tab drops aria-selected/controls + data-state/disabled; Panel drops data-state | CORRECT |
| 24 | `Toast/types.ts` | Root `parts/Root.tsx:19` `data className style {...props}`; Title `parts/Title.tsx:18`; Description `parts/Description.tsx:18` | YES | none (style props). Action/Cancel/Close are native `<button>` with `React.ButtonHTMLAttributes` (no style-prop surface) | CORRECT |
| 25 | `Tooltip/parts/Arrow.tsx` | `TooltipArrow` `:12` → `Overlay.Arrow` `{...props}` first | YES | via Overlay.Arrow (`position/width/height/pointerEvents`) | PINNED (delegate) |
| 26 | `Tree/types.ts` | Root `Tree.tsx:131`; Item `parts/TreeItem.tsx:133` & `:203`; Group `parts/TreeGroup.tsx:49`; Expander `parts/TreeExpander.tsx:76` — `{...props}` last | YES | none (style props); managed role/aria/data before spread | CORRECT |

**Roll-up:** 21 CORRECT · 4 PINNED/`PINNED (delegate)` (`Overlay.Arrow`, `Overlay.Handle`,
`Popover.Arrow`, `Tooltip.Arrow`) · 1 N/A (`Showcase.book.tsx`). No part outright drops `rest`.
The 4 PINNED rows spread `rest` **before** their geometry/chrome literals, so a consumer cannot
override exactly those keys on the outermost element; every other style prop still lands.

---

## 2. In-repo call-site inventory (lib-src + book)

### (b) Style props passed to icons (`@reference-ui/icons`)

The **only** lib-src/book icon style-prop site is the mission's "18th site":

- `packages/reference-lib/src/components/Icon/Icon.book.tsx:919` —
  `<IconComp size={80} color="design.text.base" />`; `color` is a style prop, `size` is the live
  inline-style channel. **Faints today** (icons are a prebuilt layer in lib's compile) → fan-out
  paints it. (`IconComp` is a dynamic `Comp` from the icon barrel, `Icon.book.tsx:862`.)

Every other lib-src/book icon use passes only `size` and/or inline `style`, or nothing — all ALIVE
(not style props): `Icon.book.tsx:103,139,191,318,349,474,493,511,523,587,625,642,682,691,700,709`
(`size` / `style`); `Button.book.tsx` + `Button.story.tsx` (no props); `Menu.book.tsx`; 
`Combobox.book.tsx`; `Showcase.book.tsx`; `Listbox/parts/Option.tsx:237` (`<CheckIcon />`);
`Collapsible/parts/Trigger.tsx:91` (`<KeyboardArrowDownIcon />`);
`DateField/parts/SingleLayout.tsx:265` + `RangeLayout.tsx:74` (`<CalendarTodayIcon />`).
`Reference/components/shared/AtSignIcon.tsx` is a **local** SVG (not `@reference-ui/icons`) and takes
only `size`; `Reference/components/shared/JsDocParamChip.tsx:30` passes `size="1rem"`.

### (a) Style props passed to lib parts

**lib-src internal (same-compile ⇒ backed by lib's own compile; not fan-out targets):**

| File:line | Target part | Props passed |
|---|---|---|
| `Tooltip/parts/Content.tsx:26` | `Overlay.Content` | `bg`, `color`, `fontSize`, `lineHeight`, `py`, `px`, `borderRadius`, `boxShadow` |
| `Combobox/parts/Popover.tsx:77` | `Overlay.Content` | `p`, `bg`, `color`, `borderRadius`, `border`, `borderColor`, `boxShadow` |
| `DateField/parts/SinglePickerLayer.tsx:33`, `RangePickerLayer.tsx:43` | `Overlay.Content` | `bg`, `border`, `borderColor`, `borderRadius`, `boxShadow`, `color`, `p` |
| `Menu/parts/content.tsx:135` | `Overlay.Content` | `bg`, `border`, `borderColor`, `borderRadius`, `boxShadow`, `color`, `p` |
| `DateField/parts/SingleLayout.tsx:235`, `RangeLayout.tsx:44` | `Overlay.Trigger` | `bg`, `border`, `borderRadius`, `color`, `cursor`, `display`, `alignItems`, `justifyContent`, `p`, `width`, `height`, `minWidth` |

(`Popover/parts/Content.tsx` → `Overlay.Content` passes only `id/role/tabIndex/handlers`, no style props.)

**book / story / fixture sites (same-compile ⇒ alive) — file:count (representative):**

- `Splitter/Splitter.story.tsx` (~50 × `Splitter.Panel` `bg/color/p`; `Splitter height`), `Splitter.book.tsx` (5×), `Showcase.book.tsx:587/591` (`Splitter.Panel bg/color/p`), `Splitter/Splitter.book.tsx`.
- `Showcase.book.tsx` — `Field flex` (`:161`), `Field borderColor/width` (`:166`), `NumberField display/alignItems/gap` (`:172`), `Popover.Content bg/border/…` (`:268`), `Overlay.Content bg/border/position/transform/…` (`:321`), `Listbox border/borderColor/borderRadius/p` (`:510`), `Tree …` (`:557`), `Splitter height` (`:586`).
- `Popover/Popover.book.tsx` (4), `Popover/Popover.story.tsx` (4); `Overlay/Overlay.book.tsx` (~15 incl. `Menu.Item color` `:715`); `Overlay/fixtures/theme-fixture.tsx` (2), `Overlay/fixtures/exotica-fixture.tsx:424`.
- `Tooltip/Tooltip.story.tsx:14/39` (`Tooltip.Content bg/border/color/p`); `Toast/Toast.book.tsx:96` (`Toast.Root border/p`); `Listbox/Listbox.book.tsx:10/32`; `Tree/Tree.book.tsx:12/72`; `Field/Field.book.tsx` (8×) and `Field/Field.story.tsx` (21×, incl. `borderColor`) — all `Field width`; `Combobox/Combobox.book.tsx` (`Field width` ×3; `Listbox.Option` `:231` `height/minHeight/py`; `Combobox.Trigger:257` `justifyContent/width`); `Combobox/Combobox.story.tsx:2711` (`Combobox.Popover p`); `Calendar/Calendar.story.tsx:1019` (`Calendar.Day fontWeight`); `Icon/Icon.book.tsx:220` (`Field width`), `:549` (`SectionCard fontSize/height/px`).
- Reference docs components (local, same-compile): `Reference/components/shared/MonoText` receives `color/ml/mr` at `ReferenceDocumentHeader.tsx:59/73`, `ReferenceMemberList.tsx:107`, `SummaryChip.tsx:58`, `SummarySnippet.tsx:31`.

**Takeaway:** all (a) sites are same-compile (`lib` compiles its own `src/**` + `book/**`), so StyleTrace
discovers those receivers as hosts and their props back in the lib scope today — they are **not**
fan-out targets and must not churn in W3. Only the (b) icon site at `Icon.book.tsx:919` is an
external/prebuilt target that fan-out repairs.

---

## 3. DRAFT replacement for `packages/reference-lib/ui.config.ts:22-27`

Current text (lines 22-28):

```
  // Lib re-exports @reference-ui/icons and renders icons inside its own
  // components, so the icons stylesheet must travel with lib's CSS to every
  // consumer (docs inherits it transitively via extends). layers carries
  // the compiled CSS only — tokens and the JSX roster stay icons-local.
  // Style props must never cross into icons at a call-site: the icons
  // runtime mints reference-icons__* classes that only the icons compile
  // can back, so keep icon call-sites to size/style/className/rest.
```

Draft replacement (do **not** apply here; captain places it in C1, ratified at G1/D4):

```
  // Lib re-exports @reference-ui/icons and renders icons inside its own
  // components, so the icons stylesheet must travel with lib's CSS to every
  // consumer (docs inherits it transitively via extends). layers carries
  // the compiled CSS only — tokens and the JSX roster stay icons-local.
  //
  // Fan-out contract (STYLE_PROP_EXTERNAL; plan T09): a named style prop on
  // an external/prebuilt component ALWAYS paints — on @reference-ui/icons
  // and on every lib passthrough part alike. The consumer compile keeps the
  // prop on the capitalized non-host tag, resolves it against the CONSUMER's
  // tokens, and emits the deterministic `<system>__<stem>` class the foreign
  // runtime mints into the consumer's own utilities block (one group per
  // composed system, own first). The value lands on the component's
  // outermost element and overrides the package default. There is no
  // "must never cross" ban: that rule is retired, so do not re-add it.
  // Same-compile call-sites inside lib's own src/** and book/** are
  // unaffected (they were already backed), and the non-style channels
  // (size/style/className/native props) keep working as before.
```

---

## 4. Handoff note (10 lines)

1. **Status/scope:** read-only W1 inventory complete; 26-row table, lib-src+book call-site inventory, and `ui.config.ts` draft delivered. No source file touched; nothing committed.
2. **Every part forwards `rest` to a host** — Field, Switch(+Thumb), Tooltip.Content, Overlay.*, Toast Root/Title/Description, Accordion, Slider*, Menu*, Calendar*, Listbox*, Menubar, NumberField, Tabs, Tree, Splitter, Collapsible, Combobox parts, RovingFocus (slot). No part outright drops a style prop.
3. **W3 forwarding-fix candidates (only these 4, all minor):** `Overlay/parts/Arrow.tsx` and `Overlay/parts/Handle.tsx` spread `rest` **before** their geometry/chrome literals, pinning `position/width/height/pointerEvents` (Arrow) and `width/height/borderRadius/bg/mx/my/cursor/touchAction` (Handle); `Popover/parts/Arrow.tsx` and `Tooltip/parts/Arrow.tsx` inherit Arrow's pinning by delegation.
4. **Already correct (no W3 churn):** the other 21 rows; their `rest` spread is last (or merges onto the slotted child), so consumer style props override package defaults on the outermost element.
5. **Not passthroughs:** `Showcase.book.tsx` (row 19) matches the grep only as prose; Combobox root and Collapsible root render no host (transparent) so they expose no style surface by design; Toast Action/Cancel/Close and Collapsible/Accordion roots are native/non-PrimitiveProps.
6. **Slot indirection works:** DateField `Input/Start/End/Trigger` render `null` but unfold props onto the managed host via `EndpointInput.tsx`/`SingleLayout.tsx` (rest first), so style props still reach the rendered input/trigger.
7. **Only one external icon style-prop site:** `Icon.book.tsx:919` `<IconComp color="design.text.base">` — the mission's "18th A4 site"; fan-out makes it paint. All other lib icon uses pass `size`/`style`/nothing (alive today).
8. **All (a) lib-part style-prop sites are same-compile** (lib compiles its own `src/**`+`book/**`, StyleTrace discovers those receivers as hosts), so they are already backed and are NOT fan-out targets — do not churn them in C4.
9. **Caveat / stale paths:** the plan's `Toast/ToastChrome.tsx:19-75` no longer exists (committed Toast folder refactor: `Toast/parts/{Root,Title,Description,…}`); the "26" is file-based (25 passthrough files + 1 book prose hit). W3 fix set is therefore likely empty or limited to row 11/14, subject to G1.
10. **Decisions for G1:** ratify the §3 comment text (D4) and whether the Arrow/Handle pinning (row 11/14) is left as intended kernel geometry or adjusted in W3. T17 `<Field padding>` root assertion is expected green on the current tree (Field row 6 = CORRECT).
