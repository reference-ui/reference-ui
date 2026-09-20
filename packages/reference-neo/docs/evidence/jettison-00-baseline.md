# Slice 0 baseline — pre-cutover class strings and artifact sizes

Date: 2026-09-20. Operation Jettison, Slice 0 (oracle and red stations).
This file is the pre-cutover golden: the resting class string of every
id-carrying element in every Neo browser case, plus the three shipped
lib artifact sizes. The NEO-NAMER-02 spec inlines its case rows from
this file; later slices diff against it.

## Lib artifacts (pre-cutover, schema 1, per-atom rows shipped)

| Artifact | Raw (B) | gzip-6 (B) | Carries plans? |
|---|---|---:|---|
| `react/react.mjs` | 527,253 | 46,730 | yes — 2,223 plans inlined (`stylePlans` ×2 in file) |
| `styled/runtime-data.mjs` | 419,623 | 32,345 | yes — 2,223 plans, system `reference-ui` |
| `system/baseSystem.mjs` | 1,230,874 | 83,973 | yes — patched `.runtime` (`stylePlans` ×1 in file) |

Measured with `wc -c` and `gzip -6 -c | wc -c` over
`packages/reference-lib/.reference-ui/`. Plan count read off the
`runtimeData` export (`stylePlans.length`, `schemaVersion: 1`).

## Method

For each of the 173 cases: rebuild `world/dist`, re-run sync when the
case opts in, serve over local HTTP, load headless Chromium, settle
250 ms past `load`, and read `class` off every `[id]` element in
document order. Zero serve/sync failures. Repro: the same loop over
`tests/shared/{cases,build,server}.ts` plus one Chromium page; the
disposable driver lived at `/tmp/namer-baseline-dump.mjs` (audit kept,
never committed). Total: 854 element rows.

## Notes

- `NEO-SITE-11` was already red at capture (`chart` carries `ref-div`,
  not the padding utility; the sheet holds zero case utilities).
  Pre-existing, unrelated to the naming work; captured as-is.
- `NEO-NAMER-03 miss` is `""` pre-cutover; the station pins the miss
  class once the runtime namer constructs it.
- `NEO-NAMER-01` is node-side; its `root` row exists only to satisfy
  the served-world preflight.
- `md:` lists rest on their base entries: the engine wraps breakpoints
  in `@container` queries and these worlds carry no container root,
  so the condition classes are present-but-unmatched at every width.

## NEO-COND-01 — `cond/NEO-COND-01`

- `live` → `neo-cond-01__c_ink neo-cond-01__hover:c_brand`
- `twin` → `neo-cond-01__hover:c_brand`

## NEO-COND-02 — `cond/NEO-COND-02`

- `root` → `neo-cond-02__cq-t_inline-size`
- `twin` → `neo-cond-02__bg_ink neo-cond-02__hover:sm:dark:bg_paper`
- `live` → `neo-cond-02__bg_ink neo-cond-02__hover:sm:dark:bg_paper`

## NEO-COND-03 — `cond/NEO-COND-03`

- `full` → `neo-cond-03__c_ink neo-cond-03__hover:disabled:c_brand`
- `aria` → `neo-cond-03__c_ink neo-cond-03__hover:disabled:c_brand`
- `hoverOnly` → `neo-cond-03__c_ink neo-cond-03__hover:disabled:c_brand`
- `disabledOnly` → `neo-cond-03__c_ink neo-cond-03__hover:disabled:c_brand`
- `live` → `neo-cond-03__c_ink neo-cond-03__hover:disabled:c_brand`

## NEO-COND-04 — `cond/NEO-COND-04`

- `outer` → (no class)
- `mode` → `neo-cond-04__c_brand neo-cond-04__light:c_ink neo-cond-04__dark:c_paper`

## NEO-COND-05 — `cond/NEO-COND-05`

- `field` → (no class)
- `sibling` → `neo-cond-05__c_ink neo-cond-05__[input:hover_&]:c_brand`
- `plain` → (no class)

## NEO-COND-06 — `cond/NEO-COND-06`

- `parent` → `neo-cond-06__[&_>_p]:c_brand`
- `child` → (no class)
- `mid` → (no class)
- `grandchild` → (no class)

## NEO-COND-07 — `cond/NEO-COND-07`

- `open` → `neo-cond-07__[&[data-state='open']]:c_brand`
- `closed` → `neo-cond-07__[&[data-state='open']]:c_brand`
- `expanded` → `neo-cond-07__expanded:c_accent`

## NEO-COND-08 — `cond/NEO-COND-08`

- `quote` → `neo-cond-08__hover:c_accent neo-cond-08__before:content_"yes!" neo-cond-08__before:c_brand neo-cond-08__after:content_"[end]" neo-cond-08__after:c_accent`
- `plain` → (no class)

## NEO-COND-09 — `cond/NEO-COND-09`

- `comma` → `neo-cond-09__c_ink neo-cond-09__[&:focus,_&:hover]:c_brand`
- `plain` → (no class)

## NEO-COND-10 — `cond/NEO-COND-10`

- `parent` → (no class)
- `child` → `neo-cond-10__c_ink neo-cond-10__[:focus_>_&]:c_brand`
- `other` → (no class)
- `plain` → (no class)

## NEO-COND-11 — `cond/NEO-COND-11`

- `group` → `group`
- `groupTarget` → `neo-cond-11__c_ink neo-cond-11__groupHover:c_brand`
- `peer` → `peer`
- `peerTarget` → `neo-cond-11__c_ink neo-cond-11__peerFocus:c_brand`
- `plain` → (no class)

## NEO-COND-12 — `cond/NEO-COND-12`

- `motion` → `neo-cond-12__anim_spin_2s_linear_infinite neo-cond-12__motionReduce:anim_none`
- `scheme` → `neo-cond-12__c_ink neo-cond-12__osDark:c_brand`
- `paper` → `neo-cond-12__d_block neo-cond-12__print:d_none`

## NEO-COND-13 — `cond/NEO-COND-13`

- `sibling` → `neo-cond-13__c_ink`

## NEO-COND-14 — `cond/NEO-COND-14`

- `name` → `neo-cond14__placeholder:c_hint`
- `upload` → `neo-cond14__file:c_file`
- `agree` → `neo-cond14__checked:c_tick`
- `agree-twin` → `neo-cond14__checked:c_tick`

## NEO-COND-15 — `cond/NEO-COND-15`

- `root` → `neo-cond15__cq-t_inline-size`
- `live` → `neo-cond15__c_ink neo-cond15__[@supports_(display:_grid)]:sm:[&:hover]:c_brand`
- `bogus` → `neo-cond15__c_ink neo-cond15__[@supports_(display:_bogus-magic)]:sm:c_brand`
- `narrow` → `neo-cond15__cq-t_inline-size`
- `narrow-probe` → `neo-cond15__c_ink neo-cond15__[@supports_(display:_grid)]:sm:[&:hover]:c_brand`

## NEO-COND-16 — `cond/NEO-COND-16`

- `iconOnly` → `neo-cond-16__px_20px neo-cond-16__[&:where(:has(>_[data-slot="icon"]:only-child,_>_svg:only-child))]:px_0`
- `text` → `neo-cond-16__px_20px neo-cond-16__[&:where(:has(>_[data-slot="icon"]:only-child,_>_svg:only-child))]:px_0`

## NEO-COND-17 — `cond/NEO-COND-17`

- `row` → (no class)
- `first` → (no class)
- `scoped` → `neo-cond-17__c_ink neo-cond-17__[&:not(:first-child),_:only-child]:c_brand`
- `kid` → (no class)
- `solo-wrap` → (no class)
- `solo` → (no class)

## NEO-CSS-01 — `css/NEO-CSS-01`

- `paint` → `neo-css__c_brand neo-css__bg-c_ink neo-css__p_sm`
- `hoverable` → `neo-css__hover:c_brand`

## NEO-CSS-02 — `css/NEO-CSS-02`

- `wide` → (no class)
- `wide-probe` → `neo-css2__[@container_(min-width:_320px)]:c_paper`
- `narrow` → (no class)
- `narrow-probe` → `neo-css2__[@container_(min-width:_320px)]:c_paper`

## NEO-CSS-03 — `css/NEO-CSS-03`

- `narrow` → (no class)
- `evicted-narrow` → `neo-css3__w_70px`
- `responsive-narrow` → `neo-css3__w_50px neo-css3__md:w_60px`
- `wide` → (no class)
- `evicted-wide` → `neo-css3__w_70px`
- `responsive-wide` → `neo-css3__w_50px neo-css3__md:w_60px`

## NEO-CSS-04 — `css/NEO-CSS-04`

- `probe` → `neo-css4__w_42 neo-css4__op_1 neo-css4__z_0 neo-css4__--foo_42`

## NEO-CSS-05 — `css/NEO-CSS-05`

- `holes` → `neo-css5__c_brand`
- `empty` → (no class)

## NEO-CSS-06 — `css/NEO-CSS-06`

