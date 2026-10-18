// Resolve hook for the NEO-WATCH-14 child process. It takes an import specifier and emits the shim module for @parcel/watcher, passing every other specifier through.
// The shim sits beside this file, so the drop behaviour is defined in exactly one place.
export async function resolve(specifier, context, next) {
  if (specifier === '@parcel/watcher') {
    return { url: new URL('./parcel-shim.mjs', import.meta.url).href, shortCircuit: true, format: 'module' }
  }
  return next(specifier, context)
}
