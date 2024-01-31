import { env } from "./env.js";

export async function getPullRequestFromBranches(
	repository: Repository,
	head: string,
	base: string
): Promise<PullRequest | null> {
	const token = env("AURI_GITHUB_TOKEN");
	const url = new URL(`https://api.github.com/repos/${repository.owner}/${repository.name}/pulls`);
	url.searchParams.set("head", head);
	url.searchParams.set("base", base);
	url.searchParams.set("state", "open");
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/json"
		}
	});
	if (!response.ok) {
		throw new Error("Failed to fetch data from GitHub");
	}
	const existingPullRequests: GitHubPullRequestBody[] = await response.json();
	const githubPullRequest = existingPullRequests.at(0) ?? null;
	if (!githubPullRequest) {
		return null;
	}
	const pullRequest: PullRequest = {
		number: githubPullRequest.number,
		userId: githubPullRequest.user.id
	};
	return pullRequest;
}

export async function createPullRequest(
	repository: Repository,
	title: string,
	head: string,
	base: string,
	options?: {
		body?: string;
	}
): Promise<PullRequest> {
	const token = env("AURI_GITHUB_TOKEN");
	const url = new URL(`https://api.github.com/repos/${repository.owner}/${repository.name}/pulls`);
	const body = JSON.stringify({
		head,
		base,
		title,
		body: options?.body
	});
	const response = await fetch(url, {
		method: "POST",
		body,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/json"
		}
	});
	if (!response.ok) {
		throw new Error("Failed to fetch data from GitHub");
	}
	const githubPullRequest: GitHubPullRequestBody = await response.json();
	const pullRequest: PullRequest = {
		number: githubPullRequest.number,
		userId: githubPullRequest.user.id
	};
	return pullRequest;
}

export async function updatePullRequest(
	repository: Repository,
	pullRequestNumber: number,
	options?: {
		title?: string;
		body?: string;
	}
): Promise<void> {
	const token = env("AURI_GITHUB_TOKEN");
	const url = new URL(
		`https://api.github.com/repos/${repository.owner}/${repository.name}/pulls/${pullRequestNumber}`
	);
	const body = JSON.stringify({
		title: options?.title,
		body: options?.body
	});
	const response = await fetch(url, {
		method: "PATCH",
		body,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/json"
		}
	});
	if (!response.ok) {
		throw new Error("Failed to fetch data from GitHub");
	}
}

export interface PullRequest {
	number: number;
	userId: number;
}

interface GitHubPullRequestBody {
	number: number;
	user: GitHubUserBody;
}

interface GitHubUserBody {
	id: number;
	login: string;
}

export function parseRepositoryURL(repositoryURL: string): Repository | null {
	const parsed = safeParseURL(repositoryURL);
	if (!parsed || parsed.origin !== "https://github.com") {
		return null;
	}
	const pathnameParts = parsed.pathname.replace("/", "").split("/");
	if (pathnameParts.length < 2) {
		return null;
	}
	const repository: Repository = {
		owner: pathnameParts[0],
		name: pathnameParts[1]
	};
	return repository;
}

export interface Repository {
	owner: string;
	name: string;
}

function safeParseURL(url: string): URL | null {
	try {
		return new URL(url);
	} catch {
		return null;
	}
}
