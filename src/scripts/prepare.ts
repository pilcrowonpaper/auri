import fs from "fs/promises";
import path from "path";
import { parseVersion } from "../utils/version.js";
import { execute } from "../utils/execute.js";
import {
	createPullRequest,
	getGitUser,
	getPullRequestFromBranches,
	getPullRequestFromFile,
	parseRepositoryURL,
	updatePullRequest
} from "../utils/github.js";

import type { Repository } from "../utils/github.js";
import { dirExists, fileExists } from "../utils/fs.js";

export async function prepareRelease(branch: string): Promise<void> {
	const packageJSON = await fs.readFile("package.json");
	const parsedPackageJSON: object = JSON.parse(packageJSON.toString());
	if (!("name" in parsedPackageJSON && typeof parsedPackageJSON.name === "string")) {
		throw new Error('package.json missing field "name"');
	}
	if (!("version" in parsedPackageJSON && typeof parsedPackageJSON.version === "string")) {
		throw new Error('package.json missing field "version"');
	}
	if (
		!(
			"repository" in parsedPackageJSON &&
			typeof parsedPackageJSON.repository === "object" &&
			parsedPackageJSON.repository !== null
		)
	) {
		throw new Error('package.json missing field "repository"');
	}
	if (
		!("url" in parsedPackageJSON.repository && typeof parsedPackageJSON.repository.url === "string")
	) {
		throw new Error('package.json missing field "repository.url"');
	}
	const repository = parseRepositoryURL(parsedPackageJSON.repository.url);
	if (!repository) {
		throw new Error('Invalid "repository.url" field in package.json');
	}

	const packageMeta: PackageMeta = {
		name: parsedPackageJSON.name,
		version: parsedPackageJSON.version,
		repository
	};

	if (branch === "main" || branch === "master") {
		await prepareCurrentVersion(packageMeta);
	}
	if (branch.startsWith("v")) {
		const majorVersion = Number(branch.replace("v", ""));
		if (!isNaN(majorVersion) && Math.trunc(majorVersion) === majorVersion) {
			await prepareMajorVersion(majorVersion, packageMeta);
		}
	}
}

async function prepareCurrentVersion(packageMeta: PackageMeta): Promise<void> {
	const changesets = await getChangesets(packageMeta.repository, "main");
	if (changesets.length === 0) {
		return;
	}

	const currentVersion = parseVersion(packageMeta.version);

	if (currentVersion.next !== null) {
		// next => stable release
		const nextVersion = [currentVersion.major, 0, 0].join(".");
		let changelogBody = `## ${nextVersion}\n`;
		for (const changeset of changesets) {
			if (changeset.pullRequestNumber !== null) {
				changelogBody += `- ${changeset.content.trim()} ([#${
					changeset.pullRequestNumber
				}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
					changeset.pullRequestNumber
				}))\n`;
			} else {
				changelogBody += `- ${changeset.content.trim()}\n`;
			}
		}
		const changelogTitle = `# \`${packageMeta.name}\`\n`;
		const changelog = changelogTitle + changelogBody;
		await fs.writeFile("CHANGELOG.md", changelog);

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
		commitChanges("main");

		let releaseRequestBody = "";
		for (const changeset of changesets) {
			if (changeset.pullRequestNumber !== null) {
				releaseRequestBody += `- ${changeset.content.trim()} ([#${
					changeset.pullRequestNumber
				}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
					changeset.pullRequestNumber
				}))\n`;
			} else {
				releaseRequestBody += `- ${changeset.content.trim()}\n`;
			}
		}
		await createReleaseRequest(packageMeta.repository, "main", nextVersion, releaseRequestBody);
		return;
	}

	// stable => stable release
	const minorChangesets: Changeset[] = [];
	const patchChangesets: Changeset[] = [];
	for (const changeset of changesets) {
		if (changeset.type === "next") {
			throw new Error('Stable versions must not use "next" changesets');
		} else if (changeset.type === "minor") {
			minorChangesets.push(changeset);
		} else if (changeset.type === "patch") {
			patchChangesets.push(changeset);
		}
	}

	let nextVersion: string;
	if (minorChangesets.length > 0) {
		nextVersion = [currentVersion.major, currentVersion.minor + 1, 0].join(".");
	} else {
		nextVersion = [currentVersion.major, currentVersion.minor, currentVersion.patch + 1].join(".");
	}

	const changelogExists = await fileExists("CHANGELOG.md");
	const changelogTitle = `# \`${packageMeta.name}\`\n`;
	if (!changelogExists) {
		await fs.writeFile("CHANGELOG.md", changelogTitle);
	}
	let changelog = await fs.readFile("CHANGELOG.md").then((d) => d.toString());
	let changelogBody = `## ${nextVersion}\n`;
	if (minorChangesets.length > 0) {
		changelogBody += "### Minor changes\n";
		for (const changeset of minorChangesets) {
			if (changeset.pullRequestNumber !== null) {
				changelogBody += `- ${changeset.content.trim()} ([#${
					changeset.pullRequestNumber
				}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
					changeset.pullRequestNumber
				}))\n`;
			} else {
				changelogBody += `- ${changeset.content.trim()}\n`;
			}
		}
	}
	if (patchChangesets.length > 0) {
		changelogBody += "### Patch changes\n";
		for (const changeset of patchChangesets) {
			if (changeset.pullRequestNumber !== null) {
				changelogBody += `- ${changeset.content.trim()} ([#${
					changeset.pullRequestNumber
				}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
					changeset.pullRequestNumber
				}))\n`;
			} else {
				changelogBody += `- ${changeset.content.trim()}\n`;
			}
		}
	}
	changelog = changelogTitle + changelogBody + changelog.replace(changelogTitle, "");
	await fs.writeFile("CHANGELOG.md", changelog);

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
	commitChanges("main");

	let releaseRequestBody = "";
	if (minorChangesets.length > 0) {
		releaseRequestBody += "## Minor changes\n";
		for (const changeset of minorChangesets) {
			if (changeset.pullRequestNumber !== null) {
				releaseRequestBody += `- ${changeset.content.trim()} ([#${
					changeset.pullRequestNumber
				}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
					changeset.pullRequestNumber
				}))\n`;
			} else {
				releaseRequestBody += `- ${changeset.content.trim()}\n`;
			}
		}
	}
	if (patchChangesets.length > 0) {
		releaseRequestBody += "## Patch changes\n";
		for (const changeset of patchChangesets) {
			if (changeset.pullRequestNumber !== null) {
				releaseRequestBody += `- ${changeset.content.trim()} ([#${
					changeset.pullRequestNumber
				}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
					changeset.pullRequestNumber
				}))\n`;
			} else {
				releaseRequestBody += `- ${changeset.content.trim()}\n`;
			}
		}
	}
	await createReleaseRequest(packageMeta.repository, "main", nextVersion, releaseRequestBody);
}

