# Splitter

Controlled resizable panel group: Panels register constraints in DOM
order, Handles separate them as focusable separators, and each Handle
centers a Thumb grip pill. The root composes the session hooks and
publishes them as context — parts register, announce, and forward
gestures, but the sessions live in the hooks.

Contract: [Splitter.md](./Splitter.md). Cases: [TESTS.md](./TESTS.md).

The root is composition only: direction tracks inherited RTL, the
registry keeps panels and handles in DOM order, the measured table
resolves string bounds off the render path, the separator model derives
ARIA and blocked flags (frozen while dragging), collapse memory keys
restore sizes by panel id, keyboard owns arrows and Enter, pointer owns
the one-capture drag session, and structure validation throws fail-fast.
Beneath the hooks, each problem owns a folder. Math solves layouts,
ARIA, and feasibility. Shared holds geometry, measurement merging,
direction, refs, and the warn channel. Styles owns the injected guard
stylesheet.

Up: [Components](../components.md).
