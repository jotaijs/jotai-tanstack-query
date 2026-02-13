# NPM Publishing Instructions

This document provides instructions for publishing `@brawcode/jotai-tanstack-query` to npm.

## Prerequisites

Before publishing, ensure you have:

1. **npm account**: Create an account at [npmjs.com](https://www.npmjs.com/signup) if you don't have one
2. **npm CLI authentication**: Log in to npm from your terminal
3. **Publishing access**: Ensure you have permission to publish under the `@brawcode` scope

## Setup Instructions

### 1. Authenticate with npm

```bash
npm login
```

Follow the prompts to enter your:
- Username
- Password
- Email (this will be public)
- One-time password (if you have 2FA enabled)

### 2. Verify your authentication

```bash
npm whoami
```

This should display your npm username.

### 3. Check scope access (for scoped packages)

For publishing under the `@brawcode` scope, ensure you have access:

```bash
npm access ls-packages @brawcode
```

If this is your first time publishing under this scope, npm will automatically create it when you publish.

## Publishing Process

### Option 1: Automatic Publishing (Recommended)

The package is configured with a `prepublishOnly` script that automatically:
- Runs all tests (eslint, type checking, unit tests)
- Builds the distribution files

Simply run:

```bash
npm publish --access public
```

**Note**: The `--access public` flag is required for scoped packages to make them publicly accessible.

### Option 2: Manual Publishing

If you prefer to run steps manually:

```bash
# 1. Install dependencies
pnpm install

# 2. Run tests
npm run test

# 3. Build the package
npm run compile

# 4. Verify package contents (dry run)
npm pack --dry-run

# 5. Publish to npm
npm publish --access public
```

## Pre-publish Verification

Before publishing, verify the package contents:

```bash
# See what files will be included in the package
npm pack --dry-run
```

The package should include:
- ✅ `dist/` folder with compiled JavaScript and TypeScript definitions
- ✅ `src/` folder with source TypeScript files
- ✅ `LICENSE` file
- ✅ `README.md` file
- ✅ `package.json` file
- ❌ `__tests__/` folder (excluded)
- ❌ `examples/` folder (excluded)
- ❌ Configuration files (excluded)

## Version Management

Before publishing a new version, update the version number:

```bash
# For patch releases (bug fixes): 0.11.0 -> 0.11.1
npm version patch

# For minor releases (new features): 0.11.0 -> 0.12.0
npm version minor

# For major releases (breaking changes): 0.11.0 -> 1.0.0
npm version major
```

This will:
1. Update the version in `package.json`
2. Create a git commit with the version change
3. Create a git tag

Then push the changes:

```bash
git push && git push --tags
```

## Post-publish Verification

After publishing, verify the package:

1. **Check on npm website**: Visit `https://www.npmjs.com/package/@brawcode/jotai-tanstack-query`

2. **Test installation in a new project**:
   ```bash
   mkdir test-install
   cd test-install
   npm init -y
   npm install @brawcode/jotai-tanstack-query
   ```

3. **Verify the exports work**:
   ```javascript
   // Create test.mjs
   import { atomWithQuery, QueryClientAtomProvider } from '@brawcode/jotai-tanstack-query';
   console.log('Exports loaded successfully!');
   ```
   
   ```bash
   node test.mjs
   ```

## Troubleshooting

### Issue: "You do not have permission to publish"

**Solution**: 
- Verify you're logged in: `npm whoami`
- For scoped packages, ensure you use: `npm publish --access public`

### Issue: "Version already exists"

**Solution**: 
- Update the version number in `package.json` or use `npm version`
- You cannot republish the same version

### Issue: "prepublishOnly script failed"

**Solution**: 
- Fix any test failures before publishing
- Ensure all dependencies are installed: `pnpm install`
- Run `npm run test` to see specific errors

### Issue: "ENOENT: no such file or directory, dist/"

**Solution**: 
- Run `npm run compile` to build the distribution files
- The `prepublishOnly` script should handle this automatically

## Package Configuration Summary

The package is configured with:

- **Name**: `@brawcode/jotai-tanstack-query` (scoped under @brawcode)
- **License**: MIT
- **Repository**: https://github.com/Gibbo3771/jotai-tanstack-query
- **Main exports**: 
  - `@brawcode/jotai-tanstack-query` - Main entry point
  - `@brawcode/jotai-tanstack-query/react` - React-specific exports

## Additional Resources

- [npm documentation on publishing](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [npm scoped packages documentation](https://docs.npmjs.com/cli/v9/using-npm/scope)
- [Semantic versioning guide](https://semver.org/)
