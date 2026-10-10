# warmup

The Tooltip half of the library's configuration surface. Vendors gate instant
tooltip-to-tooltip handoffs behind a provider; here the policy is a number on
the document's warm-group store, written at mount time, with omission meaning
the group's own 300ms default and zero meaning every handoff waits. This module
owns only the write — the warm timestamps, listeners, and open/close behavior
stay with Tooltip, and election decides which mount's policy is current.
