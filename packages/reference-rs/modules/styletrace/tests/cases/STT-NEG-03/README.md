# STT-NEG-03 — A style-props helper called with no arguments is ignored, not a crash

`const [styleProps, elementProps] = splitCssProps()` has no argument to read a style signal from.
The array-pattern binding must be ignored, not panic the trace. Probe reads no style signal, so it is not traced and raises no error diagnostic.
Card is a normal traced primitive use, so the traced surface stays non-empty.

> Search terms: splitCssProps, no arguments, argless helper, panic, style signal
