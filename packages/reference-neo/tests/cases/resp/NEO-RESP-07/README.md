# NEO-RESP-07 — container utilities paint only under a container root

The world gives one 800px subtree the container: true macro and leaves a twin subtree rootless; both probes share the width: ['50px', '60px'] class. The spec checks the rooted probe paints sm width while the rootless twin keeps base width at the same container width, and that resizing the rooted wrapper flips its probe both ways.

Evidence: [atm] ATM-COND-15, ATM-COND-16; [lib] body { container-type: inline-size }; [decision D8].
