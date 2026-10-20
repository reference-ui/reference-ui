# Global walker

Recursive traversal of global style nodes. Conditions rewrite selectors and wrap stacks (refusing bare at-rule queries instead of printing them braceless); declarations lower every value through the session; formatting prints each rule block inside its wraps and skips empty blocks.
