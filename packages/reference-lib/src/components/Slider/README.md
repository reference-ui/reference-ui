# Slider

Controlled single or multi-thumb slider: Track owns the rail geometry,
Range paints the filled span, and each Thumb publishes its own clamped
ARIA and focus ring. The root validates configuration, runs the drag and
keyboard sessions through hooks, and publishes everything as context —
parts invoke session handlers but never own them.

Contract: [Slider.md](./Slider.md). Cases: [TESTS.md](./TESTS.md).

The root is composition only: direction resolves inherited RTL, the
registry reconciles mount ids to DOM order, value-request snaps and emits
candidates, pointer-drag owns the single-pointer window session, and
keyboard owns arrows, paging, Home/End, and the key-session end report.
Beneath the hooks, each problem owns a folder. Math decides validation,
snapping, and neighbor bounds. Interaction resolves track clicks and
thumb presentation as pure, tested decisions. Shared holds the warn
channel and registry ordering every hook asks.

| Folder | Role |
| :--- | :--- |
| [`hooks/`](./hooks) | Direction, registry, value requests, drag, keyboard |
| [`parts/`](./parts) | Track, Range, Thumb renderings |
| [`math/`](./math) | Numeric model: validation, snap, bounds, paging |
| [`interaction/`](./interaction) | Track-click choice, thumb presentation decisions |
| [`shared/`](./shared) | Warn channel, registry ordering |
