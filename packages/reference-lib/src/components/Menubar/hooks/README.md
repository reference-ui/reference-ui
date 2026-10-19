# Menubar hooks

Bar state behind one hook. `use-menubar-state` takes the controlled
value pair plus loop and returns the context value the root provides:
redundant-suppressed value requests, a trigger registry keyed by menu
value, DOM-ordered enabled values, and adjacent-menu moves computed
through the nav kernel. Ordering reads live node positions so authored
order never disagrees with the row on screen.

Up: Menubar.
