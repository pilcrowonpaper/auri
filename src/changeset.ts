import fs from "fs";
import { customAlphabet } from "nanoid";
import { CELA_DIR } from "./constant.js";
import path from "path";

export const addChangeset = async () => {
	const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
	const generateChangesetId = customAlphabet(ALPHABET, 8);

	if (!fs.existsSync(path.resolve(CELA_DIR))) {
		fs.mkdirSync(path.resolve(CELA_DIR));
	}

	const changesetTemplate = `---
package: "" # package name
type: "" # "major", "minor", "patch"
---`;

	fs.writeFileSync(
		path.resolve(`.cela/$${generateChangesetId()}.md`),
		changesetTemplate
	);
};
