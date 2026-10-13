# STT-WRAP-09 — A higher-order component that forwards style props into its parameter traces under each export name

A function HOC and an arrow HOC return a component whose StyleProps spread into the parameter the HOC was given. Applied at an export site (`export const PaddedBox = withPad(Div)`), the export traces because the argument it receives is a Reference primitive.
The same holds when the returned component is a `React.forwardRef` wrapper (RefBox), an inner function declaration (InnerBox), or a local component that forwards into a primitive (WrappedPlain, from the unexported Plain).
A HOC applied to a component that exposes no StyleProps (LabelledText over PlainText) stays untraced, and the unexported helpers emit nothing.
