# NEO-LAYER-05 — recipe rules precede utilities so a host utility overrides the recipe base

The world defines one button recipe with an ink base and a size axis, and
paints two hosts: one carrying the recipe plus a brand `color` utility,
one carrying the recipe alone. The spec checks the sheet prints the
recipes layer before the utilities layer with the base and variant rules
inside recipes and the brand rule inside utilities, then checks computed:
the host paints brand (the equal-specificity utility wins by rank) while
the bare recipe paints ink (so the base is proven live).

Evidence: `[atm]` ATM-RECIPE-03; `[lib]` recipe/utility cascade.

> Search terms: print order, layer rank, specificity tie, tiebreak, rank win, recipes before utilities, utility beats recipe, layer/rank, recipes/utility-override, NEO-LAYER-01, NEO-LAYER-02, NEO-RECIPE-10
