import boundaries from 'eslint-plugin-boundaries';
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import tailwindcss from 'eslint-plugin-tailwindcss';
import unusedImports from 'eslint-plugin-unused-imports';

// micromatch needs the route-group and dynamic segments escaped.
const DASHBOARD_MODULES = 'app/\\(modules\\)/dashboard/\\(modules\\)';

// The same folder as an ESLint `files` glob (minimatch).
const DASHBOARD_MODULES_GLOB = 'app/(modules)/dashboard/(modules)';

const SHARED = [
  'assets',
  'components',
  'hooks',
  'copy',
  'lib',
  'providers',
  'utils',
];

// Which other dashboard modules each module may import. A new module must be
// registered here, or every file in it fails lint.
const MODULE_DEPENDENCIES = {
  'meal-plans': [
    'meals',
    '_resource-table',
    '_nutrition',
    '_comparison',
    '_body-metrics',
    '_user',
  ],
  meals: ['ingredients', '_resource-table', '_nutrition', '_comparison'],
  ingredients: ['_resource-table', '_comparison'],
  _nutrition: ['ingredients'],
  _comparison: ['_resource-table', '_nutrition', '_user'],
  profile: ['_user', '_body-metrics'],
  '_body-metrics': ['_user'],
  '_draft-meal-plan': [
    'meal-plans',
    'meals',
    'ingredients',
    '_nutrition',
    '_body-metrics',
    '_resource-table',
    '_user',
  ],
  '_week-plan': [
    '_draft-meal-plan',
    'meal-plans',
    'meals',
    'ingredients',
    '_nutrition',
    '_user',
  ],
  _user: [],
  '_resource-table': [],
};

const eslintConfig = [
  {
    ignores: [
      '**/node_modules/**',
      '.next/**',
      'out/**',
      '**/*.d.ts',
      'app/components/ui/**',
      'app/hooks/use-mobile.tsx',
      'app/hooks/use-toast.ts',
      'app/lib/utils.ts',
    ],
  },
  ...coreWebVitals,
  ...nextTypescript,
  ...[tailwindcss.configs['flat/recommended']].flat(),
  prettierRecommended,
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    rules: {
      'sort-imports': ['error'],

      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: true,
          },
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
          custom: {
            regex: '^E[A-Z]',
            match: true,
          },
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE'],
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
          custom: {
            regex: '^T[A-Z]',
            match: true,
          },
        },
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
        },
        {
          selector: 'import',
          format: null,
        },
        {
          selector: 'objectLiteralProperty',
          format: null,
        },
      ],

      'tailwindcss/no-unnecessary-arbitrary-value': 'error',
      'tailwindcss/enforces-shorthand': 'error',
      'tailwindcss/classnames-order': 'error',
      'tailwindcss/no-custom-classname': ['off'],

      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
  // Module boundaries, see docs/adr/0003-module-boundaries-enforced-by-eslint.md.
  {
    files: ['app/**'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/include': ['app/**'],
      'boundaries/elements': [
        {
          type: 'module',
          pattern: `${DASHBOARD_MODULES}/{${Object.keys(MODULE_DEPENDENCIES).join(',')}}`,
          capture: ['name'],
          partialMatch: false,
        },
        {
          type: 'shared',
          pattern: `app/{${SHARED.join(',')}}`,
          partialMatch: false,
        },
        { type: 'route', pattern: 'app', partialMatch: false },
      ],
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            {
              from: { element: { type: 'route' } },
              allow: {
                to: { element: { type: ['shared', 'route', 'module'] } },
              },
            },
            ...Object.entries(MODULE_DEPENDENCIES).map(([name, deps]) => ({
              from: { element: { type: 'module', captured: { name } } },
              allow: {
                to: [
                  { element: { type: 'shared' } },
                  {
                    element: {
                      type: 'module',
                      captured: { name: [name, ...deps] },
                    },
                  },
                ],
              },
            })),
          ],
        },
      ],
    },
  },
  // The `app` route pattern would swallow an unregistered module, so fail
  // every file of one explicitly.
  {
    files: [`${DASHBOARD_MODULES_GLOB}/*/**`],
    ignores: Object.keys(MODULE_DEPENDENCIES).map(
      (name) => `${DASHBOARD_MODULES_GLOB}/${name}/**`,
    ),
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message:
            'Unregistered dashboard module: add it to MODULE_DEPENDENCIES in eslint.config.mjs.',
        },
      ],
    },
  },
];

export default eslintConfig;
