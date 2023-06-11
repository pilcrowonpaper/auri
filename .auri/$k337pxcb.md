---
package: "auri" # package name
type: "minor" # "major", "minor", "patch"
pr: 49
---

[Breaking] Remove `auri.publish`
    - Replaced with `auri.build`
    - All packages are published using `pnpm publish`