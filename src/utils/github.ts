export function parseGitHubGitRepositoryURL(url: string): GitHubRepository {
	if (!url.endsWith(".git")) {
		throw new Error("Invalid repository URL");
	}
	const parsed = new URL(url);
	if (parsed.origin !== "https://github.com") {
		throw new Error("Invalid GitHub repository URL");
	}
	const pathnameParts = parsed.pathname.split("/").slice(1);
	if (pathnameParts.length < 2) {
		throw new Error("Invalid GitHub repository URL");
	}
	const repositoryName = pathnameParts[1].slice(0, -4);
	const repository: GitHubRepository = {
		gitURL: url,
		owner: pathnameParts[0],
		name: repositoryName
	};
	return repository;
}

export interface GitHubRepository {
	gitURL: string;
	owner: string;
	name: string;
}
