# Prior-art research log — playtest WANTS

Status: **COMPLETE** (5 nested researchers reported; lead synthesized)

Source: `WANTS.md` (26 asks across 25 want IDs; W-02 carries two).
Method: read-only web research (each URL below was fetched [F] or
search-confirmed [S] by a nested researcher this session). No source touched.

Judgments: **SHAPED-BY-PRIOR-ART** (our API matches the reasonable shape) /
**DIVERGENT** (ours differs — how noted) / **NO-TRACE** (nothing found — where
noted).

## Evidence table

| Want | Prior system | API / prop / behavior | Reference | Judgment |
|------|--------------|----------------------|-----------|----------|
| W-01 shipped stylesheet | Radix Themes | `import "@radix-ui/themes/styles.css"` at app root + `<Theme>` wrapper | [S] radix-ui/website `getting-started.mdx` | SHAPED-BY-PRIOR-ART — dominant pattern; also Mantine v7 `styles.css`, Amplify UI `styles.css` ([S] their repos) |
| W-02 snap/validate | React Aria / Spectrum | `commitBehavior?: 'snap' \| 'validate'`, default `'snap'` — blur-commit policy, exact prop-name match | [F] react-aria.adobe.com/NumberField prop table; [S] react-spectrum NumberField; shipped v1.17.0 (`adobe/react-spectrum#9679`) | SHAPED-BY-PRIOR-ART — name + blur-commit semantics verbatim |
| W-02 snap-in-onChange (HQ suspicion) | React Aria `useNumberFieldState.commit()` | Clamps + snaps to step, "will fire the `onChange` prop with the new value" | [S] react-spectrum.adobe.com/react-stately/useNumberFieldState.html | CONFIRMED as mechanism — but Spectrum still ships the prop, so the prop survives the challenge |
| W-02 `none` third value | Mantine NumberInput | `clampBehavior="none"` disables clamping entirely | [F] mantine.dev/core/number-input "Clamp behavior" | DIVERGENT in naming (`commitBehavior:'none'` untraced), behavior traced; also Chakra `clampValueOnBlur`+`keepWithinRange` dual-false opt-out ([F] v2.chakra-ui.com) |
| W-02 validate | Native HTML | Off-step → `validity.stepMismatch=true`, `:invalid`, blocks submit; never coerces | [S] MDN ValidityState/stepMismatch | SHAPED-BY-PRIOR-ART for `validate` |
| W-03 dark-surface text | Radix Themes | `Text` `color` has **no default** — unset inherits | [F] radix-ui.com/themes/docs/components/text | SHAPED-BY-PRIOR-ART |
| W-03 (2nd) | MUI Typography | `color` default `'initial'` + `'inherit'` option; "color should inherit most of the time" | [S] v4.mui.com/api/typography + migration guide | SHAPED-BY-PRIOR-ART |
| W-03 (3rd) | Tailwind Preflight / CSS | No pinned text color; `color` is inherited per spec | [F] tailwindcss.com/docs/preflight | SHAPED-BY-PRIOR-ART |
| W-04 loud dev failure | Panda CSS / StyleX | Invalid style values fail at **lint/compile** time (`no-invalid-token-paths`, `@stylexjs/valid-styles`) | [S] chakra-ui/eslint-plugin-panda, facebook/stylex eslint-plugin | DIVERGENT mechanism (ours: dev-runtime throw), same loudness principle |
| W-04 (neg) | React core / Chakra v2 | React dev-warns unknown props (warns, doesn't throw); Chakra runtime silently skips bad values | [S] tamagui#4074; chakra docs looked | NO-TRACE for runtime-throw on bad style values |
| W-09 onExitComplete | Motion (Framer) | `<AnimatePresence onExitComplete>` — "Fires when all exiting nodes have completed animating out"; single-fire enforced (motion#3454) | [F] motion.dev/docs/react-animate-presence | SHAPED-BY-PRIOR-ART — name, placement, exactly-once |
| W-09 (neg) | Radix Presence | State machine, deliberately **no** completion callback | Radix presence docs 404; [S] primitives#344 | DIVERGENT from Radix (we follow Motion) |
| W-11 preventDefault cancels | Radix DismissableLayer | `onPointerDownOutside`/`onFocusOutside`/`onInteractOutside`/`onEscapeKeyDown`, each "Can be prevented" via cancelable CustomEvent | [F] unpkg `@radix-ui/react-dismissable-layer@1.1.0/dist/index.d.ts` + Dialog docs | SHAPED-BY-PRIOR-ART — exact contract |
| W-11 (alt shapes) | Base UI / MUI Dialog | `onOpenChange(open, {reason, cancel()})`; MUI `onClose(event, reason)` | [S] mui/base-ui dialog types.md; MUI dialog.md | SHAPED-BY-PRIOR-ART (reason-labeled dismiss) |
| W-11 `dismissable?` name | Native `popover="manual"` / Radix `modal` | Boolean opt-out of dismissability (shape analogue only) | [S] MDN beforetoggle/popover | NO-TRACE for the exact name `dismissable` (Radix/Base/MUI surveyed) |
| W-13 textValue fallback | Radix Select | `textValue`: "By default the typeahead behavior will use the `.textContent`" | [F] radix-ui.com select Item row; [S] website select.mdx | SHAPED-BY-PRIOR-ART; RAC `textValue \|\| children` fallback [F] corroborates |
| W-13 unconditional Empty | RAC `renderEmptyState` / Kobalte `ComboboxEmpty` | Both render empty UI **only when collection is empty** | [F] react-aria.adobe.com/ListBox "Empty state" | DIVERGENT — unconditional chrome is our own contract |
| W-15 keepMounted | Base UI Tabs.Panel | `keepMounted?: boolean` default `false` — identical name + semantics | [F] base-ui.com/react/components/tabs (@base-ui/react 1.8.0) | SHAPED-BY-PRIOR-ART |
| W-15 (corroboration) | Radix / Headless / Ark | `forceMount` ([F] Radix Tabs); `unmount={false}` ([F] Headless tabs); Ark `hidden`-attr hiding ([F] ark tabs) | see refs | SHAPED-BY-PRIOR-ART (mechanism; Ark default differs: mounts-all) |
| W-16 unmatched-value warning | MUI Tabs `getTabsMeta` | Dev console.error naming component + bad value + valid values; `value={false}` = deliberate no-selection | [F] raw mui/material-ui `Tabs/Tabs.js` ~L383-415 | SHAPED-BY-PRIOR-ART — near-verbatim template |
| W-16 (neg) | React Aria / Radix / Headless / Ark | All silent on unmatched controlled keys | Looked: RAC useTabList docs, Radix/Headless/Ark tabs pages | NO-TRACE — MUI stands alone |
| W-17 `*` key | W3C APG treeview | ``*`` (Optional): "Expands all siblings at the same level" | [F] w3.org/WAI/ARIA/apg/patterns/treeview | SHAPED-BY-PRIOR-ART (direct adoption; note Optional) |
| W-19 selection model | W3C APG treeview | "Selection does NOT follow focus" variant + recommended multi-select (Space toggles, arrows move focus) | [F] same APG page | SHAPED-BY-PRIOR-ART (one of two sanctioned models) |
| W-20 custom day render | RAC Calendar | `<CalendarGrid>{date => <CalendarCell/>}</CalendarGrid>` — render fn + behavior-carrying cell | [F] react-aria.adobe.com/Calendar | SHAPED-BY-PRIOR-ART (pattern family; surface differs: children-fn vs our `Day` render prop) |
| W-20 (alts) | MUI X `slots.day` / day-picker `components.DayButton` | Whole-component swap with prop-forwarding contract | [F] mui.com/x DateCalendar; [F] daypicker.dev custom-components | SHAPED in capability, DIVERGENT in mechanism |
| W-21 isDateUnavailable | React Aria Calendar | `isDateUnavailable: (date) => boolean`; unavailable stays focusable, unselectable | [F] react-aria.adobe.com/Calendar | SHAPED-BY-PRIOR-ART — exact name + semantics |
| W-21 firstDayOfWeek | React Aria Calendar | `firstDayOfWeek: "sun"\|"mon"\|…` overrides locale default | [F] same page props table | SHAPED name; DIVERGENT type — RAC takes weekday-name strings, W-02/W-21 sketch takes a number (`{1}`) |
| W-21 (neg) | MUI X | `shouldDisableDate` (disabled, not unavailable); week start via adapter locale only, no prop | [F] mui.com/x validation; [S] adapters-locale.md | DIVERGENT from MUI — ours follows React Aria |
| W-24 autocomplete="both" | APG combobox / RAC | `aria-autocomplete="both"` vocabulary; RAC passthrough prop | [F] APG combobox; [F] react-aria.adobe.com/ComboBox | SHAPED-BY-PRIOR-ART |
| W-24 allowCustomValue | Ark UI / Carbon | `allowCustomValue` exact name ("allow typing custom values") | [F] ark-ui combobox; [S] Carbon d.ts | SHAPED-BY-PRIOR-ART (RAC `allowsCustomValue` differs by one letter; MUI `freeSolo` is semantic analog) |
| W-24 closeOnBlur | Chakra 2019 proposal / Downshift+RAC behavior | Name only in chakra-ui#140 proposal ([S]); blur-closes is the universal *default* (Downshift InputBlur, RAC revert-on-blur) | [S] chakra-ui#140; [S] downshift#1011/#1624; [F] RAC ComboBox | Name weakly traced; dedicated shipped boolean: NO-TRACE (RAC/Ark/MUI/Downshift/Headless surveyed — none ship `closeOnBlur`) |
| W-25 formatOptions | RAC + Spectrum + Ark | `formatOptions: Intl.NumberFormatOptions` — "compatible with `Intl.NumberFormat`" | [F] ×3: RAC NumberField, Spectrum NumberField, ark number-input | SHAPED-BY-PRIOR-ART — triple confirmation of name + type |
| W-26 consumer setup doc | MUI / Radix / Radix Themes | Install + peer-deps + CSS-import + provider-wrap setup pages | [F] mui.com installation (v9.4.0); [F] both Radix getting-started pages | SHAPED-BY-PRIOR-ART |
| W-27 min-CSS dialog recipe | Radix unstyled / shadcn maximal | Radix: "Add your styles" (no recipe); shadcn: full opinionated recipe | [F] Radix getting-started; [S] shadcn dialog docs | DIVERGENT — minimum-CSS recipe is our own synthesis between the poles |
| W-28 choice items | Radix DropdownMenu | `CheckboxItem`/`RadioGroup`/`RadioItem` + `ItemIndicator`; `checked`/`value` + `onCheckedChange`/`onValueChange`; `menuitemcheckbox/radio` + typeahead via `textValue` | [F] radix-ui.com dropdown-menu | SHAPED-BY-PRIOR-ART — part names + props mirrored exactly (RAC selectionMode, Chakra MenuOptionGroup, APG toggle-without-closing corroborate) |
| W-29 Menubar root | Radix Menubar | Single `value` (one open ⇒ open-one-closes-others); Left/Right tables; Esc closes current menu + focus to Trigger | [F] radix-ui.com menubar | SHAPED-BY-PRIOR-ART |
| W-29 Esc semantics | APG menubar | Esc closes only *the menu containing focus*, one level per press (Tab closes all) | [F] APG menubar Keyboard Interaction | CONTRADICTS "Esc closes all" — coincide at one level, differ with nested submenus |
| W-30 dist-executed examples | Docusaurus live blocks / MUI docs-infra | Examples execute against docs-site scope / live workspace source — never a packed tarball | [S] Docusaurus code-blocks guide; [S] mui-public docs-infra | DIVERGENT — dist-executed is strictly stronger; no system found doing it |
| W-31 pack smoke + fail-on-console | harness-sdk CI / merchant-center-kit / jest-fail-on-console / Playwright | Pack-tarball smoke + `publint`/`attw`; zero-console-error assertion is standard dogfooding | [S] strands-agents README, commercetools package-shape-verification.md, jest-fail-on-console | SHAPED-BY-PRIOR-ART per-part (general practice, not one library) |
| W-31 mount-all gate | — | Pack dist → bare Vite app → mount full catalogue → assert silence, as one CI gate | Searched Vite consumer tests, design-system CIs, MUI/Chakra layouts | NO-TRACE for the combination |
| W-32 dark-theme path | Radix Themes / MUI / Chakra | `<Theme appearance>` class-switch contract; MUI `palette.mode`; Chakra ColorModeScript | [F] Radix dark-mode + MUI dark-mode docs; [S] Chakra color-mode.mdx | SHAPED-BY-PRIOR-ART |
| W-32 inline-vs-class contract | Radix Themes styling doc (closest) | "No css/sx prop… customization via props, tokens" — but no explicit inline-geometry vs class line | [F] radix-ui.com/themes styling | NO-TRACE for the split as a documented consumer contract |
| W-33 submenu parity | Radix Sub/SubTrigger/SubContent | Dir-aware ArrowRight/Left open/close; APG Enter/Space/Right open + focus first; RAC SubmenuTrigger; Ark SubmenuRoot | [F] Radix menubar + dropdown-menu; [F] APG; [F] RAC Menu; [S] Ark menu.mdx | SHAPED-BY-PRIOR-ART |
| W-33 hover timing | — | Open-on-hover delays, grace areas — runtime convention, not a documented contract (APG has no pointer model; Headless has no submenus) | Looked: both Radix pages full text, APG, Headless | NO-TRACE in docs |
| W-34 collapse | Radix Collapsible + Accordion | `open`/`defaultOpen`/`onOpenChange`, Trigger/Content, `data-state`, disclosure pattern; Accordion `type` + `collapsible` | [F] both Radix pages | SHAPED-BY-PRIOR-ART |
| W-35 clamp half | Radix Slider #1988 / RAC `snapValueToStep` / native range | Out-of-bounds values clamp silently (thumb 0–100%, ARIA agrees) | [S] radix PR #1988; [S] react-spectrum#5655 diff | SHAPED-BY-PRIOR-ART |
| W-35 warn half | Chakra NumberInput (closest) | Out-of-range sets silent internal `isInvalid`, not a console warning | [F] v2.chakra-ui.com number-input | NO-TRACE for console-warn (MUI internals not doc-surfaced; Headless has no slider) |

## NO-TRACE list (strict — nothing found anywhere surveyed)

1. W-04 — dev-runtime **throw** for uncompilable style values (loudness
   principle traced to lint/compile-time systems; the throw mechanism is new).
2. W-11 — the exact boolean prop name **`dismissable`** (shape analogues:
   native `popover="manual"`, Radix `modal`).
3. W-24 — a shipped **`closeOnBlur`** boolean (name exists only in a 2019
   Chakra proposal issue; behavior is the universal default everywhere).
4. W-31 — the **combined gate**: pack dist → bare Vite app → mount every
   component → assert zero console errors (each half traced separately).
5. W-32 — an explicit documented **inline-geometry vs class-driven** consumer
   contract.
6. W-33 — **hover-timing specifics** (delays, grace areas) in any docs.
7. W-35 — **console-warn** on out-of-range controlled values.
8. W-02 — the third enum value **`commitBehavior="none"`** as a name
   (behavior traced via Mantine `clampBehavior="none"`).
9. W-16 (partial) — any non-MUI system warning on unmatched controlled keys
   (MUI is the sole precedent; everyone else is silent).
10. W-29 — "Esc closes all" is worse than no-trace: **APG contradicts it**
    (one level per press).

## Recommended verdict changes

- **W-02: GO CONFIRMED — HQ challenge answered.** The `commitBehavior`-shaped
  prop exists in the wild verbatim (React Aria `commitBehavior: 'snap' |
  'validate'`, default `'snap'`, shipped v1.17.0). HQ's snap-in-onChange
  suspicion is confirmed as the *mechanism* (`commit()` fires `onChange`
  with the snapped value) but upstream still ships the prop, so the
  docs-guidance fallback is rejected. Two flags, no verdict change: (a) our
  default keeps today's behavior (`none`) while Spectrum defaults `snap` —
  divergent default, keep deliberately; (b) our third value `none` is
  behaviorally traced (Mantine `clampBehavior="none"`) but the enum spelling
  is ours.
- **W-29: RESHAPE.** Esc should close one level per press with focus return
  per APG, not "close all" (coincides at one level; differs with nested
  submenus). Everything else (single-open root, Left/Right) stands as GO.
- **W-21: minor RESHAPE note.** `firstDayOfWeek` name is exact React Aria,
  but RAC takes weekday-name strings (`"sun"\|"mon"…`) while our sketch
  takes a number (`{1}`). Either align the type or document the divergence.
- **W-11: RESHAPE (ordering).** Lead with `preventDefault`-cancels (exact
  Radix contract, fetched); add the `dismissable?` boolean only if a case
  needs it, knowing the name is ours alone.
- **W-24: GO with note.** `autocomplete="both"` (APG/RAC) and
  `allowCustomValue` (Ark exact) are solid; `closeOnBlur`'s name is weakly
  traced (2019 proposal issue) and no shipped system has the boolean —
  consider whether the dialog-blur case can ride existing
  outside-interaction handlers instead, or keep the name deliberately.
- **W-35: GO with note.** Clamp-silently matches Radix/RAC/native; the
  dev-warn half is our addition (closest: Chakra's silent `isInvalid`).
  Dev-only and low-risk — keep.
- **W-04: GO, no change.** Dev-throw mechanism is novel but dev-only and
  serves a traced principle (Panda/StyleX lint errors, React dev warnings).
- **W-13 / W-27 / W-30 / W-31 / W-32: GO, no change.** Divergences and
  no-traces here are docs/process artifacts where novelty is safe (honest
  labeling, stronger gates, contracts we write ourselves).
- **All remaining wants (W-01, W-03, W-09, W-15, W-16, W-17, W-19, W-20,
  W-25, W-26, W-28, W-33, W-34): GO, no change** — shaped by prior art.
