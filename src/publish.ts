import { config } from "./config.js";
import { AURI_DIR } from "./constant.js";
import { error } from "./error.js";
import { execute } from "./execute.js";
import { getPackages } from "./project.js";
import fs from "fs";
import path from "path";

const isDebugEnabled = config("debug") ?? false;

export const publish = async () => {
	const logFileNames = fs
		.readdirSync(path.resolve(AURI_DIR))
		.filter((contentName) => {
			return contentName.startsWith("$") && contentName.endsWith(".md");
		});

	if (isDebugEnabled) {
		console.log("log file names");
		console.log(logFileNames);
	}

	if (logFileNames.length > 0) return;

	const publishSetupScript = config("scripts.publish_setup");

	if (isDebugEnabled) {
		console.log(`before_publish: ${publishSetupScript}`);
	}

	if (publishSetupScript) {
		execute(publishSetupScript);
	}

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
				"dist-tags": {
					latest: string;
				};
			};
			const latestVersion = npmRegistry["dist-tags"].latest;
			if (!latestVersion) return null;
			return latestVersion;
		};
		const publishedVersion = await getPublishedVersion();
		const workingVersion = pkg.version;

		if (isDebugEnabled) {
			console.log(`working package: ${pkg.name}`);
			console.log(`published version : ${publishedVersion}`);
			console.log(`working version : ${workingVersion}`);
		}
		if (publishedVersion === null) continue;
		if (publishedVersion === workingVersion) continue;
		const baseLocation = process.cwd();
		execute(
			`cd ${pkg.directoryPath}`,
			"pnpm auri.publish",
			`cd ${baseLocation}`
		);
	}
};
