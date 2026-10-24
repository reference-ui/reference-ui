# Parse

The internals of the nesting gate. Its public API is in the parent `parse.rs`, which owns the one production `Parser::new`
call in reference-rs. This page says what the gate is for, how it counts, which limits it keeps and why they sit where they do,
how a source is screened once, and what the gate leaves alone.

## What the gate is for

Oxc parses by recursion, so a source nested deeply enough overflows the stack of the thread that parses it, and a native stack
overflow aborts the whole process instead of failing one file. The gate gives real code a located error instead. A source nested past the limit
is refused before Oxc sees it, the module reports a parse diagnostic with the file and the line where the nesting crossed the
limit (atomic's is `ATM-E-PARSE`), and every other file still compiles. The gate also catches the honest mistakes that produce
such sources: a generated file, a runaway tag, an expression nested by a code generator.

The gate is not a defence against input crafted to defeat its lexer. The scan is a bound, not a lexer. Its rules for strings,
regex literals, templates, generics and JSX are right for code people write, and a file built to be misread by them can hide a
nest from it. That is accepted, because a crafted file can only crash the build of its own author: a build that parses a project's
files already runs that project's own code, so anyone who can add a file to the project can break its build without a crafted
nest. The two backstops below are sized for honest mistakes that the rules misread, not for an adversary. A lexing hole that
adversarial probing finds goes to the backlog; a hole that real code reaches is a bug.

## How it counts

A single linear pre-scan over the source bytes keeps a stack of open constructs. A bracket, and the `${` of a template literal,
counts as a level the moment it opens, and the scan refuses at the first moment those levels pass 1,024. A TypeScript generic
`<` and a JSX element are guesses until their closer (`>`, `/>` or `</x>`) is seen, so each sits on the stack uncounted and then
counts one level over the deepest nesting that closed inside it. A comparison, a shift or a misread tag that never closes costs
nothing, and a `;` or an outer closer drops it. Strings, comments and template text are read past whole, and JSX text, which is
raw, is read as text.

Oxc also recurses through chains that open no bracket: `!!!!x`, `typeof typeof x`, `a ? b : c ? d : e`, `a => b => c` and
`a = b = c`. Each bracket level keeps two counters for them, and a level that passes 8,192 is refused. The prefix counter
counts the operators (`! ~ - +`, the words `typeof`, `void`, `delete`, `await`, `keyof`, `readonly` and `new`, and in a TypeScript
file that is not TSX a `<` type assertion, one link whatever its type holds, so `<A | B><any>x` counts both; the `>` that closes it carries the run on) that follow one another with only whitespace and comments between them, and only where an expression can start, so a binary `-`, a `!=` and a TypeScript non-null `a!!` are
not prefix operators. The other counter counts the links that recurse to the right across their operands: a ternary `?`, an
`=>` and an `=`. `?.`, `??`, `==`, `<=` and the `?` of an optional member or parameter are not links. That run ends at a `;`, at
a `,`, at a newline unless the line ends in an operator that continues the expression, and when its bracket closes, which
restores the counters of the bracket level around it. A chain refusal says `operator chain longer than 8192 links`, not
the bracket message, because the limit it crossed is a count of links. A minified file, a list of ternaries and a file of assignments never
reach the limit, because each statement, element and bracket ends its run.

A `/` where an expression can start is a regex and is skipped whole, so a quote or a backtick inside it cannot swallow the line.
The start is judged from the code before the slash, comments skipped: an operator, an opener, a separator or a keyword that takes
an operand starts one, and a name, a closer or a string does not. After the head of an `if`, `while`, `for` or `with` a statement
starts, so a regex can follow its `)`, and after the `}` of an object literal an operand ended, so a division follows.

JSX text cannot hold a `>` or a `}`. An element that meets one, or the end of the source, was never an element: TSX reads the
function type `<T>(x: T) => T` as one first. The scan drops it and, when code surrounds it, scans the text it swallowed again as
code. All lookahead (regex bodies, type arguments, the second pass) is charged to one budget of eight bytes per source byte, so a
hostile source cannot make the scan quadratic.

## The limits

- 1,024 counted levels. A survey of 126,840 sources (1,044 MB, `packages` and `node_modules`) found none deeper than 36 levels,
  bar a test fixture built to sit at 1,002. Oxc overflows a 2 MiB stack near 1,300 levels, so the bound holds even on a default
  thread stack.
- 8,192 constructs open at once, counted or not (`MAX_OPEN`). It refuses an unclosed nest of generics or elements. The same
  survey peaks at 822, in prettier's minified Flow parser read as TypeScript.
- 8,192 deep in a raw count of `(`, `[` and `{` over every byte, which never goes below zero (`MAX_RAW`). It reads strings,
  comments and JSX text as code, so a mistake in the lexer rules cannot hide a nest from it. The survey peaks at 438, bar that
  fixture.
- 8,192 links in one unbracketed chain (`MAX_OPEN` again): prefix operators, or `?`, `=>` and `=` links in one run. On the release
  build Oxc passes 8,192 links of a prefix chain on 2 MiB, of a ternary, assignment, `new`, `keyof`, `readonly` or type-level chain on 4 MiB, and of an arrow chain on 8 MiB,
  so the lane floor holds them.
- Oxc needs 12 to 16 MiB of stack to recurse through 8,192 levels: parentheses, brackets, calls and generics take 12 MiB, and
  object literals, template expressions, type literals, tuples and function bodies take 16 MiB (measured on the release build).
  Lanes run on 64 MiB and exports on 256 MiB. A thread start the OS refuses retries at half the size down to a 16 MiB floor, so
  the backstops hold on the fallback stacks too. A 2 MiB test thread does not hold them.

A count of opener bytes sits in front of the whole gate: a source with no more than 1,024 `(`, `[`, `{` and `<` cannot reach any
limit, because every counted level and every open construct comes from one of those bytes, so it skips the scan.

## Screening once

A caller that reads a source and parses it later should not scan it twice. `ScreenedSource::screen` runs the gate once and keeps
the verdict beside the text it owns, and `parse_screened` then parses the stored text or returns the stored refusal, with no scan.
The verdict is a field of that value, so nothing is keyed or looked up across calls. `ScreenedSource::empty` runs no gate, because
an empty text cannot be refused. `parse_bounded` stays for text that is parsed once and never read again. `gate_runs` counts every
`check_nesting` call in the process, so a test can check that a read was screened exactly once. The counter is process-wide, so a
test that reads a delta runs alone in its own process, as `shared/tests/gate_runs.rs` does.

## What it leaves alone

- A `/` after `for await (…)`, after a comment between `if` and its `(`, after `of` in a `for` head, or after the `}` of a
  `case x: {…}` or a labelled block reads as a division.
- A hashbang line is read as code: `#!/usr/…` reads `/usr/` as a regex. Nothing in it hides.
- A nest hidden by a mistake the rules make is caught only by the two backstops, so it passes between 1,025 and 8,192 levels.
  Production stacks hold those.
- The gate counts brackets, template expressions, generics, JSX elements and the chains above.
- A ternary, arrow or assignment chain that a newline breaks after an operand is counted per line, not whole, so a
  generated file that wraps such a chain line by line passes.
- Oxc takes quadratic time on valid code such as `[a<b, a<b, …]`, about 25 s at 8,192 comparisons. That is the parser's cost.

## Tests

The unit tests pin the limit and its line, the skipped runs, the JSX and regex rules, each lexing hole the reviews found, the
unclosed `<`, the two backstops and the chain limit with the sources it must leave alone. They check the opener count against the scan on token soups and the scan against generated
nests of known depth. Measurements run only when `SHARED_MEASURE_OUT` is set: the scan's throughput, the time of an adversarial
source, and a survey of every source under `SHARED_DEPTH_ROOTS`.
