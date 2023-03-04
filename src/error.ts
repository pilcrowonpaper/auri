import core from "@actions/core";
import { GithubApiError } from "./github";

export const error = (errorMessage: string, details?: string): never => {
	core.error(errorMessage);
	if (details) {
		core.debug(details);
	}
	process.exit();
};

export const githubApiError = (errorInstance: GithubApiError): never => {
	return error(
		`Github API error: ${errorInstance.status} - ${errorInstance.message}`,
		`Unsuccessful response from ${errorInstance.url}`
	);
};
