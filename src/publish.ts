import { AURI_DIR } from "./constant.js";
import { error } from "./error.js";
import { execute } from "./execute.js";
import { getPackages } from "./project.js";
import fs from "fs";
import path from "path";

export const publish = async () => {
	const logFileNames = fs
		.readdirSync(path.resolve(AURI_DIR))
		.filter((contentName) => {
			return contentName.startsWith("$") && contentName.endsWith(".md");
		});
	if (logFileNames.length > 0) return;

	const packages = await getPackages();
	for (const pkg of packages) {
		const getPublishedVersion = async () => {
			const npmRegistryUrl = new URL(pkg.name, "https://registry.npmjs.org");
			const npmRegistryResponse = await fetch(npmRegistryUrl);
			if (!npmRegistryResponse.ok) {
				if (npmRegistryResponse.status === 404) return null;
				try {
					const errorData = (await npmRegistryResponse.json()) as {
						error?: string;
					};
					return error(
						`NPM Registry API error: ${npmRegistryResponse.status} - ${
							errorData?.error ?? "Unknown error"
						}`,
						`Unsuccessful response from ${npmRegistryUrl.toString()}`
					);
				} catch {
					return error(
						`NPM Registry API error: ${npmRegistryResponse.status} - Unknown error}`,
						`Unsuccessful response from ${npmRegistryUrl.toString()}`
					);
				}
			}
			const npmRegistry = (await npmRegistryResponse.json()) as {
				versions: Record<string, any>;
			};
			const versionHistory = Object.keys(npmRegistry.versions);
			const latestVersion = versionHistory.at(0);
			if (!latestVersion) return null;
			return latestVersion;
		};
		const publishedVersion = await getPublishedVersion();
		if (publishedVersion === null) continue;
		const workingVersion = pkg.version;
		if (publishedVersion === workingVersion) continue;
		const baseLocation = process.cwd();
		execute("pnpm auri.publish");
		execute(
			`cd ${pkg.directoryPath}`,
			"pnpm auri.publish",
			`cd ${baseLocation}`
		);
	}
};
