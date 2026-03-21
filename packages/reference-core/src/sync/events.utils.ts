import { emit, on } from '../lib/event-bus'
import type { Events } from '../events'

type EmitOptions<KEmit extends keyof Events> =
  | {
      emit: KEmit
    }
  | {
      emit: KEmit
      payload: Events[KEmit]
    }

type ForWorkerOptions<KReady extends keyof Events, KOn extends keyof Events, KEmit extends keyof Events> =
  {
    ready: KReady
    on: KOn
  } & EmitOptions<KEmit>

type EmitOnAnyOptions<KOn extends keyof Events, KEmit extends keyof Events> = {
  on: KOn[]
} & EmitOptions<KEmit>

type AfterFirstOptions<KOn extends keyof Events, KEmit extends keyof Events> = {
  on: KOn
} & EmitOptions<KEmit>

type CombineTriggerOptions<
  KRequire extends keyof Events,
  KEmit extends keyof Events,
> = {
  requires: KRequire[]
} & EmitOptions<KEmit>

type Trigger = {
  ready: () => void
}

function emitConfigured<KEmit extends keyof Events>(options: EmitOptions<KEmit>): void {
  if ('payload' in options) {
    emit(options.emit, options.payload)
  } else {
    emit(options.emit)
  }
}

export function forWorker<KReady extends keyof Events, KOn extends keyof Events, KEmit extends keyof Events>(
  options: ForWorkerOptions<KReady, KOn, KEmit>
): void {
  let ready = false
  let pending = false

  on(options.ready, () => {
    ready = true
    if (pending) {
      pending = false
      emitConfigured(options)
    }
  })

  on(options.on, () => {
    if (ready) {
      emitConfigured(options)
    } else {
      pending = true
    }
  })
}

export function emitOnAny<KOn extends keyof Events, KEmit extends keyof Events>(
  options: EmitOnAnyOptions<KOn, KEmit>
): void {
  for (const event of options.on) {
    on(event, () => {
      emitConfigured(options)
    })
  }
}

/**
 * Ignore `on` until `ready` has happened once, then emit for every later `on`.
 */
export function afterFirst<
  KOn extends keyof Events,
  KEmit extends keyof Events,
>(
  readyEvent: keyof Events,
  options: AfterFirstOptions<KOn, KEmit>
): void {
  let ready = false

  on(readyEvent, () => {
    ready = true
  })

  on(options.on, () => {
    if (!ready) return
    emitConfigured(options)
  })
}

/**
 * Wire a readiness event to a trigger that may already have buffered inputs.
 */
export function onReady<KReady extends keyof Events>(
  readyEvent: KReady,
  trigger: Trigger
): void {
  on(readyEvent, trigger.ready)
}

/**
 * Emit once for each fresh set of required events. Requirements may be marked
 * before readiness; once opened, the trigger flushes immediately if a full set
 * has already arrived, then waits for every requirement to advance again.
 */
export function combineTrigger<
  KRequire extends keyof Events,
  KEmit extends keyof Events,
>(options: CombineTriggerOptions<KRequire, KEmit>): Trigger {
  let ready = false
  const counts = new Map<KRequire, number>()
  const emittedCounts = new Map<KRequire, number>()

  for (const event of options.requires) {
    counts.set(event, 0)
    emittedCounts.set(event, 0)
  }

  const maybeEmit = () => {
    if (!ready) return
    for (const event of options.requires) {
      if ((counts.get(event) ?? 0) <= (emittedCounts.get(event) ?? 0)) return
    }

    for (const event of options.requires) {
      emittedCounts.set(event, counts.get(event) ?? 0)
    }
    emitConfigured(options)
  }

  for (const event of options.requires) {
    on(event, () => {
      counts.set(event, (counts.get(event) ?? 0) + 1)
      maybeEmit()
    })
  }

  return {
    ready: () => {
      ready = true
      maybeEmit()
    },
  }
}
