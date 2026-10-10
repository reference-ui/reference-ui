# visibility

The flag-collapsing half of region display. This module reduces the
`visible` / `hidden` pair to a single verdict — visible, hidden, or
unmounted — with `hidden` winning every contest.

The verdict is advisory, not structural: it travels on the registration
as plain data and never touches the registry version, so toggling
visibility never resubscribes hosts. The layout decision stays with the
host component, which keeps hidden regions mounted (`display: none`,
state kept) and drops unmounted ones from the tree while the entry
itself remains registered.
