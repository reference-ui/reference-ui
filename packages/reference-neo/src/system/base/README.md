# base

Base assembles portability from discovery plus config: upstream bundles plus
local IIFEs become the fragment, upstream css plus the own block becomes the
portable sheet, configured names union traced names become the roster, and all
three plus the name become the published BaseSystem. The extends validator
guards the chain's input side with the same contract the assembler emits, so a
system that fails validation can never be published and a published system
always validates.

NOT-owns: fragment evaluation, the native compile, writes to disk (the
packager leg owns every write), and jsx tracing itself (the engine traces;
base only joins the names it is given).
