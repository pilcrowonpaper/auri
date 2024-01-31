import fs from "fs/promises";
import { execute } from "../utils/execute.js";
import { createRelease } from "../utils/github.js";
import { parsePackageJSON } from "../utils/package.js";

export async function publish(branch: string) {
	const packageMeta = await parsePackageJSON();

	const published = await isPublished(packageMeta.name, packageMeta.version);
	if (published) {
		return;
	}

	if (packageMeta.version.includes("-next.")) {
		execute("npm install && npm run build && npm publish --access public --tag next");
		const body = await getLatestChangelogBody();
		await createRelease(packageMeta.repository, branch, packageMeta.version, {
			body,
			prerelease: true
		});
	} else if (branch === "main" || branch === "master") {
		execute("npm install && npm run build && npm publish --access public");
		const body = await getLatestChangelogBody();
		await createRelease(packageMeta.repository, branch, packageMeta.version, {
			body
		});
	} else if (branch.startsWith("v")) {
		const majorVersion = Number(branch.replace("v", ""));
		if (!isNaN(majorVersion) && Math.trunc(majorVersion) === majorVersion) {
			execute(
				`npm install && npm run build && npm publish --access public --tag v${majorVersion}-latest`
			);
			const body = await getLatestChangelogBody();
			await createRelease(packageMeta.repository, branch, packageMeta.version, {
				body,
				latest: false
			});
		}
	}
}

async function isPublished(name: string, version: string) {
	const npmRegistryUrl = new URL(name, "https://registry.npmjs.org");
	const npmRegistryResponse = await fetch(npmRegistryUrl);
	if (!npmRegistryResponse.ok) {
		if (npmRegistryResponse.status === 404) return null;
		throw new Error("Failed to fetch NPM data");
	}
	const npmRegistry: Registry = await npmRegistryResponse.json();
	const publishedVersions = Object.keys(npmRegistry.time);
	return publishedVersions.includes(version);
}

interface Registry {
	time: Record<string, string>;
}

async function getLatestChangelogBody() {
	const changelogFile = await fs.open("CHANGELOG.md");
	let content = "";
	let open = false;
	for await (const line of changelogFile.readLines()) {
		if (line.startsWith("## ")) {
			if (open) {
				break;
			} else {
				open = true;
			}
		} else if (open) {
			content += line + "\n";
		}
	}
	await changelogFile.close();
	return content;
}
