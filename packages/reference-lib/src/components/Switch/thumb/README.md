# thumb

Answers whether the caller authored a thumb, in two passes that split on
what element identity can see. The static seed recognizes the
direct-authored shape by reference — cheap enough to run before the first
paint, so SSR and hydration already agree — while Fragment-wrapped and
HOC-forwarded thumbs stay invisible to it on purpose and reconcile from
the rendered DOM after mount, where the thumb marker is the source of
truth. The authored thumb suppresses the default; the default renders
only when no authored thumb exists.
