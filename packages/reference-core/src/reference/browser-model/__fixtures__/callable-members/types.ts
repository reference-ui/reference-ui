/** Options a notification accepts. */
export interface NotifyOptions {
  duration?: number
}

/** A callable object with methods. */
export interface Notifier {
  /**
   * Shows a message.
   * @param message The text to show.
   * @param options Options for this message.
   * @returns The message id.
   */
  (message: string, options?: NotifyOptions): string
  /**
   * Shows a success message.
   * @param message The text to show.
   * @param options Options for this message.
   */
  success(message: string, options?: NotifyOptions): string
  /** Clears everything. */
  clear(): void
  /**
   * Looks a message up.
   * @param id The message id.
   */
  find(id: string): string
  find(id: number, fallback?: string): string | undefined
  /** Passes a value through. */
  identity<Item>(value: Item): Item
  /**
   * Runs when the visible count changes.
   * @param count The new count.
   */
  onChange?: (count: number, previous: number) => void
}
