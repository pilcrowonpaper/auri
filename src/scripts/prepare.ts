import fs from "fs/promises";
import path from "path";
import { execute } from "../utils/execute.js";
import {
	createPullRequest,
	getGitUser,
	getPullRequestFromBranches,
	getPullRequestFromFile,
	updatePullRequest
} from "../utils/github.js";
import { dirExists } from "../utils/fs.js";
import { parsePackageJSON } from "../utils/package.js";

import type { Repository } from "../utils/github.js";
import type { PackageMeta } from "../utils/package.js";

export async function prepareRelease(branch: string): Promise<void> {
	const packageMeta = await parsePackageJSON();

	const changesets = await getChangesets(packageMeta.repository, "main");
	if (changesets.length === 0) {
		return;
	}

	if (branch === "main" || branch === "master") {
		if (packageMeta.version.next === null) {
			await prepareMinorOrPatchRelease(changesets, packageMeta);
		} else {
			await preparePrereleaseToStableRelease(changesets, packageMeta);
		}
		return;
	}
	if (branch.startsWith("v")) {
		const branchMajorVersion = Number(branch.replace("v", ""));
		if (isNaN(branchMajorVersion) || Math.trunc(branchMajorVersion) !== branchMajorVersion) {
			return;
		}
		if (branchMajorVersion !== packageMeta.version.major) {
			await prepareNewPrerelease(branchMajorVersion, changesets, packageMeta);
		} else if (packageMeta.version.next === null) {
			await prepareMinorOrPatchRelease(changesets, packageMeta);
		} else {
			await prepareNextPrerelease(changesets, packageMeta);
		}
		return;
	}
}

async function prepareMinorOrPatchRelease(
	changesets: Changeset[],
	packageMeta: PackageMeta
): Promise<void> {
	await initializeGit();

	const minorChangesets: Changeset[] = [];
	const patchChangesets: Changeset[] = [];
	for (const changeset of changesets) {
		if (changeset.type === "major") {
			throw new Error('Stable versions must not use "major" changesets');
		} else if (changeset.type === "minor") {
			minorChangesets.push(changeset);
		} else if (changeset.type === "patch") {
			patchChangesets.push(changeset);
		}
	}

	let nextVersion: string;
	if (minorChangesets.length > 0) {
		nextVersion = [packageMeta.version.major, packageMeta.version.minor + 1, 0].join(".");
	} else {
		nextVersion = [
			packageMeta.version.major,
			packageMeta.version.minor,
			packageMeta.version.patch + 1
		].join(".");
	}

	const changelogTitle = `# ${packageMeta.name}\n`;
	const changelogContentBuffer = await fs.readFile("CHANGELOG.md");
	let changelogContent = changelogContentBuffer.toString();
	const changelogBody = generateVersionChangelog([], minorChangesets, patchChangesets, packageMeta);
	const changelogBodyWithVersionTitle = `## ${nextVersion}\n` + changelogBody;
	changelogContent =
		changelogTitle + changelogBodyWithVersionTitle + changelogContent.replace(changelogTitle, "");
	await fs.writeFile("CHANGELOG.md", changelogContent);

	const packageJSON = await fs.readFile("package.json");
	const parsedPackageJSON: object = JSON.parse(packageJSON.toString());
	Object.assign(parsedPackageJSON, {
		version: nextVersion
	});
	await fs.writeFile("package.json", JSON.stringify(parsedPackageJSON));
	await fs.rm(".changesets", {
		recursive: true,
		force: true
	});
	execute("npx prettier -w package.json CHANGELOG.md")
	commitChanges("main.auri");
	execute("git checkout main"); // reset branch

	await createReleaseRequest(packageMeta.repository, "main", nextVersion, changelogBody);
}

