# CONSULT.oracle — is a component style-prop value supposed to be backed in the consumer?

Reply with `STATUS: DONE` (or `STATUS: REFUSED`) as your first line.

## Question

A style prop passed to a **published** component with a **static literal value**
at the JSX call site (`<BoltIcon color="diagramRedText" />`) produces a runtime
`css()` class that is **never compiled**, so the prop paints nothing and the dev
probe warns `no compiled class … paints nothing`.

Is this an atomic-engine defect (the static call-site value must be compiled into
the component's own system scope), or the documented contract (consumers must
list such values in `staticCss` / config)? If it is a defect, what is the correct
fix and what test proves it? If it is the contract, does `staticCss` on the
**consumer** config even reach the **component package's** system scope?

## Reproduction (measured in the live docs app, dark mode)

- Source: `packages/reference-docs/src/content/diagrams/specimen-tones.tsx`
  renders `<DeployedCodeIcon size="lg" color="diagramBlueText" />` and the same
  shape for `diagramGreenText`, `diagramAmberText`, `diagramRedText`,
  `diagramVioletText`, plus `color="docsMuted"` on the neutral card.
- Icon implementation: `packages/reference-icons/src/createIcon.tsx:41-68` — the
  icon renders `IconShell` (the `Div` primitive) with `color={color}` as a
  StyleProp, defaulting `color = 'inherit'`. `size` is applied via inline
  `style` (works); `color` goes through `css()` (does not).
- Consumer config: `packages/reference-docs/ui.config.ts` — `name: 'reference-docs'`,
  `extends: [baseSystem]`, `include: ['src/**/*.{ts,tsx,mdx}']`.
- Measured DOM (live): the icon holder carries `reference-icons__c_docsMuted`,
  `reference-icons__c_diagramBlueText`, `…GreenText`, `…AmberText`, `…RedText`,
  `…VioletText`. The docs app's own sheet contains `reference-docs__c_docsMuted`
  and `reference-docs__c_diagram{Blue,Green,Amber}Text` (from docs `css()` call
  sites) but **not** `reference-icons__c_*`; `reference-icons__c_diagramRedText`
  and `…VioletText` are absent everywhere. Every one of the six tone icons
  computes to `oklch(0.1304 0.0243 265.94)` (the inherited panel text colour),
  i.e. no accent paints.
- Console: `[reference-ui] css(): no compiled class for \`color: "docsMuted"\``
  (and `docsText`, `diagramBlueText`, `diagramGreenText`, `diagramAmberText`,
  `diagramRedText`, `diagramVioletText`), site
  `packages/reference-docs/src/components/diagram/DiagramArrow.tsx`.

## What to check (argue from the code, not from this summary)

1. The extractor path for JSX style props on **component** elements vs intrinsic
   elements: does `collect`/`evaluate` see `color="diagramRedText"` on
   `DeployedCodeIcon` and, if so, into which system/scope does it compile it?
   See `packages/reference-neo/src/collect/**`, `packages/reference-rs` extractor.
2. How `reference-icons` becomes a compiled system (`baseSystem`) and whether a
   consumer can extend a compiled package's scope at all.
3. The miss probe contract in `packages/reference-rs/modules/atomic/js/namer/miss.ts`
   and `packages/reference-neo/src/runtime/css/css.ts` — is the warning a true
   positive here (unbacked) or a probe false positive?
4. Whether a static `css({ color: 'diagramRedText' })` **in the icons package**
   (or a consumer `staticCss` entry) backs `reference-icons__c_diagramRedText`.

## Return

Findings in the skill's format (stable ID, severity, file:line, evidence,
recommendation, validation gap), then a verdict (clear / findings / refuse) and
whether the affected slice can merge with gaps deferred. A missing test is a task
recommendation. Do not edit product code.
