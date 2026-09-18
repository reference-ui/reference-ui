# ATM-SITE-22: Member Tags Match Concatenated Hosts

Tests that a member-expression tag (`<Overlay.Content />`) extracts its
style props when the concatenated name (`OverlayContent`) is a host — the
Panda discovery spelling core emits — while an unconfigured member tag stays
silently gated. Core parity: `@reference-ui/lib` authors `<Overlay.Content
minW="40r" …>` (Menu) and a dozen modal/dialog style props (Showcase), all
extracted under core (RS-36).
