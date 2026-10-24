# Scan

The pre-scan's state machine and the constructs it reads. `scan.rs` drives one linear pass over a source's bytes: code, template
text, a JSX start tag and JSX children are the four modes, and the mode follows the construct on top of the stack. The stack
holds one frame per open construct. A bracket counts when it opens; a generic or a JSX element counts when its closer is seen, one
level over the deepest nesting that closed inside it, so a frame that is dropped unclosed counts nothing. The JSX rules read tag
heads and children, and a `>` or `}` among the children, or the end of the source inside an element, proves it was never an
element: it is dropped, and when code surrounds it the text it swallowed is scanned again as code. The rule for where an
expression starts decides whether a `<` opens an element and whether a `/` opens a regex. It looks past comments, takes a `/` after
the head of an `if`, `while`, `for` or `with` as a regex, and takes one after an object literal as a division. String
literals, regex literals, comments and escapes are opaque runs that keep the line count, and the lookahead they and the tag heads
use is charged to one budget per source, so a hostile source cannot make the scan quadratic. The raw bracket count and the opener
count are independent of all of it.
