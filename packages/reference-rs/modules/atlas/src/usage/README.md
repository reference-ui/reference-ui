# Usage counting

Call-site frequency, prop distributions, examples, and co-location per tracked component. The walker records every JSX occurrence in source order wherever the grammar allows it; counting scores occurrences into the sorted component list; observation counts configured elements through their import bindings; scope tells locally defined names from library ones.

The walker and the scope reader take the program the parser already holds, so they never parse. The parser runs them for each of the app's own modules and stores the occurrences and the scope names on `ModuleInfo`; the counting and observation passes read those fields. A package module carries none, because usage is never counted over package sources.