async function prepareMajorVersion(majorVersion: number, packageMeta: PackageMeta): Promise<void> {
	const currentVersion = parseVersion(packageMeta.version);
	if (majorVersion !== currentVersion.major || currentVersion.next !== null) {
		// stable => next release
		return await prepareNextMajorVersion(majorVersion, packageMeta);
	}

	// stable => stable release
	if (currentVersion.next !== null) {
		throw new Error('Main branch package version must not be "next"');
	}
	if (majorVersion !== currentVersion.major) {
		throw new Error("Invalid branch version");
	}
	const changesets = await getChangesets(packageMeta.repository, `v${majorVersion}`);
	if (changesets.length === 0) {
		return;
	}

	const minorChangesets: Changeset[] = [];
	const patchChangesets: Changeset[] = [];
	for (const changeset of changesets) {
		if (changeset.type === "next") {
			throw new Error('Stable versions must not use "next" changesets');
		} else if (changeset.type === "minor") {
			minorChangesets.push(changeset);
		} else if (changeset.type === "patch") {
			patchChangesets.push(changeset);
		}
	}

	let nextVersion: string;
	if (minorChangesets.length > 0) {
		nextVersion = [currentVersion.major, currentVersion.minor + 1, 0].join(".");
	} else {
		nextVersion = [currentVersion.major, currentVersion.minor, currentVersion.patch + 1].join(".");
	}

	const changelogExists = await fileExists("CHANGELOG.md");
	const changelogTitle = `# \`${packageMeta.name}\`\n`;
	if (!changelogExists) {
		await fs.writeFile("CHANGELOG.md", changelogTitle);
	}
	let changelog = await fs.readFile("CHANGELOG.md").then((d) => d.toString());
	let changelogBody = `## ${nextVersion}\n`;
	if (minorChangesets.length > 0) {
		changelogBody += "### Minor changes\n";
		for (const changeset of minorChangesets) {
			if (changeset.pullRequestNumber !== null) {
				changelogBody += `- ${changeset.content.trim()} ([#${
					changeset.pullRequestNumber
				}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
					changeset.pullRequestNumber
				}))\n`;
			} else {
				changelogBody += `- ${changeset.content.trim()}\n`;
			}
		}
	}
	if (patchChangesets.length > 0) {
		changelogBody += "### Patch changes\n";
		for (const changeset of patchChangesets) {
			if (changeset.pullRequestNumber !== null) {
				changelogBody += `- ${changeset.content.trim()} ([#${
					changeset.pullRequestNumber
				}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
					changeset.pullRequestNumber
				}))\n`;
			} else {
				changelogBody += `- ${changeset.content.trim()}\n`;
			}
		}
	}
	changelog = changelogTitle + changelogBody + changelog.replace(changelogTitle, "");
	await fs.writeFile("CHANGELOG.md", changelog);

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
	commitChanges(`v${majorVersion}`);

	let releaseRequestBody = "";
	if (minorChangesets.length > 0) {
		releaseRequestBody += "## Minor changes\n";
		for (const changeset of minorChangesets) {
			if (changeset.pullRequestNumber !== null) {
				releaseRequestBody += `- ${changeset.content.trim()} ([#${
					changeset.pullRequestNumber
				}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
					changeset.pullRequestNumber
				}))\n`;
			} else {
				releaseRequestBody += `- ${changeset.content.trim()}\n`;
			}
		}
	}
	if (patchChangesets.length > 0) {
		releaseRequestBody += "## Patch changes\n";
		for (const changeset of patchChangesets) {
			if (changeset.pullRequestNumber !== null) {
				releaseRequestBody += `- ${changeset.content.trim()} ([#${
					changeset.pullRequestNumber
				}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
					changeset.pullRequestNumber
				}))\n`;
			} else {
				releaseRequestBody += `- ${changeset.content.trim()}\n`;
			}
		}
	}
	await createReleaseRequest(
		packageMeta.repository,
		`v${majorVersion}`,
		nextVersion,
		releaseRequestBody
	);
}

