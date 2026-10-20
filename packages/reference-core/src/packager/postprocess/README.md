# Bundle postprocess passes

Pure string transforms running over packaged bundles in declared order. Passes never touch the filesystem — the legs hold the single file write — so each pass unit-pins on strings alone; the registry maps a package definition's named passes to the transforms.