- `probe` → `neo-css6__background-image_linear-gradient({colors.ember},_{colors.ocean})`

## NEO-CSS-07 — `css/NEO-CSS-07`

- `rgba` → `neo-css7__c_rgba(255,255,255,0.04)`
- `mix` → `neo-css7__bg-c_color-mix(in_oklch,_currentColor_14%,_transparent)`
- `calc-wrap` → (no class)
- `calc` → `neo-css7__w_calc(100%_-_8px)`

## NEO-CSS-08 — `css/NEO-CSS-08`

- `bang` → `neo-css8__c_red! neo-css8__c_yellow`
- `spaced` → `neo-css8__c_red! neo-css8__c_yellow`
- `upper` → `neo-css8__c_red! neo-css8__c_yellow`
- `plain` → `neo-css8__c_yellow`
- `content` → `neo-css8__content_"hello!"`

## NEO-CSS-09 — `css/NEO-CSS-09`

- `dots` → `neo-css9__mt_1.5rem`
- `wrap-pct` → (no class)
- `pct` → `neo-css9__w_50%`
- `wrap-calc` → (no class)
- `calc` → `neo-css9__p_calc(100%_-_1rem)`
- `slash` → `neo-css9__aspect-ratio_16_/_9`
- `quotes` → `neo-css9__font-family_"Inter",_sans-serif`
- `brackets` → `neo-css9__content_"[a]"`
- `commas` → `neo-css9__shadow_1px_1px_red,_2px_2px_blue`

## NEO-CSS-10 — `css/NEO-CSS-10`

- `size` → `neo-css10__w_20px neo-css10__h_20px`
- `font` → `neo-css10__font-family_sans neo-css10__font-weight_400`
- `weight` → `neo-css10__font-weight_700`

## NEO-CSS-11 — `css/NEO-CSS-11`

- `holder` → `neo-css11__--testVariable0_hotpink`
- `ink` → `neo-css11__c_var(--testVariable0)`

## NEO-CSS-12 — `css/NEO-CSS-12`

- `int` → `neo-css12__mt_4r`
- `decimal` → `neo-css12__pt_3.5r`
- `fraction` → `neo-css12__mb_1/2r`

## NEO-CSS-13 — `css/NEO-CSS-13`

- `row` → `neo-css13__d_flex`
- `one` → `neo-css13__flex_1_1_0%`
- `zero` → `neo-css13__flex_0_0_auto`
- `auto` → `neo-css13__flex_1_1_auto`
- `initial` → `neo-css13__flex_0_1_auto`
- `none` → `neo-css13__flex_none`
- `grow` → `neo-css13__flex_2_30px`

## NEO-CSS-14 — `css/NEO-CSS-14`

- `probe` → `neo-css14__c_red`
- `pick` → (no class)
- `miss` → (no class)

## NEO-EDGE-01 — `cond/NEO-EDGE-01`

- `hoverable` → `neo-edge__hover:c_brand`
- `focusable` → `neo-edge__focus:c_paper`
- `disableable` → `neo-edge__disabled:c_ink`

## NEO-EDGE-02 — `token/NEO-EDGE-02`

- `rounded` → `neo-edge2__rounded_md`
- `pill` → `neo-edge2__rounded_full`
- `dotted` → `neo-edge2__rounded_radii.md`

## NEO-GLOBAL-01 — `global/NEO-GLOBAL-01`

- `probe` → `ref-probe`

## NEO-GLOBAL-02 — `global/NEO-GLOBAL-02`

- `probe` → (no class)

## NEO-GLOBAL-03 — `global/NEO-GLOBAL-03`

- `base` → `ref-button`
- `slotted` → `ref-button`
- `icon` → (no class)
- `disabled` → `ref-button`
- `hovered` → `ref-button`
- `focused` → `ref-button`

## NEO-GLOBAL-04 — `global/NEO-GLOBAL-04`

- `quote` → `ref-q`

## NEO-GLOBAL-05 — `global/NEO-GLOBAL-05`

- `field` → `ref-input`

## NEO-GLOBAL-06 — `global/NEO-GLOBAL-06`

- `first` → (no class)
- `second` → (no class)
- `list-first` → (no class)
- `list-second` → (no class)
- `nested` → (no class)

## NEO-GLOBAL-07 — `global/NEO-GLOBAL-07`

- `note` → `ref-note`
- `far` → `ref-far`
- `narrow` → (no class)
- `narrow-chip` → `ref-chip`
- `wide` → (no class)
- `wide-chip` → `ref-chip`
- `live` → (no class)
- `live-chip` → `ref-chip`

## NEO-GLOBAL-08 — `global/NEO-GLOBAL-08`

- `serif` → `ref-serif`
- `mono` → `ref-mono`

## NEO-GLOBAL-09 — `global/NEO-GLOBAL-09`

- `probe` → `ref-plain`

## NEO-GLOBAL-10 — `global/NEO-GLOBAL-10`

- `valid-bezel` → (no class)
- `valid-input` → (no class)
- `invalid-bezel` → (no class)
- `invalid-input` → (no class)
- `twin-bezel` → (no class)
- `twin-input` → (no class)

## NEO-GLOBAL-11 — `global/NEO-GLOBAL-11`

- `range` → `ref-range`
- `upload` → `ref-upload`

## NEO-GLOBAL-12 — `global/NEO-GLOBAL-12`

- `base` → `ref-button`
- `hovered` → `ref-button`
- `pressed` → `ref-button`
- `hover-ref` → (no class)
- `press-ref` → (no class)

## NEO-GLOBAL-13 — `global/NEO-GLOBAL-13`

- `card` → `card`

## NEO-LAYER-01 — `layer/NEO-LAYER-01`

- `varprobe` → `neo-layer1__--colors-brand_#00aa00 neo-layer1__c_brand`
- `darkcontrol` → `neo-layer1__c_brand`
- `toneprobe` → `ref-chip neo-layer1__c_brand`
- `tonecontrol` → `ref-chip`

## NEO-LAYER-02 — `layer/NEO-LAYER-02`

- `mixed` → `neo-layer2__card__base neo-layer2__c_ink`
- `recipeonly` → `neo-layer2__card__base`
- `up` → `neo-layer2__c_brass`
- `portable` → (no class)

## NEO-LAYER-03 — `layer/NEO-LAYER-03`

- `anim` → `neo-layer3__c_ink neo-layer3__anim_fadeSlide_1s_ease-in-out_infinite`
- `fontprobe` → `neo-layer3__c_ink neo-layer3__font-family_display`

## NEO-LAYER-04 — `sync/NEO-LAYER-04`

- `plain` → (no class)
- `title` → (no class)
- `brand` → `neo-layer4__c_brand`

## NEO-LAYER-05 — `layer/NEO-LAYER-05`

- `host` → `neo-layer5__button__base neo-layer5__button_s_sm neo-layer5__c_brand`
- `recipeonly` → `neo-layer5__button__base neo-layer5__button_s_sm`

## NEO-LAYER-06 — `layer/NEO-LAYER-06`

- `recipeprobe` → `neo-layer6__card__base`
- `utilprobe` → `neo-layer6__c_brand`

## NEO-MERGE-01 — `merge/NEO-MERGE-01`

- `paint` → `neo-merge-01__c_ocean`

## NEO-MERGE-02 — `merge/NEO-MERGE-02`

- `paint` → `neo-merge-02__bg_clay`

## NEO-MERGE-03 — `merge/NEO-MERGE-03`

- `pad` → `neo-merge-03__p_sm neo-merge-03__pt_lg`

## NEO-MERGE-04 — `merge/NEO-MERGE-04`

- `edge` → `neo-merge-04__bd-b-w_1px neo-merge-04__bd-b-s_solid neo-merge-04__bd-c_slate`

## NEO-MERGE-05 — `merge/NEO-MERGE-05`

- `args` → `neo-merge-05__c_ember neo-merge-05__hover:c_ocean`
- `list` → `neo-merge-05__c_ember neo-merge-05__hover:c_ocean`

## NEO-MERGE-06 — `merge/NEO-MERGE-06`

- `live` → `neo-merge-06__c_ember`
- `miss` → (no class)

## NEO-MERGE-07 — `merge/NEO-MERGE-07`

- `early` → `neo-merge-07__c_ember!`
- `late` → `neo-merge-07__c_ember!`
- `plain` → `neo-merge-07__c_ocean`

## NEO-MERGE-08 — `merge/NEO-MERGE-08`

- `probe` → `neo-merge-08__flex-dir_column`

## NEO-NAMER-01 — `namer/NEO-NAMER-01`

- `root` → (no class)

## NEO-NAMER-02 — `namer/NEO-NAMER-02`

