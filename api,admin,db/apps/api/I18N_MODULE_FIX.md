# i18n Module ESM Fix

## Issue
The original i18n implementation was causing a runtime error in Kubernetes:
```
SyntaxError: The requested module './index.js' does not provide an export named 'Language'
```

## Root Cause
When using TypeScript with `verbatimModuleSyntax: true` in `tsconfig.json`, type exports must be explicitly marked with the `type` keyword to ensure proper ESM compatibility. The original implementation mixed type and value exports in a way that wasn't compatible with Node.js ESM loader.

## Solution
Separated the i18n module into distinct files for better ESM compatibility:

### File Structure
```
src/i18n/
├── index.ts          # Public exports (barrel file)
├── types.ts          # Type definitions
├── config.ts         # Configuration and runtime values
├── translator.ts     # Translation utilities
└── translations/
    ├── uz.ts         # Uzbek translations
    ├── en.ts         # English translations
    └── ru.ts         # Russian translations
```

### Changes Made

#### 1. Created `types.ts` - Type Definitions Only
```typescript
export type Language = 'uz' | 'en' | 'ru';
```

#### 2. Created `config.ts` - Runtime Values
```typescript
import type { Language } from './types.js';

export const DEFAULT_LANGUAGE: Language = 'uz';
export const SUPPORTED_LANGUAGES: Language[] = ['uz', 'en', 'ru'];
export const getLanguageFromHeaders = (acceptLanguage?: string): Language => {
  // Implementation
};
```

#### 3. Updated `index.ts` - Barrel File with Explicit Type Exports
```typescript
export type { Language } from './types.js';
export { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, getLanguageFromHeaders } from './config.js';
```

#### 4. Updated `translator.ts` - Proper Import Separation
```typescript
import type { Language } from './types.js';  // Type import
import { DEFAULT_LANGUAGE } from './config.js';  // Value import
```

#### 5. Updated Middleware Files
- `errorHandler.ts`: Changed to import from `config.js`
- `validator.ts`: Changed to import from `config.js`

## Why This Fix Works

1. **Explicit Type Exports**: Using `export type { Language }` explicitly marks it as a type-only export
2. **Separation of Concerns**: Types in `types.ts`, runtime values in `config.ts`
3. **Proper Import Syntax**: Using `import type` for types ensures they're erased at runtime
4. **ESM Compatibility**: Follows Node.js ESM best practices with proper file extensions

## Verification

After deployment, the module will:
- ✅ Load without syntax errors
- ✅ Properly resolve all imports
- ✅ Maintain full i18n functionality
- ✅ Work with TypeScript strict mode
- ✅ Be compatible with Node.js ESM loader

## Usage (Unchanged)

The public API remains the same:

```typescript
// Import Language type
import type { Language } from '../i18n/index.js';

// Import runtime values
import { DEFAULT_LANGUAGE, getLanguageFromHeaders } from '../i18n/index.js';

// Import translator
import { t, getValidationError } from '../i18n/translator.js';
```

Or import directly from sub-modules:

```typescript
import type { Language } from '../i18n/types.js';
import { DEFAULT_LANGUAGE } from '../i18n/config.js';
import { t } from '../i18n/translator.js';
```

## TypeScript Configuration Context

This fix is necessary because of the following tsconfig settings:
- `"module": "nodenext"` - Uses Node.js native ESM
- `"verbatimModuleSyntax": true` - Requires explicit type export syntax
- `"isolatedModules": true` - Ensures each file can be compiled independently

## Testing

To test the fix locally:
```bash
# Build the TypeScript
cd api,admin,db/apps/api
npm run build  # or tsc

# Run the compiled JS
node dist/index.js

# Verify no module resolution errors
```

In Kubernetes:
```bash
kubectl logs -f <pod-name> -n test3
```

Should now start successfully without the `SyntaxError`.

