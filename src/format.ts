import { config } from "./config.js";
import { execute } from "./execute.js";

export const formatRepository = () => {
	const formatCommand = config("scripts.format");
	if (!formatCommand) return;
	execute([formatCommand]);
};
