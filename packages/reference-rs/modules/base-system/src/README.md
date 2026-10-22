# Base-system native sources

The portable design-system definition. Lowers an evaluated spec — tokens, fonts, keyframes, globals, recipes, breakpoints, conditions — into the indexed tables atomic queries: token membership, condition wraps, font and motion tables, and the static utilities to pre-emit. Tokens, lowering, and the frozen library fixture each own a module. Breakpoint range keys (`<name>Down`, `<name>Only`, `<from>To<To>`) have one shape, owned by `breakpoint_range`: atomic's extract and resolve read keys with it, and typegen prints a range only where it reads back as that pair.
