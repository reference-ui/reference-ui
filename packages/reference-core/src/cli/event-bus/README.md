# Event Bus

Minimal event bus for cross-module coordination in the CLI.

## Philosophy

**Modules talk via events, not function calls.**

Loose coupling. Easy to add listeners. Natural watch mode. Clean dependencies.

## Basic Usage

```ts
import { emit, on, once, off } from './event-bus'

// Emit an event
emit('file:changed', { path: 'src/App.tsx' })

// Listen for events
on('file:changed', ({ path }) => {
  console.log('File changed:', path)
})

// Listen once
once('panda:done', () => {
  console.log('Panda is ready!')
})

// Remove listener
off('file:changed', myHandler)
```

## Typed Events

For type safety and autocomplete, use the typed API:

```ts
import { emit, on, once } from './event-bus/events'

// ✅ Typed - autocomplete and validation
emit('panda:done', { duration: 123 })

// ❌ Type error - wrong payload
emit('panda:done', { invalid: true })

// ✅ Typed handler
on('file:changed', ({ path }) => {
  // path is typed as string
})
```

Add new events to `events.ts`:

```ts
export type Events = {
  'my-module:ready': void
  'my-module:done': { result: string }
}
```

## Module Pattern

Modules emit when done, listen for upstream events:

```ts
// my-module/index.ts
import { on, emit } from '../event-bus'

export function initMyModule(config) {
  // Listen for upstream events
  on('virtual:ready', async () => {
    // Do work
    const result = await doWork()

    // Emit when done
    emit('my-module:done', { result })
  })
}
```

## Debug Mode

Set `DEBUG=1` to see all events:

```bash
DEBUG=1 pnpm cli sync
```

Output:

```
[bus] file:changed { path: 'src/App.tsx' }
[bus] virtual:transformed { path: 'src/App.tsx' }
[bus] panda:updated undefined
[bus] bundler:done undefined
```

## Event Naming Convention

Use `module:action` format:

- `file:changed`
- `virtual:ready`
- `virtual:transformed`
- `panda:done`
- `panda:updated`
- `bundler:done`

## Testing

Mock the bus in tests:

```ts
const events = []
vi.mock('../event-bus', () => ({
  emit: (e, p) => events.push([e, p]),
  on: vi.fn(),
}))

// Assert events were emitted
expect(events).toContain(['panda:done', expect.anything()])
```

Or use real bus:

```ts
import { on } from '../event-bus'

test('emits done event', async () => {
  const promise = new Promise(resolve => {
    on('panda:done', resolve)
  })

  await initPanda(config)
  await expect(promise).resolves.toBeDefined()
})
```
