// Browser model barrel: it takes the document builder plus the type and JSDoc
// shapers and emits the model surface the runtime and the S6 API consume.
// The model stays UI-free — presentation reads these plain values.

export { createReferenceDocument } from './document.ts'
export { createReferenceJsDoc, createReferenceType, createReferenceTypeParameter, formatReferenceTypeParameter } from './type.ts'
