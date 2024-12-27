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

Auri does not work on certain repository setups:

- Your repository is hosted on GitHub.
- Single monolith repository (no monorepos).
- The package can be built and published with: `npm run build && npm publish`.
- The package's `package.json` is in the repository root.
- Pull requests are squashed and merge.

In addition, it's built with a few opinions in mind:

- Only supports version formats like 2.0.0 for normal releases and formats like 2.0.0-next.1 for prereleases (it must be next).
- Prereleases are tagged as 'next' on NPM.
- Non-latest, non-next releases (e.g. 1.8.0 when latest is 2.3.0) will be tagged as 'legacy' on NPM.

## Setup

Install Auri via NPM and update your repository.

### 1. Generate access tokens

You'll will need an NPM automation access token (classic) and a GitHub token with the following permissions:

- `repo`
- `user:email`

### 2. Create GitHub workflow

Create a GitHub workflow that runs on every push. The NPM token should be named `NODE_AUTH_TOKEN` and the GitHub token as `AURI_NPM_TOKEN`.

It is crucial that you setup `actions/checkout@v3` with `github.ref`. Auri expects the current branch to be the target branch.

```yaml
# .github/workflows/publish.yaml
name: "Publish package"
on: [push]

env:
  AURI_GITHUB_TOKEN: ${{secrets.AURI_GITHUB_TOKEN}}
  AURI_NPM_TOKEN: ${{secrets.AURI_NPM_TOKEN}}

jobs:
  publish-package:
    name: Publish package with Auri
    runs-on: ubuntu-latest
    # TODO: Update repository name.
    if: github.repository == pilcrowonpaper/auri && github.ref == 'refs/heads/main'
    permissions:
      id-token: write
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
      - name: Publish package and release
        run: npm run auri publish
```

### 3. Configure permissions

Go to your repository's settings, and go to "Code and automation" > "Actions" > "General." Go to "Workflow permissions" and enable:

- "Read and write permissions"
- "Allow GitHub Actions to create and approve pull requests"

If your GitHub workflow have `permissions` defined, make sure `content` is set to `write`:

```yaml
permissions:
  contents: write
```

## Instructions

When you're ready to publish your package, run `auri generate` on your local machine. This will create a `.COMMITS` file with a list of commits since the last release (the version in package.json). Commits starting with `docs:`, `style:`, or `test:` will be ignored. This will also create a `.RELEASE.md`. Using `.COMMITS` as a reference, write your changelog in `.RELEASE.md`. Update the version field in your package.json and commit the change.

With the GitHub action, Auri will build and publish your package to NPM and use the `.RELEASE.md` to publish a new GitHub release.
