import { emit, on, onceAll } from '../lib/event-bus'
import { afterFirst, combineTrigger, emitOnAny, forWorker, onReady } from './events.utils'

const VIRTUAL_COMPLETE_EVENT = 'virtual:complete' as const
const RUN_REFERENCE_BUILD_EVENT = 'run:reference:build' as const

/**
 * High-level sync orchestration.
 *
 * This file is intentionally declarative: it describes which completed stages
 * unlock later work, without embedding worker-specific logic here.
 *
 * Broadly, sync flows through these phases:
 *
 * 1. Virtualize source files into `.reference-ui/virtual`
 * 2. Build system config + Panda output from the virtual tree
 * 3. Package the runtime libraries the reference build depends on
 * 4. Generate runtime declarations for those packaged libraries
 * 5. Build reference/Tasty output once those declarations exist
 * 6. Package the final `@reference-ui/types` output after reference completes
 * 7. Finish once TypeScript package generation is complete
 *
 * watch:change → run:virtual:sync:file (single file), passing payload through.
 */
export function initEvents(): void {
  /**
   * Bootstrap the virtual workspace only after the workers that depend on it
   * have started and subscribed to their events.
   */
  onceAll(['virtual:ready', 'reference:ready'], () => {
    emit('run:virtual:copy:all')
  })

  /**
   * The virtual tree is not considered ready until the reference browser
   * component has been mirrored into it.
   */
  on('virtual:copy:complete', ({ virtualDir }) => {
    emit('run:reference:component:copy', { virtualDir })
  })

  /**
   * `virtual:complete` is the barrier for downstream work: from this point on,
   * config generation, Panda, and reference builds can operate on the
   * synthesized workspace.
   */
  on('reference:component:copied', () => {
    emit(VIRTUAL_COMPLETE_EVENT, {})
  })

  /**
   * Watch mode mutates the virtual tree first. Rebuild decisions are driven by
   * the resulting `virtual:fs:change` events rather than by raw source changes.
   */
  on('watch:change', payload => {
    emit('run:virtual:sync:file', payload)
  })

  /**
   * After initial startup, virtual changes refresh the config/Panda side so the
   * generated styling surface stays aligned with mirrored sources.
   */
  afterFirst(VIRTUAL_COMPLETE_EVENT, {
    on: 'virtual:fs:change',
    emit: 'run:system:config',
  })

  /**
   * Incremental reference rebuilds can fire directly from virtual changes.
   * By the time watch mode reaches this path, the required packaged runtime and
   * declaration surface already exists.
   */
  afterFirst(VIRTUAL_COMPLETE_EVENT, {
    on: 'virtual:fs:change',
    emit: RUN_REFERENCE_BUILD_EVENT,
    payload: {},
  })

  /**
   * The first config build begins once the virtual workspace exists and the
   * config worker is ready to consume it.
   */
  forWorker({
    ready: 'system:config:ready',
    on: VIRTUAL_COMPLETE_EVENT,
    emit: 'run:system:config',
  })

  /**
   * Panda output depends on the current generated config, so it waits for the
   * config pass for this virtual workspace as well as Panda worker readiness.
   */
  forWorker({
    ready: 'system:panda:ready',
    on: 'system:config:complete',
    emit: 'run:panda:codegen',
  })

  /**
   * The reference build imports generated runtime packages such as
   * `@reference-ui/react`, so those packages must exist before a clean
   * reference build can resolve its downstream type surface.
   */
  onReady(
    'packager:ready',
    combineTrigger({
      requires: ['system:panda:codegen'],
      emit: 'run:packager:runtime:bundle',
    })
  )

  /**
   * Runtime bundle completion requests the declaration surface needed to unblock
   * the reference build. The packager-ts coordinator owns how runtime vs final
   * requests are scheduled; sync only records this dependency edge.
   */
  on('packager:runtime:complete', () => {
    emit('packager-ts:runtime:requested', {})
  })

  /**
   * Clean-build dependency:
   *
   * The reference build must wait for runtime declarations, not merely runtime
   * package directories. Tasty resolves generated system types through packaged
   * declaration surfaces such as `@reference-ui/react/react.d.mts`; if those
   * declarations are missing, re-exported symbols like
   * `SystemStyleObject` disappear from the generated manifest.
   *
   * `packager-ts:runtime:complete` is therefore the barrier that makes clean
   * downstream documentation of generated system types deterministic.
   */
  onReady(
    'reference:ready',
    combineTrigger({
      requires: [VIRTUAL_COMPLETE_EVENT, 'packager-ts:runtime:complete'],
      emit: RUN_REFERENCE_BUILD_EVENT,
      payload: {},
    })
  )

  /**
   * Any failure in the virtual/system/reference pipeline aborts the sync.
   */
  emitOnAny({
    on: [
      'system:config:failed',
      'system:panda:codegen:failed',
      'virtual:failed',
      'reference:failed',
      'mcp:failed',
      'reference:component:copy-failed',
    ],
    emit: 'sync:failed',
  })

  /**
   * The final package phase waits for reference output because
   * `@reference-ui/types` includes the generated Tasty/runtime artifacts.
   */
  onReady(
    'packager:ready',
    combineTrigger({
      requires: ['reference:complete'],
      emit: 'run:packager:bundle',
    })
  )

  /**
   * The final bundle completion requests the closing declaration pass that
   * drives sync readiness. Packager-ts decides how this request interacts with
   * any in-flight runtime pass; sync only records the top-level dependency.
   */
  on('packager:complete', () => {
    emit('packager-ts:final:requested', {})
  })

  /**
   * MCP joins Atlas output with the generated type surface once both the
   * reference build and final declarations have advanced for the current pass.
   */
  onReady(
    'mcp:ready',
    combineTrigger({
      requires: ['reference:complete', 'packager-ts:complete'],
      emit: 'run:mcp:build',
      payload: {},
    })
  )

  /**
   * Sync completes only after the MCP model has been rebuilt for the latest
   * generated type surface.
   */
  on('mcp:complete', () => {
    emit('sync:complete')
  })
}
