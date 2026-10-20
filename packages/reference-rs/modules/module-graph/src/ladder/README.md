# Specifier ladder

One import specifier to one module key. Walks every rung in order — relative join, tsconfig paths and baseUrl, node package entries and exports maps, extension and index probing with runtime remaps — with a per-compile probe memo keeping repeated ancestor chains off disk.
