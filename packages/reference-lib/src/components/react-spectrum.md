# React Spectrum Deep Dive & Reference UI Gap Analysis

**Analysis Date:** 2026-09-05  
**Surveyed Target:** `vendor/react-spectrum` (`@react-aria`, `@react-stately`, `react-aria-components`, `@internationalized`)  
**Target File Location:** `packages/reference-lib/src/components/react-spectrum.md`  
**Foundational Manifesto:** [`components.md`](./components.md)  
**Manufacturing Orchestration Standard:** [`prompt.md`](./prompt.md)

---

## Executive Summary

React Spectrum (specifically Adobe's `@react-aria`, `@react-stately`, and `react-aria-components` [RAC]) represents the most comprehensive accessibility and behavioral implementation in the React ecosystem. It is already one of Reference UI's primary **reference port sources** (see [`vendor/VENDOR.md`](file:///Users/ryn/Developer/reference-ui/vendor/VENDOR.md)).

Reference UI's component manifesto sets strict constraints:
- **Primitives over monoliths**: Behavior and difficult invariants are centralized; product semantics, visual layout, and styling remain in application code.
- **Deterministic host elements & zero polymorphism**: Statically-typed native HTML primitives without `as` props or wrapper `<div>` soup.
- **Zustand internal substrate, zero public providers**: Applications never wrap trees in `<Provider>` or `*.Provider`.
- **Strict 4-point admission criteria for any new primitive**:
  1. The web platform does not already own the behavior;
  2. No current primitive can own it without mixing unrelated state machines;
  3. Composition would force applications to recreate a difficult invariant; and
  4. At least three materially different products need the same public contract.

### The Central Question: Is there anything inside React Spectrum that fits our manifesto which we don't yet currently have?

**Yes.** While Reference UI's 24-component freeze covers standard ARIA widgets (Listbox, Combobox, Menu, Tabs, Tree, Slider, Switch, NumberField, DateField, Calendar, etc.), a deep survey of `vendor/react-spectrum` reveals **3 critical accessibility and collection capabilities** that strictly satisfy the manifesto's admission criteria and solve difficult invariants:

1. **Document Landmark Navigation Engine (`@react-aria/landmark`)**: Sighted and non-screen-reader keyboard users have no native browser mechanism to jump between landmarks (`<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`). React Aria’s `LandmarkManager` coordinates `F6`/`Shift+F6` traversal, automatic document ordering, duplicate-label linting, and live-region announcements. This belongs directly in `ReferenceLibrary` alongside `announce()` and the Toast queue.
2. **Interactive Composite List / GridList (`GridList` / APG Composite List)**: APG `role="listbox"` strictly forbids focusable descendant controls (delete buttons, checkboxes, action menus). Building an inbox or file list where each item has inner actions requires `role="grid"` or APG composite roving focus with row-vs-cell action mode switching. We can steal this behavior.
3. **Collections API Substrate (`Collections`)**: Normalizing static JSX children and dynamic collections across `Listbox`, `Menu`, `Tabs`, `Tree`, and `GridList`. Rather than adopting React Spectrum's monolithic `CollectionBuilder` and heavy React Context trees, Reference UI will integrate a **custom hand-rolled Collections engine** (ported from our sister design system) designed for zero-provider, AI-native collection normalization.

*(Deliberate Omission Note: `DropZone` and `FileTrigger` are rejected as library primitives: in the agentic era, drop zones and file triggers are trivial one-shot prompts that users **always** want to heavily customize visually and behaviorally. What provides 100x more leverage is maintaining an always-updated, comprehensive set of semantic file-type icons in `@reference-ui/icons`; see Section 3).*

---

## 1. Complete Inventory of React Spectrum

React Spectrum is structured across four primary package namespaces:
- **`@react-aria/*` (54 packages)**: Low-level headless hooks managing accessibility attributes, keyboard navigation, focus, and pointer interactions.
- **`react-aria-components` (70 components)**: Headless compound components using React Context and slot architectures.
- **`@react-stately/*` (32 packages)**: Framework-agnostic state machines and collection data models.
- **`@internationalized/*` (5 packages)**: Date arithmetic, number parsing/formatting, and string interpolation.

### Comprehensive Capability Map

| Functional Category | React Spectrum Artifacts | Reference UI Status | Alignment with Manifesto |
| :--- | :--- | :--- | :--- |
| **Overlays & Modals** | `dialog`, `overlays`, `modal`, `popover` | `Overlay`, `Popover` | **Covered.** Reference UI unifies modal, drawer, sheet, and popover under `Overlay` and `Popover` using Floating UI DOM + Vaul handle/edge. |
| **Notifications** | `toast`, `@react-stately/toast` | `Toast`, `ReferenceLibrary` | **Covered.** Reference UI implements a document-scoped Zustand FIFO queue, pausing on focus/hover, without semantic variant baggage. |
| **Option Collections** | `listbox`, `combobox`, `select`, `autocomplete` | `Listbox`, `Combobox` | **Covered.** Select and Autocomplete are documented compositions of `Combobox` + `Listbox`. |
| **Collections Engine** | `@react-stately/collections`, `@react-aria/collections` | **Planned Addition** | **Strong Fit (Custom Hand-Rolled).** Dedicated lightweight Collections engine (from sister design system) to normalize static/dynamic items across composite widgets without Context overhead. |
| **Menus** | `menu`, `actiongroup` | `Menu` | **Covered.** Submenus, link items, radio/checkbox items, and roving focus. |
| **Tabs & Accordions** | `tabs`, `disclosure`, `disclosure-group` | `Tabs`, `Collapsible`, `Accordion` | **Covered.** Built on `RovingFocus` (Tabs) or independent Tab stops (Accordion). |
| **Sliders & Steppers** | `slider`, `numberfield`, `spinbutton` | `Slider`, `NumberField` | **Covered.** NumberField uses `input[type=text]` with stepper buttons; `SpinButton` is deliberately omitted per APG VoiceOver rules. |
| **Switches & Toggles** | `switch`, `toggle`, `checkbox`, `radio` | `Switch` (Native for Checkbox/Radio) | **Covered.** Checkbox and Radio stay native HTML; Switch provides the sliding thumb host. |
| **Date & Calendar** | `calendar`, `datepicker`, `datefield`, `@internationalized/date` | `Calendar`, `DateField` | **Covered.** DateField fold/unfold recipe; `DateSegment` spinbuttons deliberately omitted in favor of atomic text input. |
| **Trees** | `tree`, `NavigationTree` | `Tree` | **Partially Covered.** Reference UI has APG Tree. NavigationTree adds route syncing and link integration. |
| **Splitters & Panels** | *None* (Spectrum lacks a public splitter) | `Splitter` | **Reference UI Advantage.** Reference UI ships a 1D flex partition with direct DOM write pointer loops. |
| **Visual Chrome** | `form`, `field`, `label`, `group` | `Field` | **Covered.** Reference UI's `Field` is a pure CSS `:has()` bezel, rejecting public context form wiring. |
| **Screen Reader Live Announcer** | `@react-aria/live-announcer` | `announce()` in `ReferenceLibrary` | **Covered.** Direct port into Reference UI's document runtime. |
| **Landmark Navigation** | `@react-aria/landmark`, `useLandmark` | **Missing** | **Strong Fit.** Sighted keyboard navigation across semantic landmarks (`F6`). |
| **Interactive Composite List** | `gridlist`, `table` | **Missing** (DataGrid omitted) | **Strong Fit.** `GridList` (composite interactive list) solves APG violations in Listbox for rows with action buttons. |
| **File Drag & Drop / Trigger** | `dnd`, `DropZone`, `FileTrigger` | **Deliberate Omission** | **Deliberate Omission (Agentic One-Shot).** Drop zones and file triggers are always heavily customized in app code. Hand-rolled via agent in seconds. Pair with maintained File Icons in `@reference-ui/icons`. |
| **2D Continuous Sliders / Colors** | `@react-aria/color`, `ColorArea`, `ColorWheel`, `ColorSlider`, `ColorField` | **Missing** | **Deliberate Omission (Application-Owned).** In the agentic era, bespoke 2D controllers (color pickers, 2D pads) are hand-rolled faster and cleaner with canvas/pointer events than fighting a rigid component library abstraction. Fails Criterion 4. |

---

## 2. Deep Dive: What Reference UI Already Covers (Ported / Lifted)

Reference UI already lifts the most sophisticated algorithmic and test knowledge from React Spectrum while shedding its monolithic abstractions:

### 1. `NumberField` (Intl Parsing & Step Invariants)
- **What was lifted**: `@internationalized/number` (`NumberParser`, `NumberFormatter`), negative zero handling, decimal precision stepping, non-Latin digit normalization (Arabic-Indic, Persian, Devanagari), and currency/percent symbol parsing.
- **Reference UI refinement**: Replaced Spectrum's multi-part hook soup (`useNumberField`, `useSpinButton`, `useNumberFieldState`) and segment spinbuttons with an atomic dual-host textbox (`input[type=text]`) and CSS `:has()` bezel (`NumberField.Group`).

### 2. `Calendar` & `DateField` (Date Math & Grid Topology)
- **What was lifted**: `@internationalized/date` (`weekStartData.ts`, queries, Gregorian constraints, leap year math, 2D arrow navigation across month boundaries).
- **Reference UI refinement**: Spectrum relies heavily on `DateSegment` spinbuttons (`useDateSegment`) and packaged visual products. Reference UI explicitly rejected `DateSegment` spinbuttons (which cause VoiceOver focus failures and keyboard traps) in favor of a fold/unfold atomic text input (`DateField`) and a discriminated mode grid (`Calendar`).

### 3. `Slider` (Multi-Thumb Physics & Constraint Engine)
- **What was lifted**: Multi-thumb collision avoidance, step-lattice snapping, PageUp/PageDown stepping, and touch offset normalization from `@react-aria/slider`.
- **Reference UI refinement**: Built on typed native elements with token-aware `StyleProps`, single-child slot merging, and internal Zustand stores.

### 4. `LiveAnnouncer` (`announce()`)
- **What was lifted**: Screen reader politeness queues (`polite` vs `assertive`), timeout-based announcement recycling, and multi-root DOM mounting.
- **Reference UI refinement**: Announcer is a document-scoped Zustand store mounted under `ReferenceLibrary`, eliminating Spectrum's singleton global DOM mutation.

---

## 3. Deep Dive: What Reference UI Deliberately Omits (and Why)

The manifesto explicitly excludes multiple concepts present in React Spectrum. These are conscious architectural boundaries:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ REACT SPECTRUM PATTERN         │ REFERENCE UI MANIFESTO RATIONALE                      │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Checkbox / RadioGroup          │ Native HTML <input type="checkbox"> and <input         │
│                                │ type="radio"> already own state, keyboard, disabled,  │
│                                │ and form reset. Switch is the sole exception because  │
│                                │ a sliding thumb cannot live in a void input.          │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ ColorArea / Color Primitives   │ Niche creative-tool control. Fails Criterion 4. In    │
│ (2D Continuous Controllers)    │ the agentic era, bespoke 2D canvas/pointer controls   │
│                                │ are hand-rolled faster and cleaner for specific       │
│                                │ coordinate spaces (OKLCH, P3, vector) than wrestling  │
│                                │ with a heavy, rigid component library abstraction.    │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ DropZone / FileTrigger         │ Agentic one-shot promptable. Users ALWAYS want to      │
│                                │ customize drop zones heavily (dashed areas, avatar    │
│                                │ drops, progress bars, image previews). A library      │
│                                │ widget creates friction. Real leverage is providing a │
│                                │ maintained set of File Icons in @reference-ui/icons.  │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ DateSegment Spinbuttons        │ Segment spinbuttons create VoiceOver focus failures,  │
│                                │ confuse screen readers, and force complex sub-segment │
│                                │ navigation. DateField is an atomic text input.        │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Form / Field Context Providers │ Hidden field context and validation providers create   │
│                                │ opaque abstractions. Reference UI uses explicit IDs,  │
│                                │ <label htmlFor>, and CSS :has() for chrome.           │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ ProgressBar / Meter            │ Native <progress> and <meter> HTML elements exist and │
│                                │ work reliably across all assistive technologies.      │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ DataGrid (Spreadsheet Tables)  │ Multi-column virtualized editable grids are an entire │
│                                │ application ecosystem, not a stable headless          │
│                                │ primitive that can be frozen honestly.                │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ TimeField                      │ Time-of-day editing is explicitly outside Calendar    │
│                                │ and DateField. Both are calendar dates (ISO 8601).    │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Polymorphic Providers & Hooks  │ <Provider theme={...}>, <OverlayProvider>, and nested │
│                                │ React Context trees are banned. Internal state uses   │
│                                │ Zustand; native context is used only for child parts. │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Why ColorArea / 2D Continuous Controllers are Deliberately Omitted

React Spectrum ships over 10 packages for color alone (`@react-aria/color`, `@react-stately/color`, `ColorArea`, `ColorWheel`, `ColorSlider`, `ColorField`, `ColorSwatchPicker`, etc.). While impressive, freezing a 2D coordinate/color primitive in Reference UI violates our core manifesto tenets:

1. **The Agentic-Era Reality**: In an AI-assisted development workflow, specialized 2D interactive surfaces (like Photoshop/Figma gradient boxes, OKLCH saturation/lightness pickers, audio pan controllers, or game joystick pads) are trivial to hand-roll. An AI agent can generate a clean, 40-line pointer-event and canvas/SVG hook directly in application code—tailored to the application's exact coordinate system and rendering engine—in seconds. Hand-rolling avoids fighting an external headless library's rigid color-space abstractions and event wrappers.
2. **Fails Admission Criterion 4 ("At least three materially different products need the same public contract")**: 99% of web applications (dashboards, e-commerce, SaaS, documentation, CRUD) never need an embedded 2D continuous coordinate drag surface; they use swatch lists or native `<input type="color">`. The 1% that do (creative design apps, audio DAWs) inevitably hand-roll custom high-performance `<canvas>` or WebGL rendering pipelines anyway.
3. **Monolithic Weight vs Primitive Ethos**: Adobe's color engine forces hundreds of kilobytes of color-space math (RGB, HSL, HSB, Lab, OKLab, gamut clipping) into the dependency tree. Reference UI centralizes general-purpose platform invariants, not creative-suite domain math.

#### Why DropZone & FileTrigger are Deliberately Omitted (and What We Provide Instead)

React Spectrum provides `DropZone` and `FileTrigger` to standardize file drop areas and programmatic file picker triggers. However:

1. **High Visual & Behavioral Customization (Agentic One-Shot)**: Every application has completely different dropzone UX requirements:
   - Fullscreen drag-over backdrop overlays
   - Dashed empty-state upload boxes
   - Inline avatar/profile image drop regions
   - Multi-file preview grids with upload progress bars and cancel buttons
   - Clipboard paste (`Cmd+V` / `Ctrl+V`) directly into message inputs
   In the agentic era, an AI prompt generates `<div onDragOver={...} onDrop={...}>` with custom styles and handlers in 5 seconds. Attempting to freeze a headless `DropZone` compound widget creates API friction because consumers constantly fight its slot contracts.
2. **FileTrigger is a Trivial DOM Pattern**: Triggering a hidden `<input type="file" ref={inputRef} style={{ display: 'none' }} />` via `inputRef.current.click()` is 10 lines of native HTML/React code. Wrapping it in a runtime component adds abstraction without adding capability.
3. **The Better Solution: A Maintained File-Type Icon Suite in `@reference-ui/icons`**:
   What application developers and AI agents *actually* need repeatedly across every file upload and document management workflow is an **always-updated, comprehensive set of semantic file-type icons** (PDF, PNG/JPEG/WEBP image, Video, Audio, ZIP/Archive, Code/TS/JSON, Spreadsheet, Document, Presentation, Binary) with an extension/MIME-type mapping utility. That provides massive recurring value without forcing runtime component overhead.

---

## 4. Deep Dive: What Fits Our Manifesto That We Don't Yet Have

Here are the specific, high-priority accessibility components and subsystems in React Spectrum that **fit Reference UI’s manifesto** and are not currently present in `@reference-ui/lib`.

---

### Candidate 1: Document Landmark Navigation (`Landmark` / `useLandmark`)

#### Problem & Invariant
- Screen readers have dedicated keyboard shortcuts to cycle through landmark regions (`<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`, `<section aria-label="...">`).
- **However, keyboard-only users without screen readers** (users with motor disabilities, repetitive strain injuries, power users, switch devices) have **no native browser shortcut** to navigate between page sections. They are forced to press `Tab` dozens or hundreds of times to bypass headers and navigation sidebars to reach the main content.
- Native skip links (`<a href="#main">Skip to content</a>`) only provide a single jump to `<main>` and do not allow navigating between multiple sidebars, tools, and regions.

#### How React Spectrum Solves It (`@react-aria/landmark`)
- Implements a document-level `LandmarkManager` (attached to `document`).
- Captures global `F6` (forward) and `Shift + F6` (backward) keybindings to cycle focus sequentially across all registered landmarks in DOM order.
- Dynamically sorts landmarks using `compareDocumentPosition`.
- Detects if an element inside the landmark was previously focused and restores focus to `lastFocused`.
- Automatically emits live-region announcements via `LiveAnnouncer` (e.g. `"Navigation, Main Navigation"`, `"Main"`).
- Automatically lints for APG compliance in development: warns if multiple landmarks share the same role without unique `aria-label` or `aria-labelledby` attributes.

#### Why It Fits the Reference UI Manifesto
1. **Platform Gap**: Evergreen browsers do not provide native keyboard navigation across landmark regions for sighted keyboard users.
2. **Cannot be owned by existing primitives**: `FocusLock` contains focus inside a subtree; `RovingFocus` manages focus between items in a single composite widget. Neither owns document-wide region topology.
3. **Difficult Invariant**: Recreating document-order sorting via `compareDocumentPosition`, `lastFocused` caching, `F6` capture, and live-region announcements across multiple microfrontends or portalled shards is exceptionally difficult for applications to write.
4. **Architectural Symmetry**: Reference UI already has typed HTML landmark primitives (`<Main>`, `<Nav>`, `<Header>`, `<Section>`) and a document-scoped runtime mount (`ReferenceLibrary`).

#### Proposed Reference UI Shape
Rather than requiring hooks, landmark registration can be an opt-in behavior on typed HTML primitives or a document capability in `ReferenceLibrary`:

```tsx
// Document-level configuration
<ReferenceLibrary
  landmarkNavigation={{
    shortcut: "F6", // F6 / Shift+F6
    announce: true,
  }}
>
  <Header landmark label="Site Header">...</Header>
  <Nav landmark label="Primary Navigation">...</Nav>
  <Main landmark>...</Main>
  <Aside landmark label="Activity Feed">...</Aside>
</ReferenceLibrary>
```

---

### Candidate 2: Interactive Composite List / GridList (`GridList` / APG Composite List)

#### Problem & Invariant
- **Strict APG Violation in Listbox**: According to W3C ARIA APG, a `Listbox` (`role="listbox"`) and its `Option`s (`role="option"`) **cannot contain interactive focusable children**. Putting a `<button>`, `<a>`, or `<input>` inside an option is invalid ARIA and causes screen readers to ignore or mishandle the interactive child.
- Real-world product lists almost always require interactive child elements:
  - An email list where each row has a checkbox, a star button, an archive button, and an action menu.
  - A file list where each item has a download button and a delete button.
  - A shopping cart list where each row has a stepper and a remove button.
- To make such lists accessible, APG requires **`role="grid"`** (a single-column or multi-column grid) or a composite roving focus list with an **Action Mode / Navigation Mode toggle** (`Enter`/`F2` enters the row to focus child controls; `Escape` exits back to row navigation).

#### How React Spectrum Solves It (`@react-aria/gridlist` / RAC `GridList`)
- Renders `role="grid"` with `role="row"` and `role="gridcell"`.
- Supports selection (single, multiple, select-all via `Cmd+A`).
- Supports keyboard navigation between rows with Up/Down arrows.
- Allows Tab or Right arrow to enter interactive elements inside the row, and Escape to return focus to the row.

#### Why It Fits the Reference UI Manifesto
1. **Solves an Unavoidable APG Constraint**: Reference UI's `Listbox` cannot support interactive child buttons without breaking its ARIA contract.
2. **Not a DataGrid**: Unlike a heavyweight `DataGrid` (which includes column sorting, column resizing, cell editing, and virtualization across two dimensions), `GridList` is a 1-dimensional composite list that merely enables interactive child controls safely.
3. **High Reusability**: Every dashboard, inbox, notification panel, and settings manager needs lists with action buttons. We can steal this behavior directly.

#### Proposed Reference UI Shape
```tsx
<GridList
  value={selectedItems}
  onChange={setSelectedItems}
  selectionMode="multiple"
>
  {items.map((item) => (
    <GridList.Item key={item.id} value={item.id}>
      <GridList.Checkbox />
      <span>{item.name}</span>
      <Button aria-label="Delete item" onClick={() => deleteItem(item.id)}>
        ×
      </Button>
    </GridList.Item>
  ))}
</GridList>
```

---

### Candidate 3: The Collections API Substrate (`Collections` / Custom Hand-Rolled API)

#### Problem & Invariant
Across composite widgets (`Listbox`, `Menu`, `Tabs`, `Tree`, `GridList`), components must handle two distinct authoring modes with identical state machine behavior:
1. **Static declarative JSX children**:
   ```tsx
   <Listbox value={val} onChange={setVal}>
     <Listbox.Option value="1">Profile</Listbox.Option>
     <Listbox.Option value="2">Settings</Listbox.Option>
   </Listbox>
   ```
2. **Dynamic data-driven collections**:
   ```tsx
   <Listbox value={val} onChange={setVal} items={users}>
     {(user) => <Listbox.Option key={user.id} value={user.id}>{user.name}</Listbox.Option>}
   </Listbox>
   ```

Without a centralized Collections engine, each composite component invents its own ad-hoc children-mapping, key-resolution, and disabled-key traversal algorithms. When collections grow large or require virtualization and filtering, ad-hoc solutions suffer from layout thrashing and fragile prop inspection.

#### How React Spectrum Solves It (`@react-stately/collections` & `@react-aria/collections`)
- Uses a virtual node graph (`CollectionBuilder`, `Node`, `Item`, `Section`) and collection hooks.
- While functionally complete, Adobe's implementation is notorious for extreme complexity: deep React Context trees, runtime JSX AST inspection, heavy memoization layers, and proprietary `Collection` interfaces that make prompt engineering and AI code generation less reliable.

#### The Reference UI Solution: Porting Our Custom Hand-Rolled Collections API
Rather than adopting React Spectrum's heavy `CollectionBuilder` or context soup, Reference UI will integrate the **hand-rolled Collections API** from our sister design system:
1. **Zero Public Providers & Zero Context Overhead**: Strictly conforms to Manifesto Law 3 (Zustand and pure model substrate).
2. **AI-Native & Transparent**: Direct, predictable iterable normalization that AI coding models can reason about and compose reliably without multi-tier context providers.
3. **Unified Item Identity & Metadata**: Fast, memoized item lookup, stable key extraction, disabled-key sets, and hierarchical section grouping shared consistently across `Listbox`, `Menu`, `Tree`, `Tabs`, and `GridList`.
4. **Seamless Dual Authoring**: Flawless support for both static JSX authoring and high-performance dynamic arrays.

---

## 5. Architectural Comparison Matrix

| Architectural Axis | React Spectrum / React Aria | Reference UI |
| :--- | :--- | :--- |
| **Component Philosophy** | Hook soup (`@react-aria`) + heavy compound Context components (RAC) | Primitive-first, compiler-backed, typed native HTML elements |
| **DOM Host Elements** | Polymorphic or dynamic wrappers with `slot` attributes | Fixed, deterministic native HTML host elements (Law 1) |
| **Polymorphic `as` Prop** | Supported via `asChild` / slots / render props | **Strictly Forbidden**; 1:1 platform mirroring |
| **State Substrate** | Prop drilling + deep React Context trees + `@react-stately` | **Internal Zustand stores** (document or instance scoped) |
| **Collections Architecture** | Complex virtual node graph (`CollectionBuilder`) + React Context | **Custom Hand-Rolled Collections Engine** (zero context, pure model) |
| **Public Context Providers** | Mandatory (`<Provider>`, `<RouterProvider>`, etc.) | **Zero Public Providers**; trees mount freely (Law 3) |
| **Styling & Layout** | Runtime CSS classes, Spectrum design tokens, Tailwind plugin | Baseline typographic rhythm (`r`), compile-time `StyleProps`, `:has()` |
| **Date & Time Strategy** | `DateSegment` spinbuttons + comprehensive calendar suites | Atomic text input (`DateField`) + fold/unfold recipe + `Calendar` grid |
| **Numeric Strategy** | Multi-hook `useNumberField` + `useSpinButton` | Atomic text input with `:has()` bezel (`NumberField`) |
| **Modal / Overlay Strategy** | Fragmented across `Dialog`, `Modal`, `Popover`, `Tray` | Unified under `Overlay` (Floating UI + Vaul) & `Popover` (hover grace) |
| **File Handling Strategy** | Headless `DropZone` & `FileTrigger` components | **Application-Owned / Agentic Prompt** + Maintained File Icons in `@reference-ui/icons` |
| **Test Strategy** | JSDOM unit tests (`jest`) + Playwright e2e | Pure Vitest model tests + Playwright browser contracts (`matrix/lib`) |

---

## 6. Recommendations & Action Items

Based on this deep dive against Reference UI's manifesto and real-world agentic workflow requirements:

### 1. High-Value Architectural & Behavioral Additions
1. **Incorporate Landmark Navigation into `ReferenceLibrary`**:
   - Add document-scoped `LandmarkManager` into `@reference-ui/lib`.
   - Wire `F6` / `Shift+F6` keyboard cycling and live-announcer announcements to `<Main>`, `<Nav>`, `<Header>`, `<Section>`, and `<Aside>` typed primitives.
2. **Steal `GridList` for Interactive Item Rows**:
   - Add a 1D `GridList` primitive (`role="grid"`) to solve the APG prohibition against interactive buttons, checkboxes, and menus inside `Listbox.Option`.
3. **Integrate the Custom Hand-Rolled `Collections` API**:
   - Port the sister design system's Collections engine into `src/core/collections/`.
   - Unify static JSX and dynamic collection normalization across `Listbox`, `Menu`, `Tabs`, `Tree`, and `GridList`.
4. **Curate & Maintain Default File-Type Icons in `@reference-ui/icons`**:
   - Rather than bloating `@reference-ui/lib` with a rigid `DropZone` or `FileTrigger` widget that developers constantly fight, maintain a complete, standardized set of file-type icons in `@reference-ui/icons` (PDF, Image, Video, Audio, Archive, Code, Sheet, Doc) with a MIME/extension resolver.

### 2. Immediate Code & Test Lifts (Enhance Existing 24 Components)
- **`Overlay` Mobile Scroll Lock**: Lift React Aria’s `preventScrollMobileWebKit` in `vendor/react-spectrum/packages/react-aria/src/overlays` into Reference UI's scroll-lock kernel (handles visualViewport zoom and iOS address-bar bouncing better than raw Vaul).
- **`Tree` Roving Focus & Navigation**: Lift Zag and React Aria's collection filtering tests to ensure collapsed tree nodes are strictly excluded from the roving set.
- **`DateField` & `Calendar`**: Continue leveraging `@internationalized/date` queries for non-Sunday week starts and locale-specific date formatting constraints.
