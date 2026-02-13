# Quick Start: Publishing to NPM

## First Time Setup (One-time)

```bash
# 1. Login to npm
npm login

# 2. Verify login
npm whoami
```

## Publishing a New Version

```bash
# Option A: Auto (Recommended) - Tests & builds automatically
npm publish --access public

# Option B: Manual control
npm run test      # Run tests
npm run compile   # Build
npm publish --access public
```

## Updating Version

```bash
# Patch (0.11.0 → 0.11.1) - Bug fixes
npm version patch

# Minor (0.11.0 → 0.12.0) - New features
npm version minor

# Major (0.11.0 → 1.0.0) - Breaking changes
npm version major

# Then publish
npm publish --access public

# Don't forget to push tags
git push && git push --tags
```

## Quick Checks

```bash
# What will be published?
npm pack --dry-run

# Test the package locally
npm pack
npm install ./brawcode-jotai-tanstack-query-0.11.0.tgz
```

For detailed instructions, see [PUBLISHING.md](./PUBLISHING.md)
