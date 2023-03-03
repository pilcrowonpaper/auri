import fs from "fs";
import path from "path";
import frontmatter from "front-matter";

import { CELA_DIR } from "./constant.js";
import { Package, getPackage, getPackages } from "./project.js";
import { getUser, githubApiRequest, githubRepositoryApi } from "./github.js";
import { config } from "./config.js";
import { execute } from "./execute.js";

type GithubPullRequest = {
	number: number;
};

type Changeset = {
	content: string;
	author: string;
	prNumber: number | null;
};
type PackageChangesets = {
	patch: Changeset[];
	minor: Changeset[];
	major: Changeset[];
};

export const prepare = async () => {
	if (!fs.existsSync(path.resolve(CELA_DIR))) throw new Error();

	const logFileNames = fs
		.readdirSync(path.resolve(CELA_DIR))
		.filter((contentName) => {
			return contentName.startsWith("$") && contentName.endsWith(".md");
		});
	const allPackages = await getPackages();

	const changesetsMap: Record<string, PackageChangesets> = {};

	for (const fileName of logFileNames) {
		const file = fs.readFileSync(path.resolve(path.join(CELA_DIR, fileName)));
		const fileText = file.toString();
		const markdownContent = frontmatter<Record<string, unknown>>(fileText);
		const changeType = markdownContent.attributes.type;
		const packageName = markdownContent.attributes.package;
		const isValidChangeType =
			changeType === "patch" ||
			changeType === "minor" ||
			changeType === "major";
		const isValidPackageName =
			typeof packageName === "string" &&
			allPackages.some((p) => p.name === packageName);
		if (!isValidPackageName || !isValidChangeType) continue;
		if (!(packageName in changesetsMap)) {
			changesetsMap[packageName] = {
				patch: [],
				minor: [],
				major: []
			};
		}
		const changesetId = fileName.split(".").slice(0, -1).join(".");

		type GithubCommit = {
			sha: string;
			author: {
				login: string;
			};
		};

		const getCommit = async () => {
			try {
				const commits = await githubApiRequest<GithubCommit[]>(
					githubRepositoryApi("commits"),
					{
						method: "GET",
						queryParameters: {
							path: `/.cela/${changesetId}.md`
						}
					}
				);
				const latestCommit = commits.at(0) ?? null;
				if (!latestCommit) throw new Error();
				return latestCommit;
			} catch (e) {
				console.log(e);
				throw new Error();
			}
		};

		const getPullRequest = async (commitSha: string) => {
			try {
				const pullRequests = await githubApiRequest<GithubPullRequest[]>(
					githubRepositoryApi("commits", commitSha, "pulls"),
					{
						method: "GET"
					}
				);
				const latestPullRequest = pullRequests.at(0) ?? null;
				return latestPullRequest;
			} catch (e) {
				console.log(e);
				throw new Error();
			}
		};

		const commit = await getCommit();
		const pullRequest = await getPullRequest(commit.sha);

		const metaData = {
			author: commit.author.login,
			prNumber: pullRequest?.number ?? null
		};
		changesetsMap[packageName][changeType].push({
			content: markdownContent.body.trim(),
			...metaData
		});
	}

	const packagesToUpdate: {
		package: Package;
		changesets: PackageChangesets;
		nextVersion: string;
	}[] = [];

	for (const [packageName, changesets] of Object.entries(changesetsMap)) {
		console.log(packageName, changesets);
		const pkg = await getPackage(packageName);

		const getNextVersion = (type: "patch" | "minor" | "major") => {
			const [majorVersionSegment, minorVersionSegment, patchVersionSegment] =
				pkg.version.split(".").map((val) => Number(val));
			if (type === "major") return [majorVersionSegment + 1, 0, 0].join(".");
			if (type === "minor")
				return [majorVersionSegment, minorVersionSegment + 1, 0].join(".");
			return [
				majorVersionSegment,
				minorVersionSegment,
				patchVersionSegment + 1
			].join(".");
		};

		let nextVersion: string;
		if (changesets.major.length > 0) {
			nextVersion = getNextVersion("major");
		} else if (changesets.minor.length > 0) {
			nextVersion = getNextVersion("minor");
		} else {
			nextVersion = getNextVersion("patch");
		}
		packagesToUpdate.push({
			package: pkg,
			changesets,
			nextVersion
		});
	}

	for (const update of packagesToUpdate) {
		const getPreviousChangelogItems = () => {
			const changelogPath = path.join(
				update.package.directoryPath,
				"CHANGELOG.md"
			);
			const changelogExists = fs.existsSync(changelogPath);
			const changelogFile = changelogExists
				? fs.readFileSync(changelogPath)
				: "";
			// formatted: includes title
			const currentFormattedChangelogItems = changelogFile
				.toString()
				.split("\n")
				.filter((val) => !!val && val !== "\n");
			const isChangelogPartiallyUpdated = currentFormattedChangelogItems.some(
				(item) => item === `## ${update.nextVersion}`
			);
			if (!isChangelogPartiallyUpdated) {
				// remove heading1
				currentFormattedChangelogItems.slice(1);
			}
			const targetVersionHeadingIndex =
				currentFormattedChangelogItems.findIndex(
					(item) => item === `## ${update.nextVersion}`
				);
			const previousVersionHeadingIndex =
				currentFormattedChangelogItems.findIndex((val, i) => {
					return i > targetVersionHeadingIndex && val.startsWith(`## `);
				});
			const previousVersionHeadingExists = previousVersionHeadingIndex > -1;
			if (!previousVersionHeadingExists) return [];
			// remove title and partially created section for the target version
			return currentFormattedChangelogItems.slice(previousVersionHeadingIndex);
		};
		const previousChangelogItems = getPreviousChangelogItems();
		fs.writeFileSync(
			path.join(update.package.directoryPath, "CHANGELOG.md"),
			[
				`# ${update.package.name}`,
				generateNewChangelogSection(update),
				...previousChangelogItems
			].join("\n\n")
		);
	}

	const fileNames = fs.readdirSync(path.join(process.cwd(), CELA_DIR));
	const changesetFileNames = fileNames.filter((fileName) =>
		fileName.endsWith(".md")
	);
	for (const fileName of changesetFileNames) {
		fs.rmSync(path.join(process.cwd(), CELA_DIR, fileName));
	}

	const user = await getUser();

	console.log(user);

	execute(
		`git config user.name "${user.username}"`,
		`git config user.email "${user.email}"`,
		`git checkout -b cela`,
		`git add .`,
		`git commit -m "update release"`,
		`git push -f -u origin HEAD`
	);

	const getExistingPullRequest = async () => {
		const repositoryUrl = new URL(config("repository"));
		const repositoryOwner = repositoryUrl.pathname.split("/").at(1) ?? null;
		if (repositoryOwner === null) throw new Error();
		try {
			const pullRequests = await githubApiRequest<GithubPullRequest[]>(
				githubRepositoryApi("pulls"),
				{
					method: "GET",
					queryParameters: {
						head: `${repositoryOwner}:main`,
						branch: "cela",
						state: "open"
					}
				}
			);
			if (pullRequests.length > 0) return pullRequests[0].number;
			return null;
		} catch (e) {
			console.log(e);
			throw new Error();
		}
	};

	const existingPullRequestNumber = await getExistingPullRequest();
	console.log(existingPullRequestNumber);
	if (existingPullRequestNumber === null) {
		await githubApiRequest(githubRepositoryApi("pulls"), {
			method: "POST",
			body: {
				title: "CI: Release",
				head: "cela",
				base: "main",
				body: `This is a pull request automatically created by Cela. You can approve this pull request to update changelogs and publish packages.

## Releases

${packagesToUpdate
	.map((update) => generateNewChangelogSection(update, 3))
	.join("\n")}`
			}
		});
		return;
	}
	await githubApiRequest(
		githubRepositoryApi("pulls", existingPullRequestNumber),
		{
			method: "PATCH",
			body: {
				body: `This is a pull request automatically created by Cela. You can approve this pull request to update changelogs and publish packages.

## Releases

${packagesToUpdate
	.map((update) => generateNewChangelogSection(update, 3))
	.join("\n")}`
			}
		}
	);
};