async function preparePrereleaseToStableRelease(
	changesets: Changeset[],
	packageMeta: PackageMeta
): Promise<void> {
	await initializeGit();

	const majorChangesets: Changeset[] = [];
	const minorChangesets: Changeset[] = [];
	const patchChangesets: Changeset[] = [];
	for (const changeset of changesets) {
		if (changeset.type === "major") {
			majorChangesets.push(changeset);
		} else if (changeset.type === "minor") {
			minorChangesets.push(changeset);
		} else if (changeset.type === "patch") {
			patchChangesets.push(changeset);
		}
	}

	const nextVersion = [packageMeta.version.major, 0, 0].join(".");

	const changelogBody = generateVersionChangelog(
		majorChangesets,
		minorChangesets,
		patchChangesets,
		packageMeta
	);
	const changelogBodyWithVersionTitle = `## ${nextVersion}\n` + changelogBody;
	const changelogTitle = `# ${packageMeta.name}\n`;
	const changelogContent = changelogTitle + changelogBodyWithVersionTitle;
	await fs.writeFile("CHANGELOG.md", changelogContent);

	const packageJSON = await fs.readFile("package.json");
	const parsedPackageJSON: object = JSON.parse(packageJSON.toString());
	Object.assign(parsedPackageJSON, {
		version: nextVersion
	});
	await fs.writeFile("package.json", JSON.stringify(parsedPackageJSON));
	await fs.rm(".changesets", {
		recursive: true,
		force: true
	});
	execute("npx prettier -w package.json CHANGELOG.md")
	commitChanges("main.auri");
	execute("git checkout main");

	await createReleaseRequest(packageMeta.repository, "main", nextVersion, changelogBody);
}

async function prepareNextPrerelease(
	changesets: Changeset[],
	packageMeta: PackageMeta
): Promise<void> {
	await initializeGit();

	const majorChangesets: Changeset[] = [];
	const minorChangesets: Changeset[] = [];
	const patchChangesets: Changeset[] = [];
	for (const changeset of changesets) {
		if (changeset.type === "major") {
			majorChangesets.push(changeset);
		} else if (changeset.type === "minor") {
			minorChangesets.push(changeset);
		} else if (changeset.type === "patch") {
			patchChangesets.push(changeset);
		}
	}
	const currentNextVersion = packageMeta.version.next;
	if (currentNextVersion === null) {
		throw new Error("Expected prerelease version");
	}
	const nextVersion =
		[packageMeta.version.major, 0, 0].join(".") + `-next.${currentNextVersion + 1}`;

	const changelogTitle = `# ${packageMeta.name}\n`;
	const changelogContentBuffer = await fs.readFile("CHANGELOG.md");
	let changelogContent = changelogContentBuffer.toString();
	const changelogBody = generateVersionChangelog(
		majorChangesets,
		minorChangesets,
		patchChangesets,
		packageMeta
	);
	const changelogBodyWithVersionTitle = `## ${nextVersion}\n` + changelogBody;
	changelogContent =
		changelogTitle + changelogBodyWithVersionTitle + changelogContent.replace(changelogTitle, "");
	await fs.writeFile("CHANGELOG.md", changelogContent);

	const packageJSON = await fs.readFile("package.json");
	const parsedPackageJSON: object = JSON.parse(packageJSON.toString());
	Object.assign(parsedPackageJSON, {
		version: nextVersion
	});
	await fs.writeFile("package.json", JSON.stringify(parsedPackageJSON));
	await fs.rm(".changesets", {
		recursive: true,
		force: true
	});
	execute("npx prettier -w package.json CHANGELOG.md")
	commitChanges(`v${packageMeta.version.major}.auri`);
	execute(`git checkout v${packageMeta.version.major}`);

	await createReleaseRequest(
		packageMeta.repository,
		`v${packageMeta.version.major}`,
		nextVersion,
		changelogBody
	);
}

async function prepareNewPrerelease(
	majorVersion: number,
	changesets: Changeset[],
	packageMeta: PackageMeta
): Promise<void> {
	await initializeGit();

	const majorChangesets: Changeset[] = [];
	const minorChangesets: Changeset[] = [];
	const patchChangesets: Changeset[] = [];
	for (const changeset of changesets) {
		if (changeset.type === "major") {
			majorChangesets.push(changeset);
		} else if (changeset.type === "minor") {
			minorChangesets.push(changeset);
		} else if (changeset.type === "patch") {
			patchChangesets.push(changeset);
		}
	}

	const nextVersion = [majorVersion, 0, 0].join(".") + "-next.0";

	const changelogBody = generateVersionChangelog(
		majorChangesets,
		minorChangesets,
		patchChangesets,
		packageMeta
	);
	const changelogBodyWithVersionTitle = `## ${nextVersion}\n` + changelogBody;
	const changelogTitle = `# ${packageMeta.name}\n`;
	const changelogContent = changelogTitle + changelogBodyWithVersionTitle;
	await fs.writeFile("CHANGELOG.md", changelogContent);

	const packageJSON = await fs.readFile("package.json");
	const parsedPackageJSON: object = JSON.parse(packageJSON.toString());
	Object.assign(parsedPackageJSON, {
		version: nextVersion
	});
	await fs.writeFile("package.json", JSON.stringify(parsedPackageJSON));
	await fs.rm(".changesets", {
		recursive: true,
		force: true
	});
	execute("npx prettier -w package.json CHANGELOG.md")
	commitChanges(`v${majorVersion}.auri`);
	execute(`git checkout v${majorVersion}`);

	await createReleaseRequest(
		packageMeta.repository,
		`v${majorVersion}`,
		nextVersion,
		changelogBody
	);
}

