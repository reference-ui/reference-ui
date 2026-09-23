# run

Small wrapper for CLI command execution.

This module standardizes the outer shell of a command:

- run the command
- catch thrown errors
- log a readable failure message
- exit the process with code `1`

## What it owns

- generic command wrapping
- consistent failure presentation
- process-exit behavior for command failures

## What it does not own

- command parsing
- command business logic
- retry behavior
- cleanup behavior after failure