const generateNewChangelogSection = (
	update: {
		package: Package;
		nextVersion: string;
		changesets: PackageChangesets;
	},
	versionHeadingLevel: number = 2
) => {
	const getChangesetMdItem = (changeset: Changeset) => {
		return `- ${
			typeof changeset.prNumber === "number"
				? `#${changeset.prNumber} by`
				: "By"
		} @${changeset.author}: ${changeset.content}`;
	};

	const newLogItems = [
		`${"#".repeat(versionHeadingLevel)} ${update.nextVersion}`
	];
	if (update.changesets.major.length > 0) {
		newLogItems.push(`${"#".repeat(versionHeadingLevel + 1)} Major changes`);
		for (const changeset of update.changesets.major) {
			newLogItems.push(getChangesetMdItem(changeset));
		}
	}
	if (update.changesets.minor.length > 0) {
		newLogItems.push(`${"#".repeat(versionHeadingLevel + 1)} Minor changes`);
		for (const changeset of update.changesets.minor) {
			newLogItems.push(getChangesetMdItem(changeset));
		}
	}
	if (update.changesets.patch.length > 0) {
		newLogItems.push(`${"#".repeat(versionHeadingLevel + 1)} Patch changes`);
		for (const changeset of update.changesets.patch) {
			newLogItems.push(getChangesetMdItem(changeset));
		}
	}
	return newLogItems.join("\n\n");
};
