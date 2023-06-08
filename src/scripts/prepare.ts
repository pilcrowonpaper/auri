import fs from "fs";
import path from "path";
import frontmatter from "front-matter";

import { AURI_DIR, AURI_RELEASE_CONFIG_FILE_PATH } from "../shared/constant.js";
import {
	Package,
	getPackage,
	getPackages,
	getPublicPackages
} from "../shared/project.js";
import {
	GithubApiError,
	getUser,
	githubApiError,
	githubApiRequest,
	githubRepositoryApi
} from "../utils/github.js";
import { config, releaseConfig } from "../shared/config.js";
import { execute } from "../utils/execute.js";
import { formatRepository } from "../shared/format.js";
import { error } from "../shared/error.js";
import { deploy } from "../shared/deploy.js";

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

const isDebugEnabled = config("debug") ?? false;

export const prepare = async (): Promise<void> => {
	if (!fs.existsSync(path.resolve(AURI_DIR)))
		return error("Directory .auri does not exist");

	const logFileNames = fs
		.readdirSync(path.resolve(AURI_DIR))
		.filter((contentName) => {
			return contentName.startsWith("$") && contentName.endsWith(".md");
		});

	if (isDebugEnabled) {
		console.log("log files: ");
		console.log(logFileNames);
	}

	if (logFileNames.length === 0) {
		return deploy();
	}

	const packages = getPackages();
	const publicPackages = getPublicPackages(packages);

	if (isDebugEnabled) {
		console.log("all packages");
		console.log(packages.map((val) => val.name));
	}

	const changesetsMap: Record<string, PackageChangesets> = {};

	for (const fileName of logFileNames) {
		if (isDebugEnabled) {
			console.log(`current file: ${fileName}`);
		}
		const file = fs.readFileSync(path.resolve(path.join(AURI_DIR, fileName)));
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
			publicPackages.some((pkg) => pkg.name === packageName);
		if (isDebugEnabled) {
			console.log(`file text: ${fileText}`);
			console.log(`change type: ${changeType}`);
			console.log(`package name: ${packageName}`);
			console.log(`is valid change type: ${isValidChangeType}`);
			console.log(`is valid package name: ${isValidPackageName}`);
		}
		if (!isValidPackageName || !isValidChangeType) continue;

		if (!(packageName in changesetsMap)) {
			changesetsMap[packageName] = {
				patch: [],
				minor: [],
				major: []
			};
		}
		const changesetId = fileName.split(".").slice(0, -1).join(".");

		if (isDebugEnabled) {
			console.log(`changeset id: ${changesetId}`);
		}

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
							path: `/.auri/${changesetId}.md`
						}
					}
				);
				const latestCommit = commits.at(0) ?? null;
				if (!latestCommit) return error("Unknown commit");
				return latestCommit;
			} catch (e) {
				if (e instanceof GithubApiError) githubApiError(e);
				return error("Unknown error occurred");
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
				if (e instanceof GithubApiError) githubApiError(e);
				return error("Unknown error occurred");
			}
		};

		const commit = await getCommit();
		const pullRequest = await getPullRequest(commit.sha);

		if (isDebugEnabled) {
			console.log(`commit author: ${commit.author}`);
			console.log(`pr number: ${pullRequest?.number}`);
		}

		const metaData = {
			author: commit.author.login,
			prNumber: pullRequest?.number ?? null
		};
		changesetsMap[packageName][changeType].push({
			content: markdownContent.body.trim(),
			...metaData
		});
	}

	if (isDebugEnabled) {
		console.log("changesets:");
		console.log(Object.entries(changesetsMap));
	}

	const packagesToUpdate: {
		package: Package;
		changesets: PackageChangesets;
		nextVersion: string;
	}[] = [];

	for (const [packageName, changesets] of Object.entries(changesetsMap)) {
		const pkg = getPackage(packageName);

		const getCurrentReleaseStage = () => {
			if (pkg.version.includes("beta")) {
				return "beta";
			}
			return "stable";
		};

		const getNextVersion = (type: "patch" | "minor" | "major") => {
			const currentReleaseStage = getCurrentReleaseStage();
			const targetStage = releaseConfig("stage") ?? null;

			if (currentReleaseStage === "beta") {
				const [semver, betaFlag] = pkg.version.split("-");
				if (targetStage === "stable") return semver;
				const betaVersion = Number(betaFlag.split(".")[1]);
				const nextBetaFlag = ["beta", betaVersion + 1].join(".");
				return [semver, nextBetaFlag].join("-");
			}

			const getNextSemver = () => {
				const [majorVersionSegment, minorVersionSegment, patchVersionSegment] =
					pkg.version.split(".").map((val) => Number(val));
				if (type === "major") {
					return [majorVersionSegment + 1, 0, 0].join(".");
				}
				if (type === "minor") {
					return [majorVersionSegment, minorVersionSegment + 1, 0].join(".");
				}

				return [
					majorVersionSegment,
					minorVersionSegment,
					patchVersionSegment + 1
				].join(".");
			};

			const nextSemver = getNextSemver();
			if (targetStage === "beta") {
				const betaFlag = "beta.0";
				return [nextSemver, betaFlag].join("-");
			}
			return nextSemver;
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

	if (isDebugEnabled) {
		console.log("packages to update");
		console.log(packagesToUpdate.map((val) => val.package.name));
	}

	if (packagesToUpdate.length === 0) {
		return deploy();
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
				`## ${update.nextVersion}`,
				generatePackageChangelog(update, 3),
				...previousChangelogItems
			].join("\n\n")
		);
		const packageConfig = structuredClone(update.package.config);
		packageConfig.version = update.nextVersion;
		const packageJson = JSON.stringify(packageConfig);
		fs.writeFileSync(update.package.packageJsonPath, packageJson);
	}

	formatRepository();

	const fileNames = fs.readdirSync(path.join(process.cwd(), AURI_DIR));
	const changesetFileNames = fileNames.filter((fileName) =>
		fileName.endsWith(".md")
	);
	for (const fileName of changesetFileNames) {
		fs.rmSync(path.join(process.cwd(), AURI_DIR, fileName));
	}
	if (fs.existsSync(AURI_RELEASE_CONFIG_FILE_PATH)) {
		fs.rmSync(AURI_RELEASE_CONFIG_FILE_PATH);
	}

	const user = await getUser();

	execute(`git config --global user.name "${user.username}"`);
	execute(`git config --global user.email "${user.email}"`);
	execute("git checkout -b auri");
	execute("git add .");
	execute('git commit -m "update release"');
	execute("git push -f -u origin HEAD");

	const getExistingPullRequest = async () => {
		const repositoryUrl = new URL(config("repository"));
		const repositoryOwner = repositoryUrl.pathname.split("/").at(1) ?? null;
		if (repositoryOwner === null) return error("Invalid config.repository url");
		try {
			const pullRequests = await githubApiRequest<GithubPullRequest[]>(
				githubRepositoryApi("pulls"),
				{
					method: "GET",
					queryParameters: {
						head: `${repositoryOwner}:auri`,
						base: "main",
						state: "open"
					}
				}
			);
			if (pullRequests.length > 0) return pullRequests[0].number;
			return null;
		} catch (e) {
			if (e instanceof GithubApiError) githubApiError(e);
			return error("Unknown error occurred");
		}
	};

	const existingPullRequestNumber = await getExistingPullRequest();

	const changesBody = packagesToUpdate
		.map((update) => [
			`### ${update.package.name}@${update.nextVersion}`,
			generatePackageChangelog(update, 4)
		])
		.flat()
		.join("\n");
	const prBody = `This is a pull request automatically created by Auri. You can approve this pull request to update changelogs and publish packages.

## Releases

${changesBody}`;

	if (existingPullRequestNumber === null) {
		await githubApiRequest(githubRepositoryApi("pulls"), {
			method: "POST",
			body: {
				title: "CI: Release",
				head: "auri",
				base: "main",
				body: prBody
			}
		});
		return;
	}

	await githubApiRequest(
		githubRepositoryApi("pulls", existingPullRequestNumber),
		{
			method: "PATCH",
			body: {
				body: prBody
			}
		}
	);
};

