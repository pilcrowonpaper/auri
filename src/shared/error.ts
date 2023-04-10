import core from "@actions/core";

export const error = (errorMessage: string, details?: string): never => {
	core.error(errorMessage);
	if (details) {
		core.debug(details);
	}
	process.exit();
};