- `hole` → (no class)
- `resp` → `neo-namer-02__c_#111111 neo-namer-02__md:c_#333333`
- `obj` → `neo-namer-02__w_1r neo-namer-02__md:w_3r`
- `hover` → `neo-namer-02__c_#111111 neo-namer-02__hover:c_#222222`
- `bp` → `neo-namer-02__c_#444444 neo-namer-02__md:c_#555555`
- `bang` → `neo-namer-02__c_#666666!`
- `font` → `neo-namer-02__font-family_sans neo-namer-02__font-weight_400`
- `size` → `neo-namer-02__w_20px neo-namer-02__h_20px`
- `border` → `neo-namer-02__bd-w_3px neo-namer-02__border-style_solid neo-namer-02__bd-c_red`
- `radius` → `neo-namer-02__rounded-tl_4px neo-namer-02__rounded-tr_4px`
- `flex` → `neo-namer-02__flex_1_1_0%`

## NEO-NAMER-03 — `namer/NEO-NAMER-03`

- `live` → `neo-namer-03__c_ember`
- `miss` → (no class)

## NEO-PARITY-01 — `parity/NEO-PARITY-01`

- `root` → (no class)
- `comp-button` → `ref-button`
- `comp-button-base` → `ref-button`
- `comp-field` → `ref-div`
- `comp-field-input` → `ref-input neo-parity__c_ink`
- `comp-file` → `ref-input neo-parity__c_ink ref-file`
- `probe-range` → `ref-input ref-range`
- `comp-disc` → `ref-details ref-disclosure`
- `comp-disc-summary` → `ref-summary`
- `comp-table` → `ref-table ref-table`
- `comp-table-head` → `ref-th`
- `comp-table-cell` → `ref-td neo-parity__c_ink`
- `comp-link` → `ref-a neo-parity__hover:c_ink ref-link`
- `comp-quote` → `ref-q ref-q`
- `comp-list` → `ref-ul ref-list`
- `recipe-card-raised` → `ref-div neo-parity__card__base neo-parity__card_e_true`
- `recipe-card-flat` → `ref-div neo-parity__card__base neo-parity__card_e_false`
- `recipe-chip-combo` → `ref-div neo-parity__chip__base neo-parity__chip_t_loud neo-parity__chip_s_lg neo-parity__chip_c_loud_lg`
- `recipe-chip-plain` → `ref-div neo-parity__chip__base neo-parity__chip_t_quiet neo-parity__chip_s_sm`
- `region` → `ref-div neo-parity__cq-t_inline-size neo-parity__cq-n_sidebar`
- `p13-first` → `ref-div neo-parity__item__base neo-parity__item_s_sm md:neo-parity__item_s_lg`
- `p13-second` → `ref-div neo-parity__item__base neo-parity__item_s_sm md:neo-parity__item_s_lg`
- `f32` → `ref-div neo-parity__w_50px neo-parity__sm:w_60px`
- `p5` → `ref-div neo-parity__c_ink neo-parity__[@supports_(display:_grid)]:sm:c_brand`
- `narrow` → `ref-div neo-parity__cq-t_inline-size`
- `p13-narrow-first` → `ref-div neo-parity__item__base neo-parity__item_s_sm md:neo-parity__item_s_lg`
- `p5-narrow` → `ref-div neo-parity__c_ink neo-parity__[@supports_(display:_grid)]:sm:c_brand`
- `p2-first` → `ref-div neo-parity__[&_+_&]:ml_8px`
- `p2-second` → `ref-div neo-parity__[&_+_&]:ml_8px`
- `p6` → (no class)
- `p9` → `ref-div neo-parity__vh__base`
- `p11-open` → `ref-div neo-parity__[&[data-state="open"]:hover]:c_brand`
- `p11-closed` → `ref-div neo-parity__[&[data-state="open"]:hover]:c_brand`
- `p12` → `ref-div neo-parity__d_flex neo-parity__ov_hidden neo-parity__tracking_-0.01em neo-parity__fs_16px`
- `probe-font` → `ref-div neo-parity__font-family_sans neo-parity__font-weight_700`
- `p17` → `ref-div neo-parity__bg-c_brand/40`
- `p18` → `ref-div neo-parity__-webkit-box-orient_vertical`
- `p5-empty` → `ref-div neo-parity__c_ink`
- `p4` → `ref-div neo-parity__rounded-tl_2r neo-parity__rounded-tr_2r neo-parity__rounded-bl_2r neo-parity__rounded-br_2r`
- `p4-logical` → `ref-div neo-parity__border-start-start-radius_2r neo-parity__border-end-start-radius_2r neo-parity__border-start-end-radius_2r neo-parity__border-end-end-radius_2r`
- `p14` → `ref-div neo-parity__background-image_linear-gradient({colors.red.200},_{colors.blue.300}) neo-parity__-webkit-background-clip_text neo-parity__c_transparent`
- `p15` → `ref-div neo-parity__c_blue.300 neo-parity__bg-c_red.500`
- `p19` → `ref-div`
- `p20` → `ref-div`
- `p20-far` → `ref-div`
- `p21` → `ref-div`
- `f1` → `ref-div neo-parity__bg_red/abc`
- `probe-negative` → `ref-div neo-parity__mt_-sm`
- `probe-calc` → `ref-div neo-parity__fs_3.5r`
- `probe-bang` → `ref-div neo-parity__px_sm neo-parity__c_brand!`
- `probe-group` → `ref-div neo-parity__c_ink neo-parity__groupHover:c_brand`
- `probe-peer` → `ref-div neo-parity__c_ink neo-parity__peerFocus:c_brand`
- `probe-motion` → `ref-div neo-parity__anim_fade.quick neo-parity__motionReduce:anim_none`
- `probe-scheme` → `ref-div neo-parity__c_ink neo-parity__osDark:c_brand`
- `probe-paper` → `ref-div neo-parity__d_block neo-parity__print:d_none`
- `probe-radius-token` → `ref-div neo-parity__rounded_lg`
- `probe-radius-rhythm` → `ref-div neo-parity__rounded_1r`
- `probe-anim` → `ref-div neo-parity__anim_fade.quick`
- `dark-override` → `ref-div neo-parity__c_ink neo-parity__dark:c_accent`
- `parity-portal` → (no class)
- `p1` → `ref-div neo-parity__c_ink`

## NEO-PARITY-02 — `parity/NEO-PARITY-02`

- `root` → (no class)
- `comp-button` → `ref-button`
- `comp-button-base` → `ref-button`
- `comp-field` → `ref-div`
- `comp-field-input` → `ref-input neo-parity__c_ink`
- `comp-file` → `ref-input neo-parity__c_ink ref-file`
- `probe-range` → `ref-input ref-range`
- `comp-disc` → `ref-details ref-disclosure`
- `comp-disc-summary` → `ref-summary`
- `comp-table` → `ref-table ref-table`
- `comp-table-head` → `ref-th`
- `comp-table-cell` → `ref-td neo-parity__c_ink`
- `comp-link` → `ref-a neo-parity__hover:c_ink ref-link`
- `comp-quote` → `ref-q ref-q`
- `comp-list` → `ref-ul ref-list`
- `recipe-card-raised` → `ref-div neo-parity__card__base neo-parity__card_e_true`
- `recipe-card-flat` → `ref-div neo-parity__card__base neo-parity__card_e_false`
- `recipe-chip-combo` → `ref-div neo-parity__chip__base neo-parity__chip_t_loud neo-parity__chip_s_lg neo-parity__chip_c_loud_lg`
- `recipe-chip-plain` → `ref-div neo-parity__chip__base neo-parity__chip_t_quiet neo-parity__chip_s_sm`
- `region` → `ref-div neo-parity__cq-t_inline-size neo-parity__cq-n_sidebar`
- `p13-first` → `ref-div neo-parity__item__base neo-parity__item_s_sm md:neo-parity__item_s_lg`
- `p13-second` → `ref-div neo-parity__item__base neo-parity__item_s_sm md:neo-parity__item_s_lg`
- `f32` → `ref-div neo-parity__w_50px neo-parity__sm:w_60px`
- `narrow` → `ref-div neo-parity__cq-t_inline-size`
- `p13-narrow-first` → `ref-div neo-parity__item__base neo-parity__item_s_sm md:neo-parity__item_s_lg`
- `p2-first` → `ref-div neo-parity__[&_+_&]:ml_8px`
- `p2-second` → `ref-div neo-parity__[&_+_&]:ml_8px`
- `p6` → (no class)
- `p9` → `ref-div neo-parity__vh__base`
- `p11-open` → `ref-div neo-parity__[&[data-state="open"]:hover]:c_brand`
- `p11-closed` → `ref-div neo-parity__[&[data-state="open"]:hover]:c_brand`
- `p12` → `ref-div neo-parity__d_flex neo-parity__ov_hidden neo-parity__tracking_-0.01em neo-parity__fs_16px`
- `probe-font` → `ref-div neo-parity__font-family_sans neo-parity__font-weight_700`
- `p17` → `ref-div neo-parity__bg-c_brand/40`
- `p18` → `ref-div neo-parity__-webkit-box-orient_vertical`
- `f1` → `ref-div neo-parity__bg_red/abc`
- `probe-negative` → `ref-div neo-parity__mt_-sm`
- `probe-calc` → `ref-div neo-parity__fs_3.5r`
- `probe-bang` → `ref-div neo-parity__px_sm neo-parity__c_brand!`
- `probe-group` → `ref-div neo-parity__c_ink neo-parity__groupHover:c_brand`
- `probe-peer` → `ref-div neo-parity__c_ink neo-parity__peerFocus:c_brand`
- `probe-motion` → `ref-div neo-parity__anim_fade.quick neo-parity__motionReduce:anim_none`
- `probe-scheme` → `ref-div neo-parity__c_ink neo-parity__osDark:c_brand`
- `probe-paper` → `ref-div neo-parity__d_block neo-parity__print:d_none`
- `probe-radius-token` → `ref-div neo-parity__rounded_lg`
- `probe-radius-rhythm` → `ref-div neo-parity__rounded_1r`
- `probe-anim` → `ref-div neo-parity__anim_fade.quick`
- `dark-override` → `ref-div neo-parity__c_ink neo-parity__dark:c_accent`
- `parity-portal` → (no class)
- `p1` → `ref-div neo-parity__c_ink`

