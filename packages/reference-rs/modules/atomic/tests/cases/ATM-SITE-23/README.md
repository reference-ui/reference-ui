# ATM-SITE-23: Const-Bound Branches Extract Every Leaf

Tests that an identifier bound to a ternary or logical of literals —
`const subtleBorder = isDark ? 'gray.800' : 'gray.200'` in a component
body, or a top-level `const tone = flag ? 'red.500' : 'blue.500'` —
extracts one want plus one runtime style plan per literal leaf, exactly
like the inline branch. Core parity: `BookShell.tsx` feeds its chrome
dividers (`borderBottomColor={subtleBorder}`) through this shape, and
core emits the gray-800/gray-200 utilities for both arms (RS-37).
