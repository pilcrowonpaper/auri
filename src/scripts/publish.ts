import * as fs from "fs/promises";
import * as childprocess from "child_process";

import { parsePackageJSON } from "../utils/package.js";
import { env } from "../utils/env.js";
import { parseSemver } from "../utils/semver.js";

import type { Semver } from "../utils/semver.js";

export async function publishScript(): Promise<void> {
	const npmToken = env("AURI_NPM_TOKEN");
	const githubToken = env("AURI_GITHUB_TOKEN");

	let releaseFileBytes: Uint8Array;
	try {
		releaseFileBytes = await fs.readFile(".RELEASE.md");
	} catch {
		// File does no exist.
		return;
	}
	const releaseFile = new TextDecoder().decode(releaseFileBytes);

	const packageJSONFile = await fs.readFile("package.json");
	const packageJSON: unknown = JSON.parse(packageJSONFile.toString());
	const metadata = parsePackageJSON(packageJSON);
	// NOTE: parsePackageJSON() checks that PackageMetaData.version does not include unusual characters.
	const packageVersionSafe = metadata.version;

	const publishedVersions = await getPublishedVersions(metadata.name);
	if (publishedVersions.includes(metadata.version)) {
		return;
	}
	const releaseTag = calculateReleaseTag(metadata.version, publishedVersions);

	try {
		childprocess.execSync("npm install");
	} catch {
		throw new Error("Failed to install dependencies");
	}

	try {
		childprocess.execSync("npm run build");
	} catch {
		throw new Error("Failed to build package");
	}

	if (releaseTag === ReleaseTag.Latest) {
		try {
			childprocess.execSync(`NPM_TOKEN=${npmToken} npm publish --provenance --access=public`);
		} catch {
			throw new Error("Failed to publish package as latest");
		}
	} else if (releaseTag === ReleaseTag.Next) {
		try {
			childprocess.execSync(
				`NPM_TOKEN=${npmToken} npm publish --provenance --access=public --tag=next`
			);
		} catch {
			throw new Error("Failed to publish package as next");
		}
	} else if (releaseTag === ReleaseTag.Legacy) {
		try {
			childprocess.execSync(
				`NPM_TOKEN=${npmToken} npm publish --provenance --access=public --tag=legacy`
			);
		} catch {
			throw new Error("Failed to publish package as legacy");
		}
	} else {
		throw new Error("Invalid state");
	}

	try {
		childprocess.execSync(`git tag "v${packageVersionSafe}"`);
	} catch {
		throw new Error("Failed to create tag");
	}

	try {
		childprocess.execSync("git push origin --tags");
	} catch {
		throw new Error("Failed to push created tag");
	}

	let repository: GitHubRepository;
	try {
		repository = parseGitHubRepositoryURL(metadata.repository);
	} catch {
		throw new Error("Invalid GitHub repository URL");
	}

	try {
		await createGitHubRelease(githubToken, repository, metadata.version, releaseTag, releaseFile);
	} catch {
		throw new Error("Failed to create GitHub release");
	}
}

async function getPublishedVersions(name: string): Promise<string[]> {
	const npmRegistryUrl = new URL(name, "https://registry.npmjs.org");
	const npmRegistryResponse = await fetch(npmRegistryUrl);
	if (!npmRegistryResponse.ok) {
		throw new Error("Failed to fetch NPM data");
	}
	const npmRegistry: unknown = await npmRegistryResponse.json();
	if (typeof npmRegistry !== "object" || npmRegistry === null) {
		throw new Error("Failed to parse NPM data");
	}
	let publishedVersions: string[];
	if ("time" in npmRegistry && typeof npmRegistry.time === "object" && npmRegistry.time !== null) {
		publishedVersions = Object.keys(npmRegistry.time);
	} else {
		throw new Error("Failed to parse NPM data");
	}
	return publishedVersions;
}

function calculateReleaseTag(currentVersion: string, publishedVersions: string[]): ReleaseTag {
	const currentSemver = parseSemver(currentVersion);
	if (currentSemver.next !== null) {
		return ReleaseTag.Next;
	}
	for (const publishedVersion of publishedVersions) {
		let publishedSemver: Semver;
		try {
			publishedSemver = parseSemver(publishedVersion);
		} catch {
			// Ignore unknown version formats.
			continue;
		}
		if (publishedSemver.next === null && publishedSemver.major > currentSemver.major) {
			return ReleaseTag.Legacy;
		}
	}
	return ReleaseTag.Latest;
}

enum ReleaseTag {
	Latest = 0,
	Next,
	Legacy
}

function parseGitHubRepositoryURL(url: string): GitHubRepository {
	const parsed = new URL(url);
	if (parsed.origin !== "https://github.com") {
		throw new Error("Invalid GitHub repository URL");
	}
	const pathnameParts = parsed.pathname.split("/").slice(1);
	if (pathnameParts.length < 2) {
		throw new Error("Invalid GitHub repository URL");
	}
	const repository: GitHubRepository = {
		url,
		owner: pathnameParts[0],
		name: pathnameParts[1]
	};
	return repository;
}

async function createGitHubRelease(
	token: string,
	repository: GitHubRepository,
	version: string,
	releaseTag: ReleaseTag,
	body: string
): Promise<void> {
	const requestBody = JSON.stringify({
		tag_name: `v${version}`,
		name: `v${version}`,
		body: body,
		make_latest: releaseTag === ReleaseTag.Latest,
		prerelease: releaseTag === ReleaseTag.Next
	});
	const response = await fetch(
		`https://api.github.com/repos/${repository.owner}/${repository.name}/releases`,
		{
			method: "POST",
			body: requestBody,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json"
			}
		}
	);
	if (response.body !== null) {
		await response.body.cancel();
	}
	if (!response.ok) {
		throw new Error("Failed to create GitHub release");
	}
}

interface GitHubRepository {
	url: string;
	owner: string;
	name: string;
}
