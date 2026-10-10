# hooks

Mount activation as a single behavior. The runtime hook mints the mount's host
id, reads the election during render, and runs one layout effect that turns the
document systems on — focus-visible tracking, warm-group policy, election
registration — with a cleanup that unsubscribes before unregistering so a
departing host fails over cleanly. The effect stays whole on purpose: the
behaviors share a dependency pair, and splitting them would change when
registration re-runs. Server renders skip the effect entirely, which is what
keeps SSR output to children alone.
