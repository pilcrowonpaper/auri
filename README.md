# Template for creating TypeScript packages

Includes:

- TypeScript (duh)
- PNPM
- Prettier
- Basic NPM publish Github workflow

## Getting started

1. Update package.json, specifically: `name`, `description`, `repository.url`, `author`
2. Check the license - uses MIT as default
3. Install dependencies using `pnpm install`
4. Add NPM token as `NPM_TOKEN` Github environment variable 

## Commands

### Build

Builds and creates a `dist` directory.

```
pnpm build
```

### Test

Executes `test/index.ts`.

```
pnpm test
```

### Release

Releases package to NPM.

```
pnpm release
```