const generatePackageChangelog = (
	update: {
		package: Package;
		nextVersion: string;
		changesets: PackageChangesets;
	},
	headingLevel: number
) => {
	const getChangesetMdItem = (changeset: Changeset) => {
		const authorLink = `[@${changeset.author}](${new URL(
			changeset.author,
			"https://github.com"
		)})`;
		if (changeset.prNumber === null) {
			return `- By ${authorLink} : ${changeset.content}`;
		}
		const repositoryUrl = new URL(config("repository"));
		const prPathname = path.join(
			repositoryUrl.pathname,
			"pull",
			changeset.prNumber.toString()
		);
		const prUrl = new URL(prPathname, "https://github.com");
		return `- [#${changeset.prNumber}](${prUrl}) by ${authorLink} : ${changeset.content}`;
	};

	const newLogItems: string[] = [];
	if (update.changesets.major.length > 0) {
		newLogItems.push(`${"#".repeat(headingLevel)} Major changes`);
		for (const changeset of update.changesets.major) {
			newLogItems.push(getChangesetMdItem(changeset));
		}
	}
	if (update.changesets.minor.length > 0) {
		newLogItems.push(`${"#".repeat(headingLevel)} Minor changes`);
		for (const changeset of update.changesets.minor) {
			newLogItems.push(getChangesetMdItem(changeset));
		}
	}
	if (update.changesets.patch.length > 0) {
		newLogItems.push(`${"#".repeat(headingLevel)} Patch changes`);
		for (const changeset of update.changesets.patch) {
			newLogItems.push(getChangesetMdItem(changeset));
		}
	}
	return newLogItems.join("\n\n");
};
