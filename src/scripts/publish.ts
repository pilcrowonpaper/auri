import fs from "fs/promises";
import { execute } from "../utils/execute.js";

export async function publish() {
	const packageJSON = await fs.readFile("package.json");
	const parsedPackageJSON: object = JSON.parse(packageJSON.toString());
	if (!("name" in parsedPackageJSON && typeof parsedPackageJSON.name === "string")) {
		throw new Error('package.json missing field "name"');
	}
	if (!("version" in parsedPackageJSON && typeof parsedPackageJSON.version === "string")) {
		throw new Error('package.json missing field "version"');
	}

	const published = await isPublished(parsedPackageJSON.name, parsedPackageJSON.version);
	if (published) {
		return;
	}

	if (parsedPackageJSON.version.includes(".next-")) {
		execute("npm run build && npm publish --access public --tag next");
	} else {
		execute("npm run build && npm publish --access public");
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
