/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly PACKAGE_VERSION: string;
    readonly GEMINI_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
