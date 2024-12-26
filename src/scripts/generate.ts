import * as fs from "fs/promises";
import * as childprocess from "child_process";

import { parsePackageJSON } from "../utils/package.js";

export async function generateScript(): Promise<void> {
	const packageJSONFile = await fs.readFile("package.json");
	const packageJSON: unknown = JSON.parse(packageJSONFile.toString());
	const metadata = parsePackageJSON(packageJSON);
	// NOTE: parsePackageJSON() checks that PackageMetaData.version does not include unusual characters.
	const packageVersionSafe = metadata.version;

	// TODO: Support line breaks in commit messages?
	const output = childprocess
		.execSync(`git --no-pager log --pretty=tformat:"%s" "v${packageVersionSafe}..HEAD"`)
		.toString();
	const lines = output.split("\n");
	const prNumbers: number[] = [];
	for (const line of lines) {
		if (line.startsWith("docs:") || line.startsWith("style:") || line.startsWith("test:")) {
			continue;
		}
		const prNumberMatches = line.match(/\(#([0-9]+)\)$/);
		if (prNumberMatches === null || prNumberMatches.length !== 2) {
			continue;
		}
		const prNumber = Number(prNumberMatches[1]);
		prNumbers.push(prNumber);
	}

	let changeFile = "";
	for (let i = 0; i < prNumbers.length; i++) {
		changeFile += `${metadata.repository}/pull/${prNumbers[i]}`;
		if (i !== prNumbers.length - 1) {
			changeFile += "\n";
		}
	}

	await fs.writeFile(".CHANGES", changeFile);
	await fs.writeFile(".RELEASE.md", "");
}
