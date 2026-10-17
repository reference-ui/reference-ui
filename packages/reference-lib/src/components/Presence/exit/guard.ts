/**
 * The once-guard for exit completion. Every completion path (event,
 * WAAPI, GSAP, fallback timer, descendant release, coordinator release,
 * instant) funnels through one `ExitGuard`: `begin` opens a new exit epoch,
 * `cancel` voids the live epoch when `present` returns (an interrupted exit
 * never reports), and `complete` succeeds exactly once per epoch. The hook
 * owns the side effects; the guard owns the counting, so races pin down in a
 * unit test instead of a browser.
 */

export class ExitGuard {
  private exitId = 0
  private firedExitId = 0

  /** Open a new exit epoch; returns its id. */
  begin(): number {
    this.exitId += 1
    return this.exitId
  }

  /** Void the live epoch: an interrupted exit must never report completion. */
  cancel(): void {
    this.firedExitId = this.exitId
  }

  /**
   * Claim completion for the live epoch. Returns true exactly once per
   * epoch — the first caller finishes the exit, every later caller (stale
   * events, double promises, fallback timer) stands down.
   */
  complete(): boolean {
    if (this.exitId <= this.firedExitId) return false
    this.firedExitId = this.exitId
    return true
  }
}
