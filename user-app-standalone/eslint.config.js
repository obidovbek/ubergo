/**
 * ESLint flat config — T-060 / T-032.
 *
 * Why this file exists: both RN apps carry eslint **9**, which dropped
 * `.eslintrc` and the `--ext` flag, and neither app had a flat config. So
 * `npm run lint` failed instantly with "couldn't find an eslint.config file"
 * — meaning **nothing in either app had been linted for as long as that was
 * true**, which is where most of the recent work went.
 *
 * ⚠️ Deliberately thin. `eslint-config-expo/flat` is the config Expo ships for
 * exactly this stack; re-deriving a rule set by hand would be inventing a house
 * style nobody agreed to. Local rules below are only the ones that earn a
 * place.
 *
 * 🔴 **Formatting is NOT linted here.** The API's ESLint run reports ~28,000
 * `␍` CRLF/prettier findings on Windows, which drown the few hundred real ones
 * (T-032). Adding prettier to these apps would reproduce that noise and make
 * the command useless again on day one. Line endings are a separate decision
 * (`.gitattributes`), not a lint rule.
 */

const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'android/**',
      'ios/**',
      'dist/**',
      'build/**',
      'babel.config.js',
      'metro.config.js',
      'eslint.config.js',
    ],
  },
  {
    /*
     * Node-side scripts, not app code. Without this they are linted with the
     * app's browser/RN globals and `__dirname` reads as undefined — a config
     * gap reported as a code error, which is exactly the kind of false finding
     * that gets a whole lint run ignored.
     */
    files: ['scripts/**/*.js', '*.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      /*
       * Unused code is reported, but an underscore prefix opts out — the
       * codebase already uses `_deps` / `_error` to mean "deliberately unused",
       * and flagging those would train people to ignore the whole rule.
       */
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // `any` is a warning, not an error: there is a real backlog of it and a
      // failing lint run is a lint run nobody executes.
      '@typescript-eslint/no-explicit-any': 'warn',

      /*
       * 🔴 OFF on purpose — it is a WEB rule and this is React Native.
       *
       * It wants `'` written as `&apos;` because in HTML a bare quote can be
       * ambiguous. There is no HTML here: `<Text>` renders its children
       * literally, so `&apos;` would show up on screen as the five characters
       * "&apos;". Every one of its 15 hits in the driver app is an **Uzbek
       * apostrophe** in real copy (`ro'yxatdan`, `o'tgan`, `"Keyingi"`), so
       * "fixing" them would corrupt the visible text in the product's main
       * language.
       */
      'react/no-unescaped-entities': 'off',
    },
  },
];
