# Styletrace SPEC

Current freeze, cases, and proof. Design narrative: [README.md](./README.md). Diagnostic codes and refusal rules: [src/diagnostics/README.md](./src/diagnostics/README.md).

Harness: `pnpm agentrs v styletrace` (Vitest: station suite plus `tests/suites/`) | `pnpm agentrs c styletrace` (Cargo, not proof; see Legend)

---

## 1. Job of the Crate

`styletrace` takes a source tree and a Reference sync root (the synced `.reference-ui/react` declarations) and emits the sorted names of exported JSX components whose StyleProps reach a Reference primitive or the Reference style pipeline, plus located, coded diagnostics. StyleProps names come from the synced public type and primitive identity from the synced primitive declarations, never from PascalCase names or a parallel list. It parses sources with Oxc and never executes them. `trace()` returns names; `traceDetailed()` returns bindings and diagnostics. A missing source root, declaration root, or StyleProps entrypoint refuses the request with a coded throw: phases never guess a missing surface or file.

---

## 2. Legend

- `[x]` Proven by a station folder under `tests/cases/` named by the cited ID, or by a named suite under `tests/suites/`. Cargo tests in `src/` are not proof.
- `[ ]` Unproven: no station or suite in the committed tree pins the claim yet. A case named here but not yet committed does not count.

Every station also runs the standing gauges (names unique and sorted) and its `output/components.json` golden; see `tests/harness/helpers.ts`.

---

## 3. Claims

### 3.1 Traced: wrappers and the style pipeline

- [x] STT-1 A component that exposes StyleProps and forwards them into a Reference primitive is traced under its export name. Proof: STT-WRAP-01.
- [x] STT-2 Style props read in the body, by destructuring or through a fallback expression, trace like direct forwarding. Proof: STT-WRAP-01, STT-PIPE-01.
- [x] STT-3 Rest and spread forwarding traces, and peeling non-style fields off first does not hide the wrapper. Proof: STT-WRAP-06, STT-WRAP-01.
- [x] STT-4 A `React.forwardRef` wrapper whose generics are StyleProps traces under its public export name. Proof: STT-WRAP-02.
- [x] STT-5 Every style-bearing link in a local wrapper chain traces. Proof: STT-WRAP-07.
- [x] STT-6 Components produced by a factory such as `createIcon` trace under their exported names, and wrappers over them trace too. Proof: STT-WRAP-03.
- [x] STT-7 A component that calls `splitCssProps`, `box` or `css` directly traces without wrapping a primitive. Proof: STT-PIPE-01.
- [x] STT-8 A namespace import of `@reference-ui/react` (`Ref.Div`) counts as a Reference primitive. Proof: STT-BAR-06.

### 3.2 Traced: barrels, re-exports and aliases

- [x] STT-9 A wrapper exported under an alias traces under the exported alias, not its local binding. Proof: STT-BAR-07.
- [x] STT-10 A compound-member alias (`Tabs.Panel = Panel`) mints a dotted name for a style-bearing target, local or imported. Proof: STT-BAR-03.
- [x] STT-11 Names behind a local `export *` barrel trace under their own names, and the barrel itself adds none. Proof: STT-BAR-01.
- [x] STT-12 A wrapper re-exported through a local named barrel keeps tracing under its public name. Proof: STT-BAR-04.
- [x] STT-13 A package barrel that re-exports with `export *` traces its wrapped component under the name the entry re-exports it as. Proof: STT-BAR-02.

### 3.3 Traced: packages, subpaths, node_modules and entries

- [x] STT-14 A default-export component from a package traces through a local wrapper and through a renamed default re-export. Proof: STT-PKG-01.
- [x] STT-15 A package subpath listed in `package.json` `exports` resolves and traces. Proof: STT-PKG-03.
- [x] STT-16 A wrapper that forwards into an installed package traces, and so does a consumer that re-exports and wraps a packaged barrel. Proof: STT-WRAP-04, STT-BAR-05.
- [x] STT-17 Only source files discovered under the traced root emit names (`node_modules`, `dist`, `target` and `.git` are skipped); a package export that no entry re-exports stays an edge target, while an entry's re-export traces under the entry's name. Proof: STT-PIPE-02, STT-WRAP-04.

### 3.4 Not traced (negatives)

- [x] STT-18 A component that renders a Reference primitive without exposing StyleProps is not traced. Proof: STT-NEG-01.
- [x] STT-19 A component with no style props stays off the surface, and an alias onto a style-less component mints no name. Proof: STT-WRAP-01 (`PlainTitle`), STT-BAR-03 (`Tabs.Plain`).
- [x] STT-20 Unexported helpers never emit a name, including the inner function of a `forwardRef` or a factory. Proof: STT-WRAP-02, STT-WRAP-03, STT-PIPE-01.
- [x] STT-21 A multi-file plain-React library with no Reference import stays off the surface, barrels included. Proof: STT-PKG-02.
- [x] STT-22 A wrapper whose props forward only into plain-React package components, with no Reference primitive or pipeline downstream, is not traced. Proof: STT-WRAP-05.
- [ ] STT-23 Primitive identity comes from the synced primitive declarations, never from PascalCase names. Unproven: STT-PKG-02 has primitive-like names but no StyleProps, so it cannot tell name lookup from prop flow.

### 3.5 Diagnostics

- [x] STT-24 An unparsable file yields one `STT-W-SKIPPED-FILE` warning carrying its path and the StyleTrace skip sentence, and its siblings still trace. Proof: STT-NEG-02 (siblings), `tests/suites/detailed.test.ts` (exact wire bytes).
- [x] STT-25 An unreadable source root refuses the trace with a coded throw, `STT-E-SCAN-FAILED`, never as an outcome diagnostic. Proof: `tests/suites/detailed.test.ts`.
- [x] STT-26 A declaration root with no StyleProps entrypoint refuses with a coded throw, `STT-E-UNRESOLVED-SURFACE`. Proof: `tests/suites/detailed.test.ts`. Unproven: the no-sync-root refusal.

### 3.6 Robustness and output

- [ ] STT-27 Malformed but parseable user code, such as a style helper called with no arguments, never crashes the trace. Proof: STT-NEG-03 passes in the working tree, but it is uncommitted and owned by another agent, so unproven at this commit.
- [x] STT-28 The trace returns unique names in sorted order, and each station pins them in `output/components.json`. Proof: every STT station (standing gauges and goldens in `tests/harness/helpers.ts`).

---

## 4. Do Not / Tripwires

- Do not guess a missing surface or file: refuse with the coded throw, or skip the one file and keep its siblings.
- Do not add a PascalCase name list or a second StyleProps list.
- Do not rename a diagnostic code once a golden pins it; extend the table instead.
- Do not reword the skip sentence; it is pinned byte-identical to the legacy prose.
- Do not give a case folder a label as its name: `case.json` `name` and README line 1 are the one-line claim (AGENTS.md section 7).