## NEO-PARITY-03 — `parity/NEO-PARITY-03`

- `root` → (no class)
- `comp-button` → `ref-button`
- `comp-button-base` → `ref-button`
- `comp-field` → `ref-div`
- `comp-field-input` → `ref-input neo-parity__c_ink`
- `comp-file` → `ref-input neo-parity__c_ink ref-file`
- `probe-range` → `ref-input ref-range`
- `comp-disc` → `ref-details ref-disclosure`
- `comp-disc-summary` → `ref-summary`
- `comp-table` → `ref-table ref-table`
- `comp-table-head` → `ref-th`
- `comp-table-cell` → `ref-td neo-parity__c_ink`
- `comp-link` → `ref-a neo-parity__hover:c_ink ref-link`
- `comp-quote` → `ref-q ref-q`
- `comp-list` → `ref-ul ref-list`
- `recipe-card-raised` → `ref-div neo-parity__card__base neo-parity__card_e_true`
- `recipe-card-flat` → `ref-div neo-parity__card__base neo-parity__card_e_false`
- `recipe-chip-combo` → `ref-div neo-parity__chip__base neo-parity__chip_t_loud neo-parity__chip_s_lg neo-parity__chip_c_loud_lg`
- `recipe-chip-plain` → `ref-div neo-parity__chip__base neo-parity__chip_t_quiet neo-parity__chip_s_sm`
- `region` → `ref-div neo-parity__cq-t_inline-size neo-parity__cq-n_sidebar`
- `p13-first` → `ref-div neo-parity__item__base neo-parity__item_s_sm md:neo-parity__item_s_lg`
- `p13-second` → `ref-div neo-parity__item__base neo-parity__item_s_sm md:neo-parity__item_s_lg`
- `f32` → `ref-div neo-parity__w_50px neo-parity__sm:w_60px`
- `narrow` → `ref-div neo-parity__cq-t_inline-size`
- `p13-narrow-first` → `ref-div neo-parity__item__base neo-parity__item_s_sm md:neo-parity__item_s_lg`
- `p2-first` → `ref-div neo-parity__[&_+_&]:ml_8px`
- `p2-second` → `ref-div neo-parity__[&_+_&]:ml_8px`
- `p6` → (no class)
- `p9` → `ref-div neo-parity__vh__base`
- `p11-open` → `ref-div neo-parity__[&[data-state="open"]:hover]:c_brand`
- `p11-closed` → `ref-div neo-parity__[&[data-state="open"]:hover]:c_brand`
- `p12` → `ref-div neo-parity__d_flex neo-parity__ov_hidden neo-parity__tracking_-0.01em neo-parity__fs_16px`
- `probe-font` → `ref-div neo-parity__font-family_sans neo-parity__font-weight_700`
- `p17` → `ref-div neo-parity__bg-c_brand/40`
- `p18` → `ref-div neo-parity__-webkit-box-orient_vertical`
- `f1` → `ref-div neo-parity__bg_red/abc`
- `probe-negative` → `ref-div neo-parity__mt_-sm`
- `probe-calc` → `ref-div neo-parity__fs_3.5r`
- `probe-bang` → `ref-div neo-parity__px_sm neo-parity__c_brand!`
- `probe-group` → `ref-div neo-parity__c_ink neo-parity__groupHover:c_brand`
- `probe-peer` → `ref-div neo-parity__c_ink neo-parity__peerFocus:c_brand`
- `probe-motion` → `ref-div neo-parity__anim_fade.quick neo-parity__motionReduce:anim_none`
- `probe-scheme` → `ref-div neo-parity__c_ink neo-parity__osDark:c_brand`
- `probe-paper` → `ref-div neo-parity__d_block neo-parity__print:d_none`
- `probe-radius-token` → `ref-div neo-parity__rounded_lg`
- `probe-radius-rhythm` → `ref-div neo-parity__rounded_1r`
- `probe-anim` → `ref-div neo-parity__anim_fade.quick`
- `dark-override` → `ref-div neo-parity__c_ink neo-parity__dark:c_accent`
- `parity-portal` → (no class)
- `p1` → `ref-div neo-parity__c_ink`

## NEO-PARITY-04 — `parity/NEO-PARITY-04`

- `root` → (no class)
- `comp-button` → `ref-button`
- `comp-button-base` → `ref-button`
- `comp-field` → `ref-div`
- `comp-field-input` → `ref-input neo-parity__c_ink`
- `comp-file` → `ref-input neo-parity__c_ink ref-file`
- `probe-range` → `ref-input ref-range`
- `comp-disc` → `ref-details ref-disclosure`
- `comp-disc-summary` → `ref-summary`
- `comp-table` → `ref-table ref-table`
- `comp-table-head` → `ref-th`
- `comp-table-cell` → `ref-td neo-parity__c_ink`
- `comp-link` → `ref-a neo-parity__hover:c_ink ref-link`
- `comp-quote` → `ref-q ref-q`
- `comp-list` → `ref-ul ref-list`
- `recipe-card-raised` → `ref-div neo-parity__card__base neo-parity__card_e_true`
- `recipe-card-flat` → `ref-div neo-parity__card__base neo-parity__card_e_false`
- `recipe-chip-combo` → `ref-div neo-parity__chip__base neo-parity__chip_t_loud neo-parity__chip_s_lg neo-parity__chip_c_loud_lg`
- `recipe-chip-plain` → `ref-div neo-parity__chip__base neo-parity__chip_t_quiet neo-parity__chip_s_sm`
- `region` → `ref-div neo-parity__cq-t_inline-size neo-parity__cq-n_sidebar`
- `p13-first` → `ref-div neo-parity__item__base neo-parity__item_s_sm md:neo-parity__item_s_lg`
- `p13-second` → `ref-div neo-parity__item__base neo-parity__item_s_sm md:neo-parity__item_s_lg`
- `f32` → `ref-div neo-parity__w_50px neo-parity__sm:w_60px`
- `narrow` → `ref-div neo-parity__cq-t_inline-size`
- `p13-narrow-first` → `ref-div neo-parity__item__base neo-parity__item_s_sm md:neo-parity__item_s_lg`
- `p2-first` → `ref-div neo-parity__[&_+_&]:ml_8px`
- `p2-second` → `ref-div neo-parity__[&_+_&]:ml_8px`
- `p6` → (no class)
- `p9` → `ref-div neo-parity__vh__base`
- `p11-open` → `ref-div neo-parity__[&[data-state="open"]:hover]:c_brand`
- `p11-closed` → `ref-div neo-parity__[&[data-state="open"]:hover]:c_brand`
- `p12` → `ref-div neo-parity__d_flex neo-parity__ov_hidden neo-parity__tracking_-0.01em neo-parity__fs_16px`
- `probe-font` → `ref-div neo-parity__font-family_sans neo-parity__font-weight_700`
- `p17` → `ref-div neo-parity__bg-c_brand/40`
- `p18` → `ref-div neo-parity__-webkit-box-orient_vertical`
- `f1` → `ref-div neo-parity__bg_red/abc`
- `probe-negative` → `ref-div neo-parity__mt_-sm`
- `probe-calc` → `ref-div neo-parity__fs_3.5r`
- `probe-bang` → `ref-div neo-parity__px_sm neo-parity__c_brand!`
- `probe-group` → `ref-div neo-parity__c_ink neo-parity__groupHover:c_brand`
- `probe-peer` → `ref-div neo-parity__c_ink neo-parity__peerFocus:c_brand`
- `probe-motion` → `ref-div neo-parity__anim_fade.quick neo-parity__motionReduce:anim_none`
- `probe-scheme` → `ref-div neo-parity__c_ink neo-parity__osDark:c_brand`
- `probe-paper` → `ref-div neo-parity__d_block neo-parity__print:d_none`
- `probe-radius-token` → `ref-div neo-parity__rounded_lg`
- `probe-radius-rhythm` → `ref-div neo-parity__rounded_1r`
- `probe-anim` → `ref-div neo-parity__anim_fade.quick`
- `dark-override` → `ref-div neo-parity__c_ink neo-parity__dark:c_accent`
- `parity-portal` → (no class)
- `p1` → `ref-div neo-parity__c_ink`

