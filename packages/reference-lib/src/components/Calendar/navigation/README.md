# navigation

Day-grid keyboard moves as pure resolutions: out-of-bounds skipping
without wrapping, arrow steps (a week vertically, RTL-aware
horizontally), locale week-boundary landings that skip inward, and
month-preserving page targets constrained at month end. Unavailable
dates are landing spots, never skipped; null means the gesture goes
nowhere. The Grid part feeds these the origin and the bounds and moves
only focus — never selection.

Up: [Calendar](../README.md).
