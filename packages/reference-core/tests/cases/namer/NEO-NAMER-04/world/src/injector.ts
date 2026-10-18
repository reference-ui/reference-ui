// Late-sheet injector for the NEO-NAMER-04 world. It takes the compiled
// sheet text embedded in the page and emits it as an inline style element,
// the way a dev bundler injects styles after the first render: this module
// runs after the app module, so css() has already named its classes while
// no sheet existed, and the rules land before load settles the probe.
const source = document.getElementById('late-sheet')
if (!source || source.textContent === null) throw new Error('missing #late-sheet')
const style = document.createElement('style')
style.textContent = source.textContent
document.head.appendChild(style)
