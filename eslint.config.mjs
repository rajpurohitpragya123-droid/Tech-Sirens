import js from '@eslint/js';
import tseslint from 'typescript-eslint';
const globals = Object.fromEntries(
  [
    'console',
    'process',
    'Buffer',
    'fetch',
    'crypto',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    'AbortSignal',
    'URL',
    'URLSearchParams',
    'window',
    'document',
    'navigator',
    'location',
    'localStorage',
    'addEventListener',
    'removeEventListener',
    'FormData',
    'SpeechSynthesisUtterance',
    'Request',
    'Response',
    'Deno',
  ].map((name) => [name, 'readonly']),
);
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.expo/**',
      '**/next-env.d.ts',
      '**/expo-env.d.ts',
      'artifacts/**',
      '**/*.d.mts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals },
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
);
