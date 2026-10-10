/**
 * Tree's typeahead labels (TR-TYPE-04/05): explicit textValue wins;
 * otherwise row text without expander/group/hidden content and leading
 * decoration. Digits are content, not decoration: \p{Emoji} matches ASCII
 * 0-9, so they are carved out — otherwise "0 backups" would search as
 * "backups". DOM-bound; tests prove it against fakes cast to HTMLElement.
 */

export function extractTypeaheadText(el: HTMLElement): string {
  const explicitText = el.getAttribute('data-text-value')
  let text = explicitText ?? ''
  if (!explicitText) {
    const clone = el.cloneNode(true) as HTMLElement
    clone.querySelectorAll('button, [role="group"], [aria-hidden="true"]').forEach((n) => n.remove())
    text = (clone.textContent ?? '').trim()
  }
  return text.replace(/^(?:(?![0-9])[\p{Emoji}\p{Punctuation}\s])+/u, '')
}
