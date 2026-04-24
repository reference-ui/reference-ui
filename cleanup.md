when you run ref sync,
there's a weird 'reference-ui-config-coijhfoih' thing that gets created and is visible in the user space
as very small clean up, can we have those generated temp files be locaated someting in .reference-ui/tmp?

also, the session api likes to create session amrkers int he suers folder too! which just has the perception of jank, even though we need those files

I'd say in reference-core, under lib/paths, we should make a temp-folder path which poiints to .reference-ui/tmp

then session files etc, or those config eval stuff can point there.

this is a suppoed to be a smaller tidy up but please be careful not to break shit. 

