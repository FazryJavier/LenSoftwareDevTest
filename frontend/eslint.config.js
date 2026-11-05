import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'eslint.config.js'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Call the API through src/api/client.ts.' },
        { name: 'alert', message: 'Use Dialog or Toast.' },
        { name: 'confirm', message: 'Use Dialog.' },
        { name: 'prompt', message: 'Use Dialog.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['maplibre-gl', 'maplibre-gl/*', '@vis.gl/react-maplibre'],
              message: 'Only src/features/entities/map/ may import MapLibre.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/entities/map/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['src/api/client.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
);
