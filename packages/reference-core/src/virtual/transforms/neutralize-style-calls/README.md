# Neutralize Style Calls

This transform hides direct `css()` and `cva()` calls outside the reserved style collection.

It exists so Panda extracts from `virtual/__reference__ui` only, while the normal user virtual mirror stays runtime-correct but no longer exposes duplicate Panda-visible call sites.