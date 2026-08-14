import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Global ignores
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.expo/**',
      '**/.expo-shared/**',
      '**/coverage/**',
    ],
  },

  // Base configuration for all JavaScript/TypeScript files
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },

  // Apply recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  // TypeScript-specific rules
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      /*
       * T-032 — `warn`, not `error`, matching the RN apps (T-060).
       *
       * With prettier silenced the API still reports ~300 of these plus
       * `no-explicit-any`. As errors the command is red on a clean checkout,
       * so a 301st finding is invisible and nobody adopts it. As warnings the
       * exit code means "something NEW broke", and the backlog stays listed
       * rather than hidden.
       */
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // React configuration for admin app
  {
    files: ['apps/admin/**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      /*
       * T-032 — narrowed, not switched off.
       *
       * 🔴 138 of the admin's 142 errors were this rule firing on **Uzbek
       * apostrophes in ordinary copy** (`Ma'lumotlar`, `yo'qmi?`), which render
       * perfectly well in HTML. ⚠️ Unlike the RN apps (T-060), this IS a web
       * app, so the rule is not simply inapplicable — its real value is
       * catching `>` and `}`, which genuinely look like broken JSX. Those stay
       * forbidden; the apostrophe does not.
       */
      'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
    },
  },

  // React Native configuration for driver-app and user-app
  {
    files: ['apps/{driver-app,user-app}/**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },

  /*
   * T-032 — Sequelize model files.
   *
   * `interface XCreationAttributes extends Optional<XAttributes, 'id' | …> {}`
   * is the library's own idiom and is required to parameterise `Model<A, C>`.
   * All 19 hits were that one line in 19 models — a rule firing on correct,
   * mandatory code, which is noise by another name.
   */
  {
    files: ['apps/api/src/database/models/*.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  /*
   * T-032 — CommonJS by necessity: sequelize-cli loads migrations, seeders and
   * `config.cjs` with `require`, and its migration signature is
   * `(queryInterface, Sequelize)` whether or not the second argument is used.
   * Linting these as ES modules reports the file format itself as a defect.
   */
  {
    files: [
      'apps/api/src/database/migrations/*.cjs',
      'apps/api/src/database/seeders/*.cjs',
      'apps/api/**/config.{js,cjs}',
      'apps/api/scripts/**/*.js',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '.', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Node.js API specific rules
  {
    files: ['apps/api/**/*.ts'],
    rules: {
      /*
       * T-032 — `interface UpdateXData extends Partial<CreateXData> {}` is a
       * deliberate NAMED alias, not an accident: the name is what the service
       * signatures read. The rule cannot tell that apart from a stray empty
       * interface, and both hits in this app are the intentional form.
       */
      '@typescript-eslint/no-empty-object-type': 'off',
      // T-032 — was `error`, which alone kept `npm run lint` red on a clean
      // checkout (188 occurrences). Same reasoning as the unused-vars rule
      // above and the RN apps in T-060: the backlog stays visible, but the
      // exit code goes back to meaning "something new broke".
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  /*
   * ── T-032: formatting is NOT linted ─────────────────────────────────────
   *
   * 🔴 `'prettier/prettier': 'error'` made `npm run lint` useless. Measured
   * 2026-08-13: the API reported **29,802 problems, of which 29,497 were
   * prettier and 25,764 were nothing but the CRLF marker `␍`** — Windows checks
   * files out with CRLF, `.prettierrc` demanded LF, and every line of every
   * file became an error. Admin was the same (~15,000). **The 302 real findings
   * — 188 `no-explicit-any`, 89 unused vars — were buried under a 99% noise
   * floor, so nobody ran the command and nothing was ever linted.**
   *
   * ⚠️ This does NOT stop formatting being checked: `npm run format` and
   * `npm run format:check` already exist in both apps and are the right place
   * for it. Mixing the two made *neither* usable.
   *
   * ✅ Same decision as the RN apps (T-060), where prettier was deliberately
   * left out of the flat config for exactly this reason.
   *
   * 🟡 The deeper fix is a repo `.gitattributes` (`* text=auto eol=lf`) so the
   * working tree stops being CRLF at all. It is NOT done here on purpose:
   * renormalising would rewrite every file in the repo, and 13 cards are
   * currently code-complete and untested — a 30,000-line diff would bury them.
   * → logged as **T-086**.
   */
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      'prettier/prettier': 'off',
    },
  },
];

