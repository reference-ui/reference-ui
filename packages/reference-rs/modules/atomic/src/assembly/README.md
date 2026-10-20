# Assembly build helpers

Partition and lower helpers for the finish stage. Splits wants into the own atom set and foreign groups, lowers each partition, resolves recipes against the consumer system, and emits the CSS runtime map — each helper returning its product so the stage order stays in one place.
