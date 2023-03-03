import { config } from "./config.js";
import { execute } from "./execute.js";

export const formatRepository = () => {
	const formatCommand = config("format_command");
	if (!formatCommand) return;
	execute(formatCommand);
};
