import fs from "fs";
import path from "path";

export const addChangeset = async (type: "patch" | "minor" | "next") => {
	if (!fs.existsSync(path.join(process.cwd(), ".changesets"))) {
		throw new Error(`".changesets" directory does not exist`);
	}
	fs.writeFileSync(path.join(process.cwd(), ".changesets", `${generateId()}.${type}.md`), "");
};

function generateId(): string {
	const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
	let result = "";
	for (let i = 0; i < 8; i++) {
		result += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return result;
}
