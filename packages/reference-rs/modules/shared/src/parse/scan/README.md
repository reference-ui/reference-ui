# Scan

The pre-scan's state machine and the constructs it reads. `scan.rs` drives one linear pass over a source's bytes: code, template
text, a JSX start tag and JSX children are the four modes, and the mode follows the construct on top of the stack. `jsx.rs` reads JSX
element heads and the rules for tags and children; `stack.rs` keeps the open-construct stack, where every JSX element is one level
from its start tag to its closing tag; and `literals.rs` reads past string literals, comments and escapes as opaque runs that keep
the line count.
