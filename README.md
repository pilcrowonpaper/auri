# Auri

Organize package changes and releases in monolith repositories.

```
npm i -D auri
yarn add -D auri
pnpm add -D auri
```

Run commands:

```
npx auri
pnpm auri
yarn auri
```

## Prerequisites

Auri is intentionally opinionated and intended for certain repositories:

- Single monolith repository
- Uses prettier
- Package be built and published with: `npm run build && npm publish`
- The package's `package.json` is in the repository root
- No monorepos
- No pre-releases for patch/minor versions

## Setup

Install Auri via NPM and update your repository.

### 1. Generate access tokens

You'll will need an NPM automation access token (classic) and a GitHub token with the following permissions:

- `repo`
- `user:email`

### 2. Create GitHub workflow

Create a GitHub workflow that runs on every push. The NPM token should be named `NODE_AUTH_TOKEN` and the GitHub token as `AURI_GITHUB_TOKEN`.

```yaml
# .github/workflows/publish.yaml
name: "Publish package"
on: [push]

env:
  AURI_GITHUB_TOKEN: ${{secrets.AURI_GITHUB_TOKEN}}
  NODE_AUTH_TOKEN: ${{secrets.NODE_AUTH_TOKEN}}

jobs:
  publish-package:
    name: Publish package with Auri
    runs-on: ubuntu-latest
    steps:
      - name: Setup actions
        uses: actions/checkout@v3
        with:
          ref: ${{ github.ref }}
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20
          registry-url: "https://registry.npmjs.org/"
          cache: "npm"
      - name: Prepare release
        run: npm run auri prepare ${{ github.ref_name }}
      - name: Publish package
        run: npm run auri publish ${{ github.ref_name }}
```

## Instructions

### Basics

When you create a new pull request, run `pnpm auri add` to create a new changeset. Use `add patch` for patch changes and `add minor` for minor changes.

```
npx auri patch
```

This will create a new markdown file inside the `.changesets` directory. Write a concise summary of your changes. A single PR may include multiple (or zero) changesets. Each changeset might look something like this:

```
Fix: Stop deleting operating system at midnight
```

When you merge this to `main` or `master` branch, Auri will detect your changes and create a new "Release request" as a pull request. When you merge this request, your `package.json` and `CHANGELOG.md` will be updated, and new version of your package will be published to NPM.

### Versioned branches

Auri works by creating dedicated branches for each major version. For example, `main` will be for v3, `v2` for v2, and `v4` for experimental v4. This means you can maintain multiple major versions at once. Versioned branches be in the format of `v<integer>`.

### Next versions

Whenever you create a versioned branch for a major version once above the version in `main`, it will publish packages with a "next" tag. These versions are your betas/alphas/prereleases and looks like `3.0.0-beta.16`. When working with "next", all your changesets must use `next`:

```
npx auri next
```

Once you merge the branch into `main`, Auri will automatically release a stable version. If you want to keep working on the previous version, make sure you create a versioned branch for it before merging.
