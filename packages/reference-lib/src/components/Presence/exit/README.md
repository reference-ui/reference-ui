# exit

The exit-effect problem: deciding whether a closing child has anything worth
waiting for, and noticing when that something finishes. Detection reads the
closing frame — computed CSS animations and transitions, Web Animations,
finite GSAP tweens — and reduces them to one instant-or-suspend verdict; the
watcher subscribes to every completion signal while the unmount hangs; the
guard makes sure exactly one signal wins. Pure verdicts test as pure
functions; only the watcher touches the DOM.
