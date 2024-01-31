# auri

## 0.9.2

### Patch changes

- Fix changelog format ([#77](https://github.com/pilcrowOnPaper/auri/pull/77))

## 0.9.1

### Patch changes

- Fix GitHub releases

## 0.9.0

### Minor changes

- Breaking: Generate GitHub releases on publish ([#73](https://github.com/pilcrowOnPaper/auri/pull/73))

## 0.8.1

### Patch changes

- Add PR numbers to changelogs ([#68](https://github.com/pilcrowOnPaper/auri/pull/68))
- Fix Git bug ([#69](https://github.com/pilcrowOnPaper/auri/pull/69))

## 0.8.0

### Minor changes

- Breaking: Reset project to only support monolith repositories

## 0.7.4

### Patch changes

- [#64](https://github.com/pilcrowOnPaper/auri/pull/64) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `auri.publish_setup` script not running

## 0.7.3

### Patch changes

- [#62](https://github.com/pilcrowOnPaper/auri/pull/62) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `auri.format` not getting called

## 0.7.2

### Patch changes

- [#59](https://github.com/pilcrowOnPaper/auri/pull/59) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix published version detection

## 0.7.1

### Patch changes

- [#56](https://github.com/pilcrowOnPaper/auri/pull/56) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `publish` command

## 0.7.0

### Minor changes

- [#49](https://github.com/pilcrowOnPaper/auri/pull/49) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : [Breaking] Remove `auri.publish`

  - Replaced with `auri.build`

  - All packages are published using `pnpm publish`

### Patch changes

- [#53](https://github.com/pilcrowOnPaper/auri/pull/53) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `pull` attributes not being read

- [#55](https://github.com/pilcrowOnPaper/auri/pull/55) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix Github request error

## 0.7.0-beta.0

### Minor changes

- [#49](https://github.com/pilcrowOnPaper/auri/pull/49) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : [Breaking] Remove `auri.publish`

  - Replaced with `auri.build`

  - All packages are published using `pnpm publish`

## 0.6.0

### Minor changes

- [#46](https://github.com/pilcrowOnPaper/auri/pull/46) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add release config

  - Support beta releases

- [#46](https://github.com/pilcrowOnPaper/auri/pull/46) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `pull` as an optional changeset property

## 0.6.0-beta.2

### Minor changes

- [#44](https://github.com/pilcrowOnPaper/auri/pull/44) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `pull` as an optional changeset property

## 0.6.0-beta.1

### Patch changes

- [#41](https://github.com/pilcrowOnPaper/auri/pull/41) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `prepare` command erroring if release config was missing

- [#43](https://github.com/pilcrowOnPaper/auri/pull/43) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `prepare` script generating wrong version

- [#41](https://github.com/pilcrowOnPaper/auri/pull/41) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update readme

## 0.6.0-beta.0

### Minor changes

- [#37](https://github.com/pilcrowOnPaper/auri/pull/37) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add release config

  - Support beta releases

## 0.5.4

### Patch changes

- [#35](https://github.com/pilcrowOnPaper/auri/pull/35) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Properly format error message and exit

## 0.5.3

### Patch changes

- [#33](https://github.com/pilcrowOnPaper/auri/pull/33) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Write stdout to console after running command

## 0.5.2

### Patch changes

- [#31](https://github.com/pilcrowOnPaper/auri/pull/31) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix `list` command

## 0.5.1

### Patch changes

- [#29](https://github.com/pilcrowOnPaper/auri/pull/29) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix deploy command

## 0.5.0

### Minor changes

- [#27](https://github.com/pilcrowOnPaper/auri/pull/27) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : [Breaking] Replace `scripts.format` and `scripts.publish_setup` with `scripts["auri.format"]` and `scripts["auri.publish_setup"]` inside package.json

- [#27](https://github.com/pilcrowOnPaper/auri/pull/27) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `auri.deploy`

## 0.4.1

### Patch changes

- By [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix publish script not working for nested packages

## 0.4.0

### Minor changes

- By [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `list` command and properly handle `!` ignore items

## 0.3.3

### Patch changes

- By [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `ignore` config

## 0.3.2

### Patch changes

- By [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix publish script running publish command twice

## 0.3.1

### Patch changes

- By [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix publish command

## 0.3.0

### Minor changes

- By [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix issue with file system API

## 0.2.6

### Patch changes

- By [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Improve debug mode

## 0.2.5

### Patch changes

- By [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : more debug

## 0.2.4

### Patch changes

- By [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add `scripts.publish_setup`

## 0.2.3

### Patch changes

- By [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add debug mode

## 0.2.2

### Patch changes

- By [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Add instructions on repository settings

## 0.2.1

### Patch changes

- [#14](https://github.com/pilcrowOnPaper/auri/pull/14) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Better error messages

## 0.2.0

### Minor changes

- [#12](https://github.com/pilcrowOnPaper/auri/pull/12) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Don't publish if package doesn't exist on NPM

### Patch changes

- [#12](https://github.com/pilcrowOnPaper/auri/pull/12) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Link to author in changelog

## 0.1.0

### Minor changes

- By @pilcrowOnPaper : publish!
