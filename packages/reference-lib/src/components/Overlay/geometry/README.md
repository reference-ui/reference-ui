# geometry

Positioning for anchored Content and edge sheets; unbound Content writes
no coordinates. Anchors resolve through the trigger (or a virtual point)
into Floating UI placements with RTL-aware start/end alignment, edge
sheets bind to a viewport side with stacked insets, and the living
position stays fresh through event-driven auto-updates plus an
IntersectionObserver layout-shift detector, with clipping ancestors
(including ShadowRoot hosts) driving hide flags.
