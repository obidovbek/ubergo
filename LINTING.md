# ESLint and Prettier Configuration

This monorepo uses shared ESLint and Prettier configurations across all apps.

## 📁 Structure

```
UberGo/
├── eslint.config.js       # Root ESLint configuration (flat config format)
├── .prettierrc            # Root Prettier configuration
├── .prettierignore        # Root Prettier ignore patterns
├── package.json           # Root dependencies with "type": "module"
└── apps/
    ├── admin/             # React app (Vite) - no local configs
    ├── api/               # Node.js API
    ├── driver-app/        # React Native (Expo)
    └── user-app/          # React Native (Expo)
```

## 🔧 Configuration Details

### ESLint Configuration
The root `eslint.config.js` uses the modern flat config format and provides:
- TypeScript support via `@typescript-eslint`
- React support for `admin` app
- React/React Native support for `driver-app` and `user-app`
- Node.js support for `api` app
- Prettier integration

### Prettier Configuration
The root `.prettierrc` enforces:
- Single quotes
- 2 space indentation
- 80 character line width
- Semicolons
- ES5 trailing commas
- LF line endings

## 🚀 Usage

### From Root Directory

```bash
# Lint all apps
npm run lint

# Auto-fix all linting issues
npm run lint:fix

# Format all files
npm run format

# Check formatting (no changes)
npm run format:check

# Lint specific app
npm run lint:admin
npm run lint:api
npm run lint:driver
npm run lint:user
```

### From Individual App Directories

```bash
cd apps/admin  # or api, driver-app, user-app

# Lint the app
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## 📦 Installed Packages (Root Level)

- `eslint` - JavaScript/TypeScript linter
- `prettier` - Code formatter
- `@typescript-eslint/eslint-plugin` - TypeScript rules for ESLint
- `@typescript-eslint/parser` - TypeScript parser for ESLint
- `eslint-config-prettier` - Disables ESLint rules that conflict with Prettier
- `eslint-plugin-prettier` - Runs Prettier as an ESLint rule
- `eslint-plugin-react` - React-specific linting rules
- `eslint-plugin-react-hooks` - React Hooks linting rules

## 📝 Editor Integration

### VS Code

Install these extensions:
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

Add to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": [
    { "mode": "auto" }
  ]
}
```

## 🎯 App-Specific Rules

### Admin (React + Vite)
- Uses React 19
- No need for `React` import in JSX files
- PropTypes disabled (using TypeScript)

### API (Node.js)
- Stricter `any` type checking
- Node.js environment enabled

### Driver-App & User-App (React Native + Expo)
- React Native environment
- No need for `React` import in JSX files
- Uses Expo-specific configurations

## 🔄 Updating Configuration

To modify rules for all apps:
1. Edit `eslint.config.js` in the root directory (uses ESLint 9 flat config format)
2. Run `npm run lint` to test changes

To modify rules for a specific app:
1. Edit the corresponding configuration object in root `eslint.config.js`
2. Match the `files` pattern to target specific apps (e.g., `'apps/admin/**/*.{ts,tsx}'`)

## 🐛 Troubleshooting

### ESLint not working
```bash
# Clear ESLint cache
npx eslint --clear-cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Prettier conflicts with ESLint
- The configuration already includes `eslint-config-prettier` to prevent conflicts
- If you see conflicts, ensure Prettier is running through ESLint

### Different formatting in different apps
- All apps should use the root `.prettierrc`
- Remove any local `.prettierrc` files
- Run `npm run format` from root to format all files consistently

## 📚 Resources

- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [Expo ESLint Guide](https://docs.expo.dev/guides/using-eslint/)

