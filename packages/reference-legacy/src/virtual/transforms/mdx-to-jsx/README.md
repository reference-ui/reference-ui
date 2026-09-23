# MDX To JSX

This transform compiles MDX into JSX before Panda sees the file.

That keeps MDX-specific parsing isolated from the runtime-import retargeting steps that follow in the main transform pipeline.