## NEO-PLAY-B-01 — `harness/NEO-PLAY-B-01`

- `target` → `mid`
- `swatch` → (no class)

## NEO-PRIM-01 — `prim/NEO-PRIM-01`

- `root` → (no class)
- `prim` → `ref-div neo-prim__c_brand neo-prim__p_sm`

## NEO-PRIM-02 — `prim/NEO-PRIM-02`

- `root` → (no class)
- `both` → `ref-div neo-prim2__c_ink neo-prim2__p_sm neo-prim2__bg-c_brand`
- `conflict` → `ref-div neo-prim2__c_brand`

## NEO-PRIM-03 — `prim/NEO-PRIM-03`

- `root` → (no class)
- `live` → `ref-div neo-prim3__c_ink neo-prim3__hover:c_brand`
- `twin` → `ref-div neo-prim3__hover:c_brand`

## NEO-PRIM-04 — `prim/NEO-PRIM-04`

- `root` → (no class)
- `narrow` → (no class)
- `narrow-probe` → `ref-div neo-prim4__p_1r neo-prim4__sm:p_2r`
- `wide` → (no class)
- `wide-probe` → `ref-div neo-prim4__p_1r neo-prim4__sm:p_2r`
- `live` → (no class)
- `live-probe` → `ref-div neo-prim4__p_1r neo-prim4__sm:p_2r`
- `hole-sm` → (no class)
- `hole-sm-probe` → `ref-div neo-prim4__p_1r neo-prim4__md:p_4r`
- `hole-md` → (no class)
- `hole-md-probe` → `ref-div neo-prim4__p_1r neo-prim4__md:p_4r`

## NEO-PRIM-05 — `prim/NEO-PRIM-05`

- `root` → (no class)
- `outer` → `ref-div`
- `middle` → `ref-div`
- `inner-host` → (no class)
- `inner` → `ref-div neo-prim5__c_brand`

## NEO-PRIM-06 — `prim/NEO-PRIM-06`

- `root` → (no class)
- `plain` → `ref-div`
- `accent` → `ref-div`
- `dark` → `ref-div`

## NEO-PRIM-07 — `prim/NEO-PRIM-07`

- `root` → (no class)
- `surface` → `ref-div`
- `ink-light` → `ref-div neo-prim7__c_ink`
- `brand-light` → `ref-div neo-prim7__c_brand neo-prim7__dark:c_paper`
- `dark-island` → `ref-div`
- `ink-dark` → `ref-div neo-prim7__c_ink`
- `brand-dark` → `ref-div neo-prim7__c_brand neo-prim7__dark:c_paper`
- `light-island` → `ref-div`
- `ink-nested` → `ref-div neo-prim7__c_ink`
- `brand-nested` → `ref-div neo-prim7__c_brand neo-prim7__dark:c_paper`

## NEO-PRIM-08 — `prim/NEO-PRIM-08`

- `root` → (no class)
- `dom` → `ref-div neo-prim8__c_brand neo-prim8__p_sm`
- `clicks` → (no class)
- `no-poly` → `ref-div`

## NEO-PRIM-09 — `prim/NEO-PRIM-09`

- `root` → (no class)
- `census-root` → (no class)
- `tag-a` → `ref-a`
- `tag-abbr` → `ref-abbr`
- `tag-address` → `ref-address`
- `tag-area` → `ref-area`
- `tag-article` → `ref-article`
- `tag-aside` → `ref-aside`
- `tag-audio` → `ref-audio`
- `tag-b` → `ref-b`
- `tag-bdi` → `ref-bdi`
- `tag-bdo` → `ref-bdo`
- `tag-blockquote` → `ref-blockquote`
- `tag-br` → `ref-br`
- `tag-button` → `ref-button`
- `tag-canvas` → `ref-canvas`
- `tag-caption` → `ref-caption`
- `tag-cite` → `ref-cite`
- `tag-code` → `ref-code`
- `tag-col` → `ref-col`
- `tag-colgroup` → `ref-colgroup`
- `tag-data` → `ref-data`
- `tag-datalist` → `ref-datalist`
- `tag-dd` → `ref-dd`
- `tag-del` → `ref-del`
- `tag-details` → `ref-details`
- `tag-dfn` → `ref-dfn`
- `tag-dialog` → `ref-dialog`
- `tag-div` → `ref-div`
- `tag-dl` → `ref-dl`
- `tag-dt` → `ref-dt`
- `tag-em` → `ref-em`
- `tag-embed` → `ref-embed`
- `tag-fieldset` → `ref-fieldset`
- `tag-figcaption` → `ref-figcaption`
- `tag-figure` → `ref-figure`
- `tag-footer` → `ref-footer`
- `tag-form` → `ref-form`
- `tag-h1` → `ref-h1`
- `tag-h2` → `ref-h2`
- `tag-h3` → `ref-h3`
- `tag-h4` → `ref-h4`
- `tag-h5` → `ref-h5`
- `tag-h6` → `ref-h6`
- `tag-header` → `ref-header`
- `tag-hgroup` → `ref-hgroup`
- `tag-hr` → `ref-hr`
- `tag-i` → `ref-i`
- `tag-iframe` → `ref-iframe`
- `tag-img` → `ref-img`
- `tag-input` → `ref-input`
- `tag-ins` → `ref-ins`
- `tag-kbd` → `ref-kbd`
- `tag-label` → `ref-label`
- `tag-legend` → `ref-legend`
- `tag-li` → `ref-li`
- `tag-main` → `ref-main`
- `tag-map` → `ref-map`
- `tag-mark` → `ref-mark`
- `tag-menu` → `ref-menu`
- `tag-meter` → `ref-meter`
- `tag-nav` → `ref-nav`
- `tag-object` → `ref-object`
- `tag-ol` → `ref-ol`
- `tag-optgroup` → `ref-optgroup`
- `tag-option` → `ref-option`
- `tag-output` → `ref-output`
- `tag-p` → `ref-p`
- `tag-picture` → `ref-picture`
- `tag-pre` → `ref-pre`
- `tag-progress` → `ref-progress`
- `tag-q` → `ref-q`
- `tag-rp` → `ref-rp`
- `tag-rt` → `ref-rt`
- `tag-ruby` → `ref-ruby`
- `tag-s` → `ref-s`
- `tag-samp` → `ref-samp`
- `tag-search` → `ref-search`
- `tag-section` → `ref-section`
- `tag-select` → `ref-select`
- `tag-small` → `ref-small`
- `tag-source` → `ref-source`
- `tag-span` → `ref-span`
- `tag-strong` → `ref-strong`
- `tag-sub` → `ref-sub`
- `tag-summary` → `ref-summary`
- `tag-sup` → `ref-sup`
- `tag-svg` → `ref-svg`
- `tag-table` → `ref-table`
- `tag-tbody` → `ref-tbody`
- `tag-td` → `ref-td`
- `tag-textarea` → `ref-textarea`
- `tag-tfoot` → `ref-tfoot`
- `tag-th` → `ref-th`
- `tag-thead` → `ref-thead`
- `tag-time` → `ref-time`
- `tag-tr` → `ref-tr`
- `tag-track` → `ref-track`
- `tag-u` → `ref-u`
- `tag-ul` → `ref-ul`
- `tag-var` → `ref-var`
- `tag-video` → `ref-video`
- `tag-wbr` → `ref-wbr`

## NEO-PRIM-10 — `prim/NEO-PRIM-10`

- `root` → (no class)
- `surface-root` → `ref-div neo-prim10__c_brand neo-prim10__p_sm`

## NEO-PRIM-11 — `prim/NEO-PRIM-11`

- `root` → (no class)
- `array` → `ref-div neo-prim11__c_blue.300 neo-prim11__bg-c_green.300`

## NEO-PRIM-12 — `prim/NEO-PRIM-12`

- `root` → (no class)
- `prim` → `ref-div neo-prim__c_brand neo-prim__p_sm`

## NEO-RECIPE-01 — `recipe/NEO-RECIPE-01`

- `accent` → `neo-recipe__button__base neo-recipe__button_t_accent neo-recipe__button_s_sm`
- `combo` → `neo-recipe__button__base neo-recipe__button_t_accent neo-recipe__button_s_lg neo-recipe__button_c_accent_lg`
- `muted` → `neo-recipe__button__base neo-recipe__button_t_muted neo-recipe__button_s_sm`
- `defaults` → `neo-recipe__button__base neo-recipe__button_t_muted neo-recipe__button_s_sm`

## NEO-RECIPE-02 — `recipe/NEO-RECIPE-02`

