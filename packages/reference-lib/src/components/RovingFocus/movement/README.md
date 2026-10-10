# movement

Arrow resolution, in one dimension and two. Linear resolution maps keys to
destination indexes with RTL-aware horizontal reversal, loop wrap versus
boundary clamp, and whole-composite Home/End/PageUp/PageDown endpoints —
returning whether the key was handled so the caller prevents default even
at a clamped edge. Grid geometry groups measured rects into visual rows by
overlap, moves horizontally in x order, and takes the adjacent row's
nearest horizontal center with DOM-order ties. Both are pure: rects and
direction are read per keystroke by the caller, never cached.
