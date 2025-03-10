import * as fs from "fs/promises";
import * as childprocess from "child_process";

import { parsePackageJSON } from "../utils/package.js";
import { GitHubRepository, parseGitHubGitRepositoryURL } from "../utils/github.js";

export async function generateScript(): Promise<void> {
	const packageJSONFile = await fs.readFile("package.json");
	const packageJSON: unknown = JSON.parse(packageJSONFile.toString());
	const metadata = parsePackageJSON(packageJSON);
	// NOTE: parsePackageJSON() checks that PackageMetaData.version only includes '.', '-', or "_" as special characters.
	const packageVersionSafe = metadata.version;

	let repository: GitHubRepository;
	try {
		repository = parseGitHubGitRepositoryURL(metadata.repository);
	} catch {
		throw new Error("Invalid GitHub repository URL");
	}

	// TODO: Support line breaks in commit messages?
	const output = childprocess
		.execSync(`git --no-pager log --pretty=tformat:"%H%n%s" "v${packageVersionSafe}..HEAD"`)
		.toString();
	const lines = output.split("\n").slice(0, -1);
	const commitHashes: string[] = [];
	for (let i = 0; i < lines.length; i += 2) {
		if (
			lines[i + 1].startsWith("docs:") ||
			lines[i + 1].startsWith("style:") ||
			lines[i + 1].startsWith("test:")
		) {
			continue;
		}
		commitHashes.push(lines[i]);
	}

	let changeFile = "";
	for (let i = 0; i < commitHashes.length; i++) {
		changeFile += `https://github.com/${repository.owner}/${repository.name}/commit/${commitHashes[i]}`;
		if (i !== commitHashes.length - 1) {
			changeFile += "\n";
		}
	}

	await fs.writeFile(".COMMITS", changeFile);

	// Create file if not exists
	await fs.writeFile(".RELEASE.md", "", {
		flag: "a+"
	});
}
