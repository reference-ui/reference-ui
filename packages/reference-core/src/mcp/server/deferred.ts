export interface Deferred<T> {
  readonly promise: Promise<T>
  readonly settled: boolean
  resolve(value: T | PromiseLike<T>): void
  reject(reason?: unknown): void
  reset(): void
}

export function createDeferred<T>(): Deferred<T> {
  let resolveCallback!: (value: T | PromiseLike<T>) => void
  let rejectCallback!: (reason?: unknown) => void
  let isSettled = false

  let currentPromise = new Promise<T>((res, rej) => {
    resolveCallback = res
    rejectCallback = rej
  })

  return {
    get promise() {
      return currentPromise
    },
    get settled() {
      return isSettled
    },
    resolve(value: T | PromiseLike<T>) {
      if (!isSettled) {
        isSettled = true
        resolveCallback(value)
      }
    },
    reject(reason?: unknown) {
      if (!isSettled) {
        isSettled = true
        rejectCallback(reason)
      }
    },
    reset() {
      isSettled = false
      currentPromise = new Promise<T>((res, rej) => {
        resolveCallback = res
        rejectCallback = rej
      })
    },
  }
}
