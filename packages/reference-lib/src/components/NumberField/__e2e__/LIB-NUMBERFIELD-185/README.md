# LIB-NUMBERFIELD-185 — NumberField CT NF-COMMIT-12: Validate commit reports onInvalidCommit when the parent has echoed the live value

NumberField CT NF-COMMIT-12: Validate commit reports onInvalidCommit when the parent has echoed the live value.

Execution: single `test` under `test.describe('NumberField CT')`. The ValidateFixture parent echoes every live `onChange`, so each commit lands on the controlled value and requests nothing; the advisory `onInvalidCommit` must still report the violation (issue #25).
