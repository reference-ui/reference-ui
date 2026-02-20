# How the CLi works.



## initialise the config and watcher
step 1: load the users config.


step 2: we can setup a file watcher
should be monitoring files the user has included
should be via event bus. 


## Sandbox

Copy included files into sandbox.
applying a transform. on the files where needed.
some transforms may be useful for panda css to understand how to scan it.
but panda css is not really the thing that should own sandbox, as other odules in future may want to read from here.
in general, the files should be mostly kept as-is. with a few AST transforms specific to panda
MDX should generally be transformed into js, again for panda.



## Panda

the goal with panda is to create an isolated enrivonment for it, then heavily augment it's capabilities

