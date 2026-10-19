// Ambient gallery mount API the CT browser host exposes.
// It takes nothing and emits the window.mount / window.unmount typings `mount` calls.
declare global {
  interface Window {
    mount: (params: { story: string; props?: Record<string, unknown> }) => Promise<void>
    unmount: () => Promise<void>
  }
}

export {}