- `defaulted` → `neo-recipe__card__base neo-recipe__card_s_lg neo-recipe__card_t_muted`
- `partial` → `neo-recipe__card__base neo-recipe__card_s_lg neo-recipe__card_t_accent`
- `explicit` → `neo-recipe__card__base neo-recipe__card_s_sm neo-recipe__card_t_accent`

## NEO-RECIPE-03 — `recipe/NEO-RECIPE-03`

- `on` → `neo-recipe__toggle__base neo-recipe__toggle_a_true`
- `off` → `neo-recipe__toggle__base neo-recipe__toggle_a_false`
- `defaulted` → `neo-recipe__toggle__base neo-recipe__toggle_a_false`

## NEO-RECIPE-04 — `recipe/NEO-RECIPE-04`

- `combo` → `neo-recipe__banner__base neo-recipe__banner_t_accent neo-recipe__banner_s_lg neo-recipe__banner_c_accent_lg`
- `accentonly` → `neo-recipe__banner__base neo-recipe__banner_t_accent neo-recipe__banner_s_sm`
- `lgonly` → `neo-recipe__banner__base neo-recipe__banner_t_muted neo-recipe__banner_s_lg`
- `hovertwin` → `neo-recipe__banner__base neo-recipe__banner_t_accent neo-recipe__banner_s_lg neo-recipe__banner_c_accent_lg`
- `comboindark` → `neo-recipe__banner__base neo-recipe__banner_t_accent neo-recipe__banner_s_lg neo-recipe__banner_c_accent_lg`
- `partialindark` → `neo-recipe__banner__base neo-recipe__banner_t_accent neo-recipe__banner_s_sm`

## NEO-RECIPE-05 — `recipe/NEO-RECIPE-05`

- `classed` → `neo-recipe__panel__base neo-recipe__panel_t_accent neo-recipe__panel_s_lg neo-recipe__panel_c_accent_lg`
- `rawfed` → `neo-recipe__c_brand neo-recipe__p_lg neo-recipe__bg-c_ink`
- `classeddefault` → `neo-recipe__panel__base neo-recipe__panel_t_muted neo-recipe__panel_s_sm`
- `rawfeddefault` → `neo-recipe__c_paper neo-recipe__p_sm`

## NEO-RECIPE-06 — `recipe/NEO-RECIPE-06`

- `sm` → `neo-recipe__badge__base neo-recipe__badge_s_sm`
- `lg` → `neo-recipe__badge__base neo-recipe__badge_s_lg`
- `defaults` → `neo-recipe__badge__base neo-recipe__badge_s_sm`

## NEO-RECIPE-07 — `recipe/NEO-RECIPE-07`

- `probe` → (no class)

## NEO-RECIPE-08 — `recipe/NEO-RECIPE-08`

- `narrow` → (no class)
- `narrow-probe` → `neo-recipe__swatch__base neo-recipe__swatch_v_solid md:neo-recipe__swatch_v_outline`
- `wide` → (no class)
- `wide-probe` → `neo-recipe__swatch__base neo-recipe__swatch_v_solid md:neo-recipe__swatch_v_outline`
- `live` → (no class)
- `live-probe` → `neo-recipe__swatch__base neo-recipe__swatch_v_solid md:neo-recipe__swatch_v_outline`

## NEO-RECIPE-09 — `recipe/NEO-RECIPE-09`

- `loud` → `neo-recipe__chip__base neo-recipe__chip_t_loud`
- `quiet` → `neo-recipe__chip__base neo-recipe__chip_t_quiet`
- `hovertwin` → `neo-recipe__chip__base neo-recipe__chip_t_loud`

## NEO-RECIPE-10 — `recipe/NEO-RECIPE-10`

- `mixed` → `neo-recipe__flag__base neo-recipe__flag_t_accent neo-recipe__c_paper`
- `recipeonly` → `neo-recipe__flag__base neo-recipe__flag_t_accent`

## NEO-RECIPE-11 — `recipe/NEO-RECIPE-11`

- `loud` → `neo-recipe__chip__base neo-recipe__chip_t_loud`
- `quiet` → `neo-recipe__chip__base neo-recipe__chip_t_quiet`

## NEO-RESP-01 — `resp/NEO-RESP-01`

- `narrow` → (no class)
- `narrow-probe` → `neo-resp1__w_50px neo-resp1__sm:w_60px`
- `wide` → (no class)
- `wide-probe` → `neo-resp1__w_50px neo-resp1__sm:w_60px`
- `live` → (no class)
- `live-probe` → `neo-resp1__w_50px neo-resp1__sm:w_60px`

## NEO-RESP-02 — `resp/NEO-RESP-02`

- `narrow` → (no class)
- `narrow-probe` → `neo-resp2__w_50px neo-resp2__md:w_60px`
- `mid` → (no class)
- `mid-probe` → `neo-resp2__w_50px neo-resp2__md:w_60px`
- `wide` → (no class)
- `wide-probe` → `neo-resp2__w_50px neo-resp2__md:w_60px`
- `live` → (no class)
- `live-probe` → `neo-resp2__w_50px neo-resp2__md:w_60px`

## NEO-RESP-03 — `resp/NEO-RESP-03`

- `narrow` → (no class)
- `probe-narrow` → `neo-resp3__w_50px neo-resp3__md:w_60px`
- `wide` → (no class)
- `probe-wide` → `neo-resp3__w_50px neo-resp3__md:w_60px`

## NEO-RESP-04 — `resp/NEO-RESP-04`

- `narrow` → (no class)
- `narrow-probe` → `neo-resp4__w_50px neo-resp4__sm:md:w_60px`
- `mid` → (no class)
- `mid-probe` → `neo-resp4__w_50px neo-resp4__sm:md:w_60px`
- `wide` → (no class)
- `wide-probe` → `neo-resp4__w_50px neo-resp4__sm:md:w_60px`
- `live` → (no class)
- `live-probe` → `neo-resp4__w_50px neo-resp4__sm:md:w_60px`

## NEO-RESP-05 — `resp/NEO-RESP-05`

- `down767` → (no class)
- `down767-probe` → `neo-resp5__w_50px neo-resp5__mdDown:w_60px`
- `down768` → (no class)
- `down768-probe` → `neo-resp5__w_50px neo-resp5__mdDown:w_60px`
- `only767` → (no class)
- `only767-probe` → `neo-resp5__w_50px neo-resp5__mdOnly:w_70px`
- `only768` → (no class)
- `only768-probe` → `neo-resp5__w_50px neo-resp5__mdOnly:w_70px`
- `only1023` → (no class)
- `only1023-probe` → `neo-resp5__w_50px neo-resp5__mdOnly:w_70px`
- `only1024` → (no class)
- `only1024-probe` → `neo-resp5__w_50px neo-resp5__mdOnly:w_70px`
- `range639` → (no class)
- `range639-probe` → `neo-resp5__w_50px neo-resp5__smToLg:w_80px`
- `range640` → (no class)
- `range640-probe` → `neo-resp5__w_50px neo-resp5__smToLg:w_80px`
- `range1023` → (no class)
- `range1023-probe` → `neo-resp5__w_50px neo-resp5__smToLg:w_80px`
- `range1024` → (no class)
- `range1024-probe` → `neo-resp5__w_50px neo-resp5__smToLg:w_80px`
- `live` → (no class)
- `live-probe` → `neo-resp5__w_50px neo-resp5__mdOnly:w_70px`

## NEO-RESP-06 — `resp/NEO-RESP-06`

- `c500` → (no class)
- `c500-probe` → `neo-resp6__w_50px neo-resp6__sm:w_60px neo-resp6__md:w_70px neo-resp6__lg:w_80px neo-resp6__xl:w_90px neo-resp6__2xl:w_100px neo-resp6__lgDown:w_110px neo-resp6__mdDown:w_120px neo-resp6__smDown:w_130px`
- `c700` → (no class)
- `c700-probe` → `neo-resp6__w_50px neo-resp6__sm:w_60px neo-resp6__md:w_70px neo-resp6__lg:w_80px neo-resp6__xl:w_90px neo-resp6__2xl:w_100px neo-resp6__lgDown:w_110px neo-resp6__mdDown:w_120px neo-resp6__smDown:w_130px`
- `c800` → (no class)
- `c800-probe` → `neo-resp6__w_50px neo-resp6__sm:w_60px neo-resp6__md:w_70px neo-resp6__lg:w_80px neo-resp6__xl:w_90px neo-resp6__2xl:w_100px neo-resp6__lgDown:w_110px neo-resp6__mdDown:w_120px neo-resp6__smDown:w_130px`
- `c1100` → (no class)
- `c1100-probe` → `neo-resp6__w_50px neo-resp6__sm:w_60px neo-resp6__md:w_70px neo-resp6__lg:w_80px neo-resp6__xl:w_90px neo-resp6__2xl:w_100px neo-resp6__lgDown:w_110px neo-resp6__mdDown:w_120px neo-resp6__smDown:w_130px`
- `c1400` → (no class)
- `c1400-probe` → `neo-resp6__w_50px neo-resp6__sm:w_60px neo-resp6__md:w_70px neo-resp6__lg:w_80px neo-resp6__xl:w_90px neo-resp6__2xl:w_100px neo-resp6__lgDown:w_110px neo-resp6__mdDown:w_120px neo-resp6__smDown:w_130px`
- `c1600` → (no class)
- `c1600-probe` → `neo-resp6__w_50px neo-resp6__sm:w_60px neo-resp6__md:w_70px neo-resp6__lg:w_80px neo-resp6__xl:w_90px neo-resp6__2xl:w_100px neo-resp6__lgDown:w_110px neo-resp6__mdDown:w_120px neo-resp6__smDown:w_130px`
- `live` → (no class)
- `live-probe` → `neo-resp6__w_50px neo-resp6__sm:w_60px neo-resp6__md:w_70px neo-resp6__lg:w_80px neo-resp6__xl:w_90px neo-resp6__2xl:w_100px neo-resp6__lgDown:w_110px neo-resp6__mdDown:w_120px neo-resp6__smDown:w_130px`

