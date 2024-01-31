import fs from "fs/promises";
import { parseRepositoryURL } from "../utils/github.js";

import type { Repository } from "../utils/github.js";

export async function parsePackageJSON(): Promise<PackageMeta> {
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
    return packageMeta
}

export interface PackageMeta {
	name: string;
	version: string;
	repository: Repository;
}
