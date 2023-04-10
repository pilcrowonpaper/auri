import { pnpm } from "../utils/execute.js";
import { AURI_FORMAT_COMMAND } from "./constant.js";
import { getProjectPackageConfig } from "./project.js";

export const formatRepository = () => {
	const projectPackageConfig = getProjectPackageConfig();
	const formatScriptDefined =
		AURI_FORMAT_COMMAND in (projectPackageConfig.scripts ?? {});
	if (!formatScriptDefined) return;
	pnpm(AURI_FORMAT_COMMAND);
};
