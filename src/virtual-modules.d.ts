// Modules that vite.config.ts provides.
declare module 'virtual:backend-api-document' {
  const document: import('./lib/backend-api').BackendApiDocument;
  export default document;
}
