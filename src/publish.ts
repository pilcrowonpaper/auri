import { execute } from "./execute.js";
import { getPackages } from "./project.js";

export const publish = async () => {
	const packages = await getPackages();
	for (const pkg of packages) {
		const getPublishedVersion = async () => {
			const npmRegistryUrl = new URL(pkg.name, "https://registry.npmjs.org");
			const npmRegistryResponse = await fetch(npmRegistryUrl);
			if (!npmRegistryResponse.ok) {
				if (npmRegistryResponse.status === 404) return null;
				throw new Error();
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
		const workingVersion = pkg.version;
		console.log(publishedVersion, workingVersion);
		if (publishedVersion === workingVersion) continue;
		const baseLocation = process.cwd();
		execute(
			`cd ${pkg.directoryPath}`,
			"pnpm cela.publish",
			`cd ${baseLocation}`
		);
	}
};
