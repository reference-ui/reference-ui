# Base-system spec generator

Builds the library spec without evaluating TypeScript. Tokenizes the theme files, parses the tokens, keyframes, and font call sites into JSON, deep-merges the token trees (duplicate leaves with different values are a hard error), and writes the nested artifact the native loader accepts.