async function getChangesets(repository: Repository, branch: string): Promise<Changeset[]> {
	const changesetDirExists = await dirExists(".changesets");
	if (!changesetDirExists) {
		return [];
	}
	const changesetFilenames = await fs.readdir(".changesets");
	const changesetPromises: Promise<Changeset>[] = [];
	for (const changesetFilename of changesetFilenames) {
		if (!changesetFilename.endsWith(".md")) {
			throw new Error("Invalid changeset");
		}
		if (!changesetFilename.replace(".md", "").includes(".")) {
			throw new Error("Invalid changeset");
		}
		const [id, type] = changesetFilename.replace(".md", "").split(".");

		if (type !== "patch" && type !== "minor" && type !== "major") {
			throw new Error(`Invalid changeset file: ${changesetFilename}`);
		}
		const content = await fs.readFile(path.join(".changesets", changesetFilename));
		changesetPromises.push(
			new Promise(async (resolve) => {
				const pullRequest = await getPullRequestFromFile(
					repository,
					branch,
					path.join(".changesets", changesetFilename)
				);
				const changeset: Changeset = {
					id,
					type,
					content: content.toString(),
					pullRequestNumber: pullRequest?.number ?? null
				};
				return resolve(changeset);
			})
		);
	}
	return await Promise.all(changesetPromises);
}

interface Changeset {
	type: "patch" | "minor" | "major";
	content: string;
	id: string;
	pullRequestNumber: number | null;
}

async function createReleaseRequest(
	repository: Repository,
	branch: string,
	nextVersion: string,
	body: string
) {
	const head = `${repository.owner}:${branch}.auri`;
	const base = branch;
	const existingPullRequest = await getPullRequestFromBranches(repository, head, base);
	const title = `Auri: Release request (v${nextVersion})`;
	if (existingPullRequest) {
		await updatePullRequest(repository, existingPullRequest.number, {
			title,
			body
		});
	} else {
		await createPullRequest(repository, title, head, base, {
			body
		});
	}
}

async function initializeGit() {
	const user = await getGitUser();
	execute(`git config --global user.name "${user.name}"`);
	execute(`git config --global user.email "${user.email}"`);
}

function commitChanges(targetBranch: string) {
	execute(`git checkout -b ${targetBranch}`);
	execute("git add .");
	execute('git commit -m "update release"');
	execute("git push -f -u origin HEAD");
}

function generateVersionChangelog(
	majorChangesets: Changeset[],
	minorChangesets: Changeset[],
	patchChangesets: Changeset[],
	packageMeta: PackageMeta
): string {
	let body = "";
	if (majorChangesets.length > 0) {
		body += "## Major changes\n";
		body += generateVersionTypeChangesetList(majorChangesets, packageMeta);
	}
	if (minorChangesets.length > 0) {
		body += "## Minor changes\n";
		body += generateVersionTypeChangesetList(minorChangesets, packageMeta);
	}
	if (patchChangesets.length > 0) {
		body += "## Patch changes\n";
		body += generateVersionTypeChangesetList(patchChangesets, packageMeta);
	}
	return body;
}

function generateVersionTypeChangesetList(
	changesets: Changeset[],
	packageMeta: PackageMeta
): string {
	let list = "";
	for (const changeset of changesets) {
		if (changeset.pullRequestNumber !== null) {
			const pullRequestLink = `https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${changeset.pullRequestNumber}`;
			list += `- ${changeset.content.trim()} ([#${
				changeset.pullRequestNumber
			}](${pullRequestLink}))\n`;
		} else {
			list += `- ${changeset.content.trim()}\n`;
		}
	}
	return list;
}
