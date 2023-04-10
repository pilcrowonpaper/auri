import { config } from "../shared/config.js";
import {
	AURI_DIR,
	AURI_PUBLISH_COMMAND,
	AURI_PUBLISH_SETUP_COMMAND
} from "../shared/constant.js";
import { deploy } from "../shared/deploy.js";
import { error } from "../shared/error.js";
import { pnpm } from "../utils/execute.js";
import {
	getPackages,
	getProjectPackageConfig,
	getPublicPackages
} from "../shared/project.js";
import fs from "fs";
import path from "path";

const isDebugEnabled = config("debug") ?? false;

const publishSetup = () => {
	const projectPackageConfig = getProjectPackageConfig();
	const projectScripts = projectPackageConfig.scripts ?? {};
	const commandDefined = AURI_PUBLISH_SETUP_COMMAND in projectScripts;
	if (!commandDefined) return;
	pnpm(AURI_PUBLISH_SETUP_COMMAND);
};

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

	publishSetup();

	const packages = getPackages();
	const publicPackages = getPublicPackages(packages);

	for (const pkg of publicPackages) {
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

		pnpm("AURI_PUBLISH_SCRIPT", {
			cwd: pkg.directoryPath
		});
	}
	deploy();
};
