# parts

One file per public compound part, plus the private hover bridge. The
trigger chains intent onto the Overlay trigger, the portal lifts content
out of clipping ancestors, the content carries the panel chrome,
hover/focus persistence, and the close-time focus return, the arrow marks Overlay geometry as
popover-owned, and close dismisses on press. The bridge renders nothing:
while open it samples document pointer travel against the safe polygon
so the cursor can cross the grace corridor without dismissing.
