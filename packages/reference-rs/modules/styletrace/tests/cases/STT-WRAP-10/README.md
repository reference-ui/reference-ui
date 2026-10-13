# STT-WRAP-10 — Mutually recursive wrappers trace deterministically when any link reaches a primitive

Ping renders Pong and Div, and Pong renders Ping, so the cycle reaches Div through Ping.
Ping and Pong both trace in every walk order: a cycle cut must never store a verdict that a later walk reads as final (STT-5 for the Pong link through Ping).
Solo1 and Solo2 render each other and never reach a primitive, so they stay off the surface (STT-22: nothing downstream reaches a primitive). The walk terminates without a crash.

> Search terms: cycle, mutual recursion, determinism, cut, memo