## NEO-RESP-07 — `resp/NEO-RESP-07`

- `rooted` → `neo-resp7__cq-t_inline-size`
- `rooted-probe` → `neo-resp7__w_50px neo-resp7__sm:w_60px`
- `unrooted` → (no class)
- `unrooted-probe` → `neo-resp7__w_50px neo-resp7__sm:w_60px`

## NEO-RESP-08 — `resp/NEO-RESP-08`

- `narrow` → (no class)
- `narrow-probe` → `neo-resp8__w_50px neo-resp8__[@container_(min-width:_300px)]:w_60px`
- `wide` → (no class)
- `wide-probe` → `neo-resp8__w_50px neo-resp8__[@container_(min-width:_300px)]:w_60px`
- `live` → (no class)
- `live-probe` → `neo-resp8__w_50px neo-resp8__[@container_(min-width:_300px)]:w_60px`

## NEO-RESP-09 — `resp/NEO-RESP-09`

- `narrow` → (no class)
- `narrow-probe` → `neo-resp9__w_50px neo-resp9__sm:w_60px`
- `wide` → (no class)
- `wide-probe` → `neo-resp9__w_50px neo-resp9__sm:w_60px`
- `live` → (no class)
- `live-probe` → `neo-resp9__w_50px neo-resp9__sm:w_60px`

## NEO-SITE-01 — `site/NEO-SITE-01`

- `target` → `neo-site-01__c_cherry`

## NEO-SITE-02 — `site/NEO-SITE-02`

- `target` → `neo-site-02__c_cherry`

## NEO-SITE-03 — `site/NEO-SITE-03`

- `target` → `neo-site-03__c_cherry neo-site-03__mt_gap`

## NEO-SITE-04 — `site/NEO-SITE-04`

- `aliased` → `neo-site-04__c_cherry`
- `namespaced` → `neo-site-04__c_ocean`

## NEO-SITE-05 — `site/NEO-SITE-05`

- `target` → `color`

## NEO-SITE-06 — `site/NEO-SITE-06`

- `target` → `neo-site-06__bg_ocean`

## NEO-SITE-07 — `site/NEO-SITE-07`

- `target` → `neo-site-07__c_cherry`

## NEO-SITE-08 — `site/NEO-SITE-08`

- `target` → `neo-site-08__c_red neo-site-08__m_10px`

## NEO-SITE-09 — `site/NEO-SITE-09`

- `target` → `neo-site-09__w_50px neo-site-09__[@media_(min-width:_400px)]:w_60px`

## NEO-SITE-10 — `site/NEO-SITE-10`

- `root` → (no class)
- `prop` → `ref-div neo-site-10__mt_8px`
- `call` → `neo-site-10__mt_8px`

## NEO-SITE-11 — `site/NEO-SITE-11`

- `root` → (no class)
- `chart` → `ref-div`

## NEO-SITE-12 — `site/NEO-SITE-12`

- `root` → (no class)
- `random` → (no class)
- `lower` → (no class)
- `control` → `ref-div neo-site-12__mt_8px`

## NEO-SITE-13 — `site/NEO-SITE-13`

- `root` → (no class)
- `probe` → `ref-div neo-site13__bd-w_1px neo-site13__border-style_solid neo-site13__c_ink`
- `control` → `ref-div neo-site13__c_ink`

## NEO-SITE-14 — `site/NEO-SITE-14`

- `probe` → (no class)

## NEO-SITE-15 — `site/NEO-SITE-15`

- `root` → (no class)
- `target` → `ref-div neo-site-15__hover:bg-c_brand`
- `twin` → `ref-div neo-site-15__hover:bg-c_brand`

## NEO-SITE-16 — `site/NEO-SITE-16`

- `root` → (no class)
- `member` → `ref-div neo-site-16__c_brand neo-site-16__p_sm`
- `twin` → `ref-div`

## NEO-SITE-17 — `site/NEO-SITE-17`

- `root` → (no class)
- `divider` → `ref-div neo-site-17__p_md neo-site-17__bd-b-w_1px neo-site-17__bd-b-s_solid neo-site-17__bd-b-c_ink`

## NEO-SITE-18 — `site/NEO-SITE-18`

- `target` → `neo-site-18__p_10px`

## NEO-SITE-19 — `site/NEO-SITE-19`

- `target` → `neo-site-19__m_20px`

## NEO-SITE-20 — `site/NEO-SITE-20`

- `bare` → `neo-site-20__c_cherry`
- `paren` → `neo-site-20__c_tangerine`
- `asconst` → `neo-site-20__c_amber`
- `satisfies` → `neo-site-20__c_forest`
- `nonnull` → `neo-site-20__c_ocean`
- `asserted` → `neo-site-20__c_plum`

## NEO-SITE-21 — `site/NEO-SITE-21`

- `random` → `neo-site-21__m_10px`
- `async` → `neo-site-21__m_20px`
- `pure` → `neo-site-21__c_blue neo-site-21__m_30px`

## NEO-SITE-22 — `site/NEO-SITE-22`

- `target` → `neo-site-22__c_red neo-site-22__m_10px`

## NEO-SITE-23 — `site/NEO-SITE-23`

- `target` → `neo-site-23__c_blue neo-site-23__bg-c_red neo-site-23__m_8px neo-site-23__p_12px`
- `flatbox` → (no class)
- `flat` → `neo-site-23__p_1px neo-site-23__sm:p_2px neo-site-23__md:p_3px neo-site-23__lg:p_4px`
- `merge` → `neo-site-23__c_pink`
- `refused` → `neo-site-23__m_6px`

## NEO-SITE-24 — `site/NEO-SITE-24`

- `sibling` → `neo-site-24__c_ocean`
- `logical` → `neo-site-24__c_plum`
- `spread` → `neo-site-24__c_cherry`
- `tagged` → (no class)

## NEO-SITE-25 — `site/NEO-SITE-25`

- `arith` → `neo-site-25__order_5 neo-site-25__z_8 neo-site-25__w_1px neo-site-25__m_4px`
- `logic` → `neo-site-25__c_red neo-site-25__bg-c_blue`
- `nullish` → `neo-site-25__c_teal neo-site-25__bg-c_red`
- `compare` → `neo-site-25__c_white neo-site-25__bg-c_red neo-site-25__p_1px`
- `member` → `neo-site-25__c_#f00 neo-site-25__bg-c_purple neo-site-25__order_2`
- `refused` → `neo-site-25__m_6px`

## NEO-SITE-26 — `site/NEO-SITE-26`

- `folded` → `neo-site-26__c_cherry`
- `sized` → `neo-site-26__w_4px`
- `fan` → `neo-site-26__c_plum`
- `refused` → `neo-site-26__bg-c_ocean`

## NEO-SITE-27 — `site/NEO-SITE-27`

- `shadow` → (no class)
- `twin` → `neo-site-27__c_ocean`

## NEO-SITE-28 — `site/NEO-SITE-28`

- `live` → `neo-site-28__c_cherry`
- `link` → `neo-site-28__c_ocean`
- `miss` → (no class)

## NEO-SITE-29 — `site/NEO-SITE-29`

- `live` → `neo-site-29__c_red neo-site-29__p_4px`
- `plain` → (no class)

## NEO-SITE-30 — `site/NEO-SITE-30`

- `root` → (no class)
- `tab-selected` → `ref-div neo-site-30__bd-b-w_3px neo-site-30__bd-b-s_solid neo-site-30__bd-b-c_ring`
- `tab-plain` → `ref-div neo-site-30__bd-b-w_3px neo-site-30__bd-b-s_solid neo-site-30__bd-b-c_transparent`

## NEO-SMOKE-01 — `harness/NEO-SMOKE-01`

- `dot` → (no class)

## NEO-SNAP-A-01 — `harness/NEO-SNAP-A-01`

