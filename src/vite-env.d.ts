/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PADRON_DELETE_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
