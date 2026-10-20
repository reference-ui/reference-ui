# parts

One file per public part: the header row and its heading, drill-down,
and nav buttons; the day table with its weekday, day-cell, and day
sections; and the month and year collections. Parts read resolved state
from the contexts and own only their rendering plus their roving focus —
selection, availability, and navigation decisions live in the domain
folders and arrive through hooks. The Grid is the largest part: it owns
focus, preview, keyboard, and activation for the whole day table.
