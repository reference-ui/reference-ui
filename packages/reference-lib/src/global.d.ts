// Ambient types for the lib workspace: Vite client types plus CSS module shims.
// It takes nothing and emits the global declarations every lib source file compiles against.
/// <reference types="vite/client" />
declare module '*.css';
declare module '@reference-ui/react/styles.css';
