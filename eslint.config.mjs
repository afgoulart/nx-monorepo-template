import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vite.config.*.timestamp*', '**/vitest.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
    rules: {
      // Enforce isolation between workflows and the shared/apps layering.
      //
      // Constraints are AND-ed, so an import must satisfy every matching
      // sourceTag rule. That means apps/workflow-a (scope:workflow-a) can
      // never import apps/workflow-b (scope:workflow-b): the only allowed way
      // to share code is through libs tagged scope:shared.
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: 'scope:workflow-a',
              onlyDependOnLibsWithTags: ['scope:workflow-a', 'scope:shared'],
            },
            {
              sourceTag: 'scope:workflow-b',
              onlyDependOnLibsWithTags: ['scope:workflow-b', 'scope:shared'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              // Apps are deployables: they may consume libs but never another app.
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:lib'],
            },
            {
              sourceTag: 'type:lib',
              onlyDependOnLibsWithTags: ['type:lib'],
            },
          ],
        },
      ],
    },
  },
];
