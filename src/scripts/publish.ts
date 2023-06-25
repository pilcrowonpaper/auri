import fs from "fs";
import path from "path";

import { config } from "../shared/config.js";
import {
	AURI_DIR,
	AURI_PUBLISH_SETUP_SCRIPT,
	PNPM_BETA_PUBLISH_COMMAND,
	PNPM_PUBLISH_COMMAND,
	AURI_BUILD_SCRIPT
} from "../shared/constant.js";
import { deploy } from "../shared/deploy.js";
import { error } from "../shared/error.js";
import { pnpm } from "../utils/execute.js";
import {
	getPackages,
	getProjectPackageConfig,
	getPublicPackages
} from "../shared/project.js";

const isDebugEnabled = config("debug") ?? false;

const publishSetup = () => {
	const projectPackageConfig = getProjectPackageConfig();
	const projectScripts = projectPackageConfig.scripts ?? {};
	const commandDefined = AURI_PUBLISH_SETUP_SCRIPT in projectScripts;
	if (!commandDefined) return;
	pnpm(AURI_PUBLISH_SETUP_SCRIPT);
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
		const workingVersion = pkg.version;

		const isPublished = async () => {
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
				time: Record<string, string>;
			};
			const publishedVersions = Object.keys(npmRegistry.time);
			return publishedVersions.includes(workingVersion);
		};

		if (isDebugEnabled) {
			console.log(`working package: ${pkg.name}`);
			console.log(`working version : ${workingVersion}`);
		}

		const alreadyPublished = await isPublished();
		if (alreadyPublished) continue;

		pnpm(AURI_BUILD_SCRIPT, {
			cwd: pkg.directoryPath
		});

		const betaVersion = workingVersion.includes("beta");

		if (betaVersion) {
			pnpm(PNPM_BETA_PUBLISH_COMMAND, {
				cwd: pkg.directoryPath
			});
		} else {
			pnpm(PNPM_PUBLISH_COMMAND, {
				cwd: pkg.directoryPath
			});
		}
	}
	deploy();
};
