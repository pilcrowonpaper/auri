import { pnpm } from "../utils/execute.js";
import { AURI_DEPLOY_SCRIPT } from "./constant.js";
import { getProjectPackageConfig } from "./project.js";

export const formatRepository = () => {
	const projectPackageConfig = getProjectPackageConfig();
	const formatScriptDefined =
		AURI_DEPLOY_SCRIPT in (projectPackageConfig.scripts ?? {});
	if (!formatScriptDefined) return;
	pnpm(AURI_DEPLOY_SCRIPT);
};
