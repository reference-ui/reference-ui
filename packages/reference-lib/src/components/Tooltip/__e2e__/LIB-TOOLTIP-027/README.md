# LIB-TOOLTIP-027 — Tooltip consumer and lifecycle contracts across open and close, prevention, controlled requests, and remount sessions

Authored descriptions survive open and close with one live tooltip reference,
consumer prevention cancels pointer and keyboard opening, controlled requests
stay closed until the owner updates, and unmount cancels delayed opening so
remount starts a fresh session.

Spec: Tooltip.contract.ct.spec.ts. No visual baselines.
