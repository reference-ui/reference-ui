# Shared hooks

Home for state adapters shared across components.

A third-party store is the standard substrate for shared state that would otherwise need React context, so adapters here integrate store creation, selector subscriptions, lifecycle, and isolation. Stores stay internal: only domain-specific hooks and actions are public, and compound anatomy stays visible JSX plus props.
