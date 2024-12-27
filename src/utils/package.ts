export function parsePackageJSON(data: unknown): PackageMetaData {
	if (typeof data !== "object" || data === null) {
		throw new Error("Invalid package.json");
	}

	let name: string;
	if ("name" in data && typeof data.name === "string") {
		name = data.name;
	} else {
		throw new Error("Missing or invalid 'name' field");
	}

	let version: string;
	if ("version" in data && typeof data.version === "string") {
		version = data.version;
	} else {
		throw new Error("Missing or invalid 'version' field");
	}
	if (!/^[a-zA-Z0-9-._]*$/.test(version)) {
		throw new Error("Missing or invalid 'version' field");
	}
	if (version.includes("..")) {
		throw new Error("Missing or invalid 'version' field");
	}

	let repository: string;
	if (
		"repository" in data &&
		typeof data.repository === "object" &&
		data.repository !== null &&
		"url" in data.repository &&
		typeof data.repository.url === "string"
	) {
		repository = data.repository.url;
	} else {
		throw new Error("Missing or invalid 'repository.url' field");
	}
	const metadata: PackageMetaData = {
		name,
		version,
		repository
	};
	return metadata;
}

export interface PackageMetaData {
	name: string;
	version: string;
	repository: string;
}
