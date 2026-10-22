# ATL-BOUND-01 — Star cycle, type cycle, mutual components and a 12-module clique each analyze within 1 s

Four hostile shapes, each written into a scratch tree by `spec.ts`.
Each tree is analyzed in a child process: the built atlas `analyzeDetailed`, run through `runIsolated`.

A star cycle has an index and a module that star-export each other.
A type cycle has aliases and interfaces that extend each other.
Two components render each other.
Twelve modules star-export one another, and a page imports a name nothing declares.

Each child must finish inside 1 s, Node startup included, and report what `spec.ts` pins.
A signal, a timeout or a changed result fails the case by name.
The station input is a two-file app whose goldens are committed like every other station.
