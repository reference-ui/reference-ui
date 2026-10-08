---
'@reference-ui/lib': minor
---

Layer the icons base system (`layers: [iconsBaseSystem]`) so the icons stylesheet travels with lib's CSS to every consumer. Lib's compiled CSS output now includes icons' atomic rules; rebuild lib whenever icons' compiler output changes.