async function prepareNextMajorVersion(
	majorVersion: number,
	packageMeta: PackageMeta
): Promise<void> {
	const currentVersion = parseVersion(packageMeta.version);
	const changesets = await getChangesets(packageMeta.repository, `v${majorVersion}`);
	if (changesets.length === 0) {
		return;
	}

	let nextVersion: string;
	if (currentVersion.major === majorVersion && currentVersion.next !== null) {
		nextVersion = [majorVersion, 0, 0].join(".") + `-next.${currentVersion.next + 1}`;
	} else {
		nextVersion = [majorVersion, 0, 0].join(".") + `-next.0`;
	}

	if (currentVersion.next === null) {
		let changelog = await fs.readFile("CHANGELOG.md").then((d) => d.toString());
		let changelogBody = `## ${nextVersion}\n`;
		for (const changeset of changesets) {
			if (changeset.type !== "next") {
				throw new Error('Changeset type must be "next"');
			}
			if (changeset.pullRequestNumber !== null) {
				changelogBody += `- ${changeset.content.trim()} ([#${
					changeset.pullRequestNumber
				}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
					changeset.pullRequestNumber
				}))\n`;
			} else {
				changelogBody += `- ${changeset.content.trim()}\n`;
			}
		}
		const changelogTitle = `# \`${packageMeta.name}\`\n`;
		changelog = changelogTitle + changelogBody;
		await fs.writeFile("CHANGELOG.md", changelog);
	} else {
		const changelogExists = await fileExists("CHANGELOG.md");
		const changelogTitle = `# \`${packageMeta.name}\`\n`;
		if (!changelogExists) {
			await fs.writeFile("CHANGELOG.md", changelogTitle);
		}
		let changelog = await fs.readFile("CHANGELOG.md").then((d) => d.toString());
		let changelogBody = `## ${nextVersion}\n`;
		for (const changeset of changesets) {
			if (changeset.type !== "next") {
				throw new Error('Changeset type must be "next"');
			}
			if (changeset.pullRequestNumber !== null) {
				changelogBody += `- ${changeset.content.trim()} ([#${
					changeset.pullRequestNumber
				}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
					changeset.pullRequestNumber
				}))\n`;
			} else {
				changelogBody += `- ${changeset.content.trim()}\n`;
			}
		}
		changelog = changelogTitle + changelogBody + changelog.replace(changelogTitle, "");
		await fs.writeFile("CHANGELOG.md", changelog);
	}

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
	commitChanges(`v${majorVersion}`);

	let releaseRequestBody = "";
	for (const changeset of changesets) {
		if (changeset.pullRequestNumber !== null) {
			releaseRequestBody += `- ${changeset.content.trim()} ([#${
				changeset.pullRequestNumber
			}](https://github.com/${packageMeta.repository.owner}/${packageMeta.repository.name}/pull/${
				changeset.pullRequestNumber
			}))\n`;
		} else {
			releaseRequestBody += `- ${changeset.content.trim()}\n`;
		}
	}
	await createReleaseRequest(
		packageMeta.repository,
		`v${majorVersion}`,
		nextVersion,
		releaseRequestBody
	);
}

interface PackageMeta {
	name: string;
	version: string;
	repository: Repository;
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

		if (type !== "patch" && type !== "minor" && type !== "next") {
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
	type: "patch" | "minor" | "next";
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

async function commitChanges(branch: string) {
	const user = await getGitUser();
	execute("npx prettier -w CHANGELOG.md package.json");
	execute(`git config --global user.name "${user.name}"`);
	execute(`git config --global user.email "${user.email}"`);
	execute(`git checkout -b ${branch}.auri`);
	execute("git add .");
	execute('git commit -m "update release"');
	execute("git push -f -u origin HEAD");
}
