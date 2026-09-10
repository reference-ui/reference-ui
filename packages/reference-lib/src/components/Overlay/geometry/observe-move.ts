import { rectsDiffer, readClientRect } from '../../../core/measure'

/**
 * IntersectionObserver layout-shift detector. Port of Floating UI
 * `observeMove` (https://samthor.au/2021/observing-dom/).
 *
 * Not a rAF loop. Rebuilds a tight rootMargin around the element and fires
 * `onMove` when that box is no longer a 1:1 intersection.
 */
export function observeMove(
  element: Element,
  onMove: () => void,
  ancestorResize: boolean
): () => void {
  let io: IntersectionObserver | null = null
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const root = element.ownerDocument.documentElement

  function cleanup() {
    if (timeoutId != null) clearTimeout(timeoutId)
    timeoutId = undefined
    io?.disconnect()
    io = null
  }

  function refresh(skip = false, threshold = 1) {
    cleanup()

    const snapshot = readClientRect(element)
    const { left, top, width, height } = snapshot

    if (!skip) onMove()
    if (!width || !height) return

    const insetTop = Math.floor(top)
    const insetRight = Math.floor(root.clientWidth - (left + width))
    const insetBottom = Math.floor(root.clientHeight - (top + height))
    const insetLeft = Math.floor(left)
    const rootMargin = `${-insetTop}px ${-insetRight}px ${-insetBottom}px ${-insetLeft}px`

    const options: IntersectionObserverInit = {
      rootMargin,
      threshold: Math.max(0, Math.min(1, threshold)) || 1,
    }

    let isFirstUpdate = true

    function handleObserve(entries: IntersectionObserverEntry[]) {
      const ratio = entries[0]?.intersectionRatio
      if (ratio === undefined) return

      if (rectsDiffer(snapshot, readClientRect(element), 0.5)) {
        refresh()
        return
      }

      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          refresh()
          return
        }
        if (!ratio) {
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7)
          }, 1000)
        } else {
          refresh(false, ratio)
        }
      }

      isFirstUpdate = false
    }

    try {
      io = new IntersectionObserver(handleObserve, {
        ...options,
        root: root.ownerDocument,
      })
    } catch {
      io = new IntersectionObserver(handleObserve, options)
    }

    io.observe(element)
  }

  const win = element.ownerDocument.defaultView
  const handleResize = () => refresh(ancestorResize)
  win?.addEventListener('resize', handleResize)
  refresh(true)

  return () => {
    win?.removeEventListener('resize', handleResize)
    cleanup()
  }
}
