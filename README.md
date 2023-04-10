# Auri

Organize package changes and releases.

```
npm i -D auri
yarn add -D auri
pnpm add -D auri
```

Run commands:

```
npx auri
pnpm exec auri
yarn auri
```

## Set up

1. Create `.auri` directory
2. Create `config.json` inside `.auri`
3. Generate a Github personal access token with the following scopes: **`repo`, `user:email`**
4. Store the token as `AURI_GITHUB_TOKEN` in Github actions secrets
5. Add `auri.publish` script to each package's package.json - this will be the command Auri will use to publish
6. Make sure "Read and write permission" is enabled in repository settings > Actions > General > Workflow permissions
7. Add `auri.deploy` script to your documentation sites

## Config

### `ignore`

`string[]`. Paths to ignore when searching for packages. `node_modules` and `.git` already included.

```json
{
	"ignore": ["node_modules"]
}
```

### `repository`

**Required** `string`. Full Github repository url.

```json
{
	"repository": "https://github.com/pilcrowOnPaper/auri"
}
```

## Project `package.json`

### `auri.format`

```json
{
	"scripts": {
		"auri.format": "pnpm prettier -w ."
	}
}
```

### `auri.publish_setup`

This will be called before publishing packages.

```json
{
	"scripts": {
		"auri.publish_setup": "pnpm install-some-dependencies"
	}
}
```

## Package `package.json`

### `auri.publish`

```json
{
	"scripts": {
		"auri.publish": "pnpm i && pnpm build && pnpm publish"
	}
}
```

## Documentation `package.json`

### `auri.deploy`

```json
{
	"scripts": {
		"auri.deploy": "pnpm deploy"
	}
}
```

## Commands

### `auri add`

Creates a new changeset in `.auri` directory. A changeset is a markdown file:

```md
---
package: "" # package name (package.json)
type: "" # "major", "minor", "patch" (semver)
---
```

### `auri prepare`

1. Generate changelogs based on changesets
2. Update package.json
3. Delete all changesets
4. Commits all code to `auri` branch
5. Creates new PR `auri` => `main`

### `auri publish`

Compares version of package.json and one in the NPM registry, and runs `auri.publish` if it differs.

### `auri list`

Lists all packages handled by Auri.
