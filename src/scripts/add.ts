import fs from "fs/promises";
import path from "path";

import { dirExists } from "../utils/fs.js";

export const addChangeset = async (type: "patch" | "minor" | "next") => {
	const changesetsDirExists = await dirExists(path.join(process.cwd(), ".changesets"));
	if (!changesetsDirExists) {
		await fs.mkdir(path.join(process.cwd(), ".changesets"));
	}
	const id = generateChangesetId();
	const filename = `${id}.${type}.md`;
	await fs.writeFile(path.join(process.cwd(), ".changesets", filename), "");
};

function generateChangesetId(): string {
	const now = Math.floor(Date.now() / 1000);
	const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
	let random = "";
	for (let i = 0; i < 5; i++) {
		random += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return `${now.toString()}-${random}`;
}
