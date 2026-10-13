# STT-NEG-05 — A class component whose props expose StyleProps is not traced and warns

A class component that extends `React.Component` with StyleProps props is not traced in v1, so its style props stay untraced. The trace emits one `STT-W-CLASS-COMPONENT` warning naming the class and its file, so the silent miss is loud.
A class whose props expose no StyleProps (Label) stays silent, and the function component Tile still traces.
