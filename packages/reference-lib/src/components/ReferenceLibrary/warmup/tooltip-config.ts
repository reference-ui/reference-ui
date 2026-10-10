/**
 * Applies the library's Tooltip warm-group policy to a document. After one
 * tooltip opens, its neighbors skip their opening delay while the document
 * stays warm; `applyTooltipSkipDelay` writes the configured window into the
 * document-scoped group store owned by Tooltip, and an omitted delay leaves
 * the group's own 300ms default untouched. A zero delay is a real policy, not
 * an omission — it forces every handoff through the normal opening delay.
 */
import { getTooltipGroupStore } from '../../Tooltip/tooltipGroup'

export function applyTooltipSkipDelay(doc: Document, skipDelay: number | undefined): void {
  if (skipDelay !== undefined) {
    getTooltipGroupStore(doc).getState().setSkipDelay(skipDelay)
  }
}
