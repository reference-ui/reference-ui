/**
 * Reference Lib - Design system consumer
 *
 * Minimal config for testing the chainable design system pattern.
 * Uses core as the live config/runtime pipeline.
 */

import { defineConfig } from '@reference-ui/core'
import { baseSystem as iconsBaseSystem } from '@reference-ui/icons/baseSystem'

export default defineConfig({
  name: 'reference-ui',
  // Published include: shipped component source only. Book, story, fixture
  // and __e2e__ files are Book's compile (book/ui.config.ts); their style
  // call-sites must not reach this system or its CSS, since docs and every
  // other consumer extends it.
  // The barrel re-exports every component but holds no style call-sites of
  // its own, so excluding it drops ~330ms of redundant StyleTrace edge
  // resolution with byte-identical output (Obj-3, LOG-3.md). Every target
  // stays covered as a direct compile entry. WARNING: if a style call-site
  // ever lands in src/index.ts, this negation silently drops it — the guard
  // test ../reference-core/src/sync/lib-barrel-negation.test.ts fails loudly
  // in that case. Keep both.
  // Unit tests are not shipped either: they alone mint 48 utilities (e.g.
  // bd-b-w_-144px) that would otherwise reach the published CSS.
  include: [
    'src/**/*.{ts,tsx}',
    '!src/index.ts',
    '!src/**/*.book.tsx',
    '!src/**/*.story.tsx',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/fixtures/**',
    '!src/**/__e2e__/**',
    // Tabs/examples is a pattern demo, not API: nothing shipped imports it, so its recipes stay out of the published CSS.
    '!src/**/examples/**',
  ],
  extends: [],
  // Lib re-exports @reference-ui/icons and renders icons inside its own
  // components, so the icons stylesheet must travel with lib's CSS to every
  // consumer (docs inherits it transitively via extends). layers carries
  // the compiled CSS only — tokens and the JSX roster stay icons-local.
  //
  // Fan-out contract: a named style prop on a component imported from a
  // package paints (on @reference-ui/icons, on every lib component, and on
  // any third-party package built on Reference UI) unless the component
  // declares that prop for itself. A prop its own declaration keeps
  // (destructured, not forwarded) is the component's own prop, never a
  // style, whether or not the component is a host: StyleTrace records it as
  // owned, and the consumer compile leaves it an attribute. The class
  // belongs to the runtime that renders the tag: the consumer's sync follows
  // the import to where it lands on disk, and a tag that lands in a package
  // with a published system (directly or through the consumer's barrels)
  // renders through that package's bundled runtime, so it is external even
  // when it spells a primitive such as `Button`. The consumer compile
  // resolves its other style props in the CONSUMER's vocabulary and emits
  // the deterministic `<system>__<stem>` class that runtime mints, once per
  // system the package renders through that the consumer composes (a lib
  // tag: reference-ui and reference-icons, since lib's published streams
  // carry the icons layered below). The value lands on the component's
  // outermost element and overrides the package default. When none of the
  // package's systems is in the consumer's extends or layers, nothing backs
  // the class (composing some other system does not help), and sync warns
  // ATM-W-EXTERNAL-UNBACKED at the tag, naming the package and its
  // `<package>/baseSystem`. There is no "must never cross" ban: that rule is
  // retired, so do not re-add it. Same-compile call-sites inside lib's own
  // src/** are unaffected (they were already backed), and the non-style
  // channels (size/style/className/native props) keep working as before.
  layers: [iconsBaseSystem],
  // Hosts come from import provenance and StyleTrace alone; nothing is
  // registered by name.
})
