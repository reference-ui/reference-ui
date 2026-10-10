# parts

One file per public part — Group, Input, Increment, Decrement — plus
the shared stepper engine both steppers render. Group validates the
direct anatomy and tracks the single tab stop; Input renders draft or
clean text with vetoable commit boundaries; Increment and Decrement
stay thin named wrappers so the anatomy scan keeps their identities
while the engine owns stripping, capability, naming, registration,
and the hold session. Parts invoke sessions; they never own them.
