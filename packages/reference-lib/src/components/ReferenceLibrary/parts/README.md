# parts

What the elected host renders. The runtime hosts pair the visual Toast host
with the live-region announcer inside the winning React root — no portal, so
ShadowRoot ownership survives — while the toaster mapping resolves library
configuration onto host props with the global hotkey as its one fallback.
Gating lives outside: the root renders this part only on the active mount, so
the part itself never asks who won.
