---
'@reference-ui/core': patch
'@reference-ui/rust': patch
'@reference-ui/mcp': patch
---

Remove 26 style props that never produced CSS: `animationState`, `backgroundConic`, `backgroundGradient`, `backgroundLinear`, `backgroundRadial`, `boxSize`, `debug`, `fontSmoothing`, `gradientFrom`, `gradientFromPosition`, `gradientTo`, `gradientToPosition`, `gradientVia`, `gradientViaPosition`, `hideBelow`, `hideFrom`, `scrollSnapStrictness`, `spaceX`, `spaceY`, `srOnly`, `textShadowColor`, `textStyle`, `translateX`, `translateY`, `translateZ` and `truncate`. They leave `StylePropName`, so code that passes them now fails `tsc`, and `css()` warns `ATM-W-UNKNOWN-PROPERTY` at sync. Nothing renders differently: sync dropped them before. Use `size` for `boxSize`, `translate` for the translate axes, and `webkitTextFillColor` or `textGradient` for gradient text. As JSX attributes they are no longer style props, so React forwards them to the DOM. `ATM-W-UNREALIZABLE-EXTENSION` is retired and never emitted. The MCP style-prop reference no longer lists names the vocabulary rejects (`bgColor`, `ringColor`, `rounded*`, `shadow`, `colorMode` and others).
