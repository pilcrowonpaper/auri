import { config } from "./config.js";
import path from "path";
import { env } from "./env.js";
import { error } from "../shared/error.js";

export const githubApiError = (errorInstance: GithubApiError): never => {
	return error(
		`Github API error: ${errorInstance.status} - ${errorInstance.message}`,
		`Unsuccessful response from ${errorInstance.url}`
	);
};

export const githubRepositoryApi = (
	...localPathSegments: (string | number)[]
) => {
	const repositoryUrl = new URL(config("repository"));
	const repositoryPathname = repositoryUrl.pathname;
	return ["repos", repositoryPathname, ...localPathSegments];
};

export const githubApiRequest = async <T extends any = void>(
	pathSegments: (string | number)[],
	options:
		| {
				method: "GET";
				queryParameters?: Record<string, any>;
		  }
		| {
				method: "POST" | "PUT" | "DELETE" | "PATCH";
				body?: Record<string, any>;
		  }
) => {
	const url = new URL(
		path.join(...pathSegments.map((val) => val.toString())),
		"https://api.github.com"
	);
	const requestInit = {} as RequestInit;
	const GITHUB_TOKEN = env("AURI_GITHUB_TOKEN");
	requestInit.method = options.method;
	requestInit.headers = {
		Authorization: `Bearer ${GITHUB_TOKEN}`
	};
	if (options.method === "GET") {
		for (const [searchQueryKey, searchQueryValue] of Object.entries(
			options.queryParameters ?? {}
		)) {
			url.searchParams.set(searchQueryKey, searchQueryValue);
		}
	} else {
		requestInit.body = JSON.stringify(options.body ?? {});
	}
	const response = await fetch(url, requestInit);
	if (!response.ok) {
		const status = response.status;
		let errorMessage: string;
		try {
			const errorBody = (await response.json()) as {
				message: string;
			};
			errorMessage = errorBody.message;
		} catch {
			errorMessage = "Unknown error";
		}
		throw new GithubApiError(errorMessage, status, url.toString());
	}
	return (await response.json()) as T;
};

export class GithubApiError extends Error {
	public status: number;
	public url: string;
	constructor(message: string, status: number, url: string) {
		super(message);
		this.status = status;
		this.url = url;
	}
}

export const getUser = async () => {
	const getUsername = async () => {
		try {
			const user = await githubApiRequest<{
				login: string;
				email: string;
			}>(["user"], {
				method: "GET"
			});
			return user.login;
		} catch (e) {
			if (e instanceof GithubApiError) githubApiError(e);
			return error("Unknown error occurred");
		}
	};
	const getUserEmails = async () => {
		try {
			return await githubApiRequest<{ email: string; primary: boolean }[]>(
				["user", "emails"],
				{
					method: "GET"
				}
			);
		} catch (e) {
			if (e instanceof GithubApiError) githubApiError(e);
			return error("Unknown error occurred");
		}
	};

	const username = await getUsername();
	const emails = await getUserEmails();
	const primaryEmail = emails.find((email) => email.primary);
	if (!primaryEmail) return error("Primary email not defined");
	return {
		username,
		email: primaryEmail.email
	};
};
