# TST-BOUND-01 — bounded-display: display members terminate on cyclic and growing heritage

Verifies that getDisplayMembers() ends on every symbol of two cycles and a growing generic.
Each symbol is projected in a child process (runIsolated), so a runaway walk shows as a signal.
The pass must finish within 2 s, and the API must raise no step-budget notice for this input.
Each cycle ends at the ancestor it revisits, so each named symbol lists a fixed member set.
The driver is display-every-symbol.mjs, which imports the built dist/tasty.mjs.
