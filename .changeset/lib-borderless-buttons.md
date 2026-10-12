---
'@reference-ui/lib': minor
---

Modernize the primitive button surface: the `default` variant drops its 1px outline for a borderless neutral fill, every variant gains explicit token-backed hover/pressed steps (`ui.button.default.*`, `ui.button.ghost.*`, `ui.button.hover`/`pressed`) instead of the old expanding active halo, the corner radius moves from `sm` to `md`, and disabled buttons recede to a faint `gray.50`/`gray.900` chip. The native `input[type=file]` selector button now matches the default button. The Button Book gains a light/dark `States` matrix documenting Normal, Hover, Pressed, and Disabled per variant.