- `dot` → (no class)
- `chip` → (no class)
- `winner` → `loser`

## NEO-STATIC-01 — `static/NEO-STATIC-01`

- `base` → `neo-static-01__c_ember`
- `twin` → `neo-static-01__hover:c_gold`

## NEO-STATIC-02 — `static/NEO-STATIC-02`

- `control` → `neo-static-02__c_n100`
- `dyn` → `neo-static-02__c_n200`
- `dyn2` → `neo-static-02__c_n300`

## NEO-STATIC-03 — `static/NEO-STATIC-03`

- `hit` → `neo-static-03__c_ember`
- `miss` → (no class)

## NEO-SYNC-01 — `sync/NEO-SYNC-01`

- `probe` → (no class)

## NEO-SYNC-02 — `sync/NEO-SYNC-02`

- `probe` → (no class)

## NEO-SYNC-03 — `sync/NEO-SYNC-03`

- `probe` → (no class)

## NEO-SYNC-04 — `sync/NEO-SYNC-04`

- `probe` → (no class)

## NEO-SYNC-05 — `sync/NEO-SYNC-05`

- `probe` → (no class)

## NEO-SYNC-06 — `sync/NEO-SYNC-06`

- `probe` → `neo-sync6__c_brand`

## NEO-SYNC-07 — `sync/NEO-SYNC-07`

- `probe` → (no class)

## NEO-SYNC-08 — `sync/NEO-SYNC-08`

- `probe` → (no class)

## NEO-SYNC-09 — `sync/NEO-SYNC-09`

- `probe` → (no class)

## NEO-SYNC-10 — `sync/NEO-SYNC-10`

- `up-probe` → `neo-sync10__c_up`
- `shared-probe` → `neo-sync10__c_shared`
- `card-probe` → `neo-sync10__card__base`

## NEO-SYNC-11 — `sync/NEO-SYNC-11`

- `probe` → (no class)

## NEO-SYNC-12 — `sync/NEO-SYNC-12`

- `probe` → (no class)

## NEO-SYNC-13 — `sync/NEO-SYNC-13`

- `probe` → (no class)

## NEO-SYNC-14 — `sync/NEO-SYNC-14`

- `probe` → (no class)

## NEO-SYNC-15 — `sync/NEO-SYNC-15`

- `root` → (no class)
- `card` → `ref-div neo-sync15__p_1r`
- `random` → (no class)
- `label` → (no class)

## NEO-SYNC-16 — `sync/NEO-SYNC-16`

- `probe` → (no class)

## NEO-SYNC-17 — `sync/NEO-SYNC-17`

- `up-probe` → `neo-sync17__c_up`
- `own-probe` → `neo-sync17__c__private.ownSecret`

## NEO-TOKEN-01 — `token/NEO-TOKEN-01`

- `probe` → `neo-token1__bd-w_2px neo-token1__border-style_solid neo-token1__bd-c_{colors.red.500}`
- `border-ref` → (no class)

## NEO-TOKEN-02 — `token/NEO-TOKEN-02`

- `probe` → (no class)

## NEO-TOKEN-03 — `token/NEO-TOKEN-03`

- `probe` → `neo-token3__bg-c_red.500/40`
- `mix-ref` → (no class)
- `passthrough` → `neo-token3__bg-c_rgb(251_146_60_/_0.3)`
- `pass-ref` → (no class)

## NEO-TOKEN-04 — `token/NEO-TOKEN-04`

- `probe` → `neo-token4__shadow_0_0_0_3px_{colors.pink.400/30}`
- `shadow-ref` → (no class)

## NEO-TOKEN-05 — `token/NEO-TOKEN-05`

- `top` → `neo-token5__c_brand`
- `island` → (no class)
- `nested` → `neo-token5__c_brand`

## NEO-TOKEN-06 — `token/NEO-TOKEN-06`

- `probe` → `neo-token6__bg-c_critical`
- `direct` → `neo-token6__bg-c_red.500`

## NEO-TOKEN-07 — `token/NEO-TOKEN-07`

- `named` → `neo-token7__p_0.5`
- `decimal` → `neo-token7__p_0.5r`
- `fraction` → `neo-token7__p_1/2r`
- `named-ref` → (no class)
- `rhythm-ref` → (no class)

## NEO-TOKEN-08 — `token/NEO-TOKEN-08`

- `token-neg` → `neo-token8__mt_-sm`
- `rhythm-neg` → `neo-token8__mt_-1r`
- `scaled-neg` → `neo-token8__mt_-4r`
- `token-ref` → (no class)
- `rhythm-ref` → (no class)
- `scaled-ref` → (no class)

## NEO-TOKEN-09 — `token/NEO-TOKEN-09`

- `probe` → `neo-token9__c__private.secret`
- `ref-probe` → `neo-token9__bg-c_{colors._private.secret}`
- `color-ref` → (no class)
- `bg-ref` → (no class)

## NEO-TOKEN-10 — `sync/NEO-TOKEN-10`

- `font` → `neo-token10__font-family_sans neo-token10__font-weight_400`

## NEO-TOKEN-11 — `token/NEO-TOKEN-11`

- `probe` → `neo-token11__anim_fade.quick`
- `anim-ref` → (no class)

## NEO-TOKEN-12 — `token/NEO-TOKEN-12`

- `probe` → `neo-token12__pt_{spacing.1r} neo-token12__pr_{spacing.2r} neo-token12__pb_{spacing.1r} neo-token12__pl_{spacing.2r}`
- `padding-ref` → (no class)

## NEO-TOKEN-13 — `token/NEO-TOKEN-13`

- `probe` → `neo-token13__anim_grow.once`

## NEO-TOKEN-14 — `token/NEO-TOKEN-14`

- `token` → `neo-token14__c_ui.progress.track.mixForeground`
- `hardcoded` → `neo-token14__c_var(--colors-ui-progress-track-mix-foreground)`

## NEO-TYPE-01 — `type/NEO-TYPE-01`

- `root` → (no class)
- `type-root` → `ref-div neo-type__c_brand neo-type__p_sm`
- `type-recipe` → `ref-button neo-type__button__base neo-type__button_t_accent neo-type__button_s_sm`
- `type-css` → `neo-type__bg-c_paper neo-type__p_sm neo-type__c_ink`
- `type-copy` → `ref-div neo-type__c_ink`

## NEO-TYPE-02 — `type/NEO-TYPE-02`

- `root` → (no class)
- `type-root` → `ref-div neo-type__c_brand neo-type__p_sm`
- `type-recipe` → `ref-button neo-type__button__base neo-type__button_t_accent neo-type__button_s_sm`
- `type-css` → `neo-type__bg-c_paper neo-type__p_sm neo-type__c_ink`
- `type-copy` → `ref-div neo-type__c_ink`

## NEO-TYPE-03 — `type/NEO-TYPE-03`

- `root` → (no class)
- `type-root` → `ref-div neo-type__c_brand neo-type__p_sm`
- `type-recipe` → `ref-button neo-type__button__base neo-type__button_t_accent neo-type__button_s_sm`
- `type-css` → `neo-type__bg-c_paper neo-type__p_sm neo-type__c_ink`
- `type-copy` → `ref-div neo-type__c_ink`

## NEO-TYPE-04 — `type/NEO-TYPE-04`

- `root` → (no class)
- `type-root` → `ref-div neo-type__c_brand neo-type__p_sm`
- `type-recipe` → `ref-button neo-type__button__base neo-type__button_t_accent neo-type__button_s_sm`
- `type-css` → `neo-type__bg-c_paper neo-type__p_sm neo-type__c_ink`
- `type-copy` → `ref-div neo-type__c_ink`

## NEO-TYPE-05 — `type/NEO-TYPE-05`

- `root` → (no class)
- `type-root` → `ref-div neo-type__c_brand neo-type__p_sm`
- `type-recipe` → `ref-button neo-type__button__base neo-type__button_t_accent neo-type__button_s_sm`
- `type-css` → `neo-type__bg-c_paper neo-type__p_sm neo-type__c_ink`
- `type-copy` → `ref-div neo-type__c_ink`

## NEO-TYPE-06 — `type/NEO-TYPE-06`

- `root` → (no class)
- `type-root` → `ref-div neo-type__c_brand neo-type__p_sm`
- `type-recipe` → `ref-button neo-type__button__base neo-type__button_t_accent neo-type__button_s_sm`
- `type-css` → `neo-type__bg-c_paper neo-type__p_sm neo-type__c_ink`
- `type-copy` → `ref-div neo-type__c_ink`

## NEO-TYPE-07 — `type/NEO-TYPE-07`

- `root` → (no class)
- `type-root` → `ref-div neo-type__c_brand neo-type__p_sm`
- `type-recipe` → `ref-button neo-type__button__base neo-type__button_t_accent neo-type__button_s_sm`
- `type-css` → `neo-type__bg-c_paper neo-type__p_sm neo-type__c_ink`
- `type-copy` → `ref-div neo-type__c_ink`
