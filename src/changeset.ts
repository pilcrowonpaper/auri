import fs from "fs";
import { customAlphabet } from "nanoid";
import { AURI_DIR } from "./constant.js";
import path from "path";
import { error } from "./error.js";

export const addChangeset = async () => {
	const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
	const generateChangesetId = customAlphabet(ALPHABET, 8);

	if (!fs.existsSync(path.join(process.cwd(), AURI_DIR)))
		return error(`"${AURI_DIR}" directory does not exist`);

	const changesetTemplate = `---
package: "" # package name
type: "" # "major", "minor", "patch"
---`;

	fs.writeFileSync(
		path.join(process.cwd(), AURI_DIR, `$${generateChangesetId()}.md`),
		changesetTemplate
	);
};
