# Cascade

Sort key and shared at-rule grouping for `@layer utilities`. Rank is
`(bucket, at-rule kind, parsed width, selector, property, ties)`. Atoms that
share one wrap sequence emit under one copy of that sequence. Two at-rule
wraps nest in author order; the first wrap is only the sort key.
