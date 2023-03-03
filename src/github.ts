import { config } from "./config.js";
import path from "path";
import { env } from "./env.js";

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
	const GITHUB_TOKEN = env("CELA_GITHUB_TOKEN");
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
		throw new GithubApiError(errorMessage, status);
	}
	return (await response.json()) as T;
};

export class GithubApiError extends Error {
	public status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

export const getUser = async () => {
	try {
		const user = await githubApiRequest<{
			login: string;
			email: string;
		}>(["user"], {
			method: "GET"
		});
		return {
			username: user.login,
			email: user.email
		};
	} catch (e) {
		console.log(e);
		throw new Error();
	}
};
