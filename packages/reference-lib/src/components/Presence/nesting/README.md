# nesting

The parent-descendant problem: when nested Presence instances close together,
the parent must stay mounted until its own effects finish and every
descendant exit reports back — without letting a born-closed, interrupted,
or externally removed descendant strand it forever. Registration happens at
exit-start, never on mount; release funnels through one settlement callback
where the hook re-checks its predicate. The hook owns the React side;
this folder owns the pending-set truth.
