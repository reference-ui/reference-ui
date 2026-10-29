export interface Notifier {
  /** Shows a message. */
  (message: string, options?: { duration?: number }): string
  /** Builds a notifier. */
  new (name: string): Notifier
  /** Shows a success message. */
  success(message: string, ...rest: number[]): string
  /** Passes a value through. */
  identity<Item>(value: Item): Item
  /** Clears everything. */
  clear()
  /** Looks one up by id. */
  find(id: string): string
  find(id: number, fallback?: string): string | undefined
  /** Runs when the count changes. */
  onChange?: (count: number, previous: number) => void
}
