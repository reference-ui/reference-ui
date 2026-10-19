# day-grid

Per-date resolution for the day table: the preview band validates the
hover/focus candidate against the controlled pending start, the roving
targets rank selection, today, and first in-month (relocating lost
targets forward-first), and the model resolver computes the exact
ten-field render state plus DOM/paint derivations once per date. Days
and Day read the same resolved models, so td paint and button props
can never disagree.

Up: Calendar.
