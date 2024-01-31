import fs from "fs/promises";
import path from "path";

import { dirExists } from "../utils/fs.js";

export const addChangeset = async (type: "patch" | "minor" | "next") => {
	const changesetsDirExists = await dirExists(path.join(process.cwd(), ".changesets"));
	if (!changesetsDirExists) {
		await fs.mkdir(path.join(process.cwd(), ".changesets"));
	}
	await fs.writeFile(path.join(process.cwd(), ".changesets", `${generateId(5)}.${type}.md`), "");
};

function generateId(length: number): string {
	const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return result;
}
