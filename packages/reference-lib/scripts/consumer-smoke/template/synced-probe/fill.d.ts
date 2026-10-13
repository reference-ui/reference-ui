// The consumer form Neo emits into a synced app's generated react.d.mts: lib's
// SyncedSystem register filled with the app's synced style types. The smoke
// scaffold runs no sync, so the form is written out here. Under strict only
// color is token-typed; every other style prop stays open, as in synced output.
// The export keeps this file a module, which is what makes the augmentation.
export {}

type SmokeStylePropName = 'color' | 'offset'
type SmokeStyleProps = { color?: 'smoke.ink'; offset?: unknown }
type SmokePrimitiveCssProp = { color?: 'smoke.ink'; offset?: unknown }

declare module '@reference-ui/lib' {
  interface SyncedSystem {
    styleProps: SmokeStyleProps
    cssProp: SmokePrimitiveCssProp
    stylePropName: SmokeStylePropName
  }
}
