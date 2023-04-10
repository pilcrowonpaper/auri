import { AURI_DEPLOY_COMMAND } from "./constant.js";
import { pnpm } from "../utils/execute.js";
import { getPackages } from "./project.js";

export const deploy = () => {
	const packages = getPackages();
	const documentationPackages = packages.filter((pkg) => {
		return AURI_DEPLOY_COMMAND in (pkg.config.scripts ?? {});
	});
	for (const pkg of documentationPackages) {
		pnpm(AURI_DEPLOY_COMMAND, {
			cwd: pkg.directoryPath
		});
	}
};
