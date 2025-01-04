import * as vitest from "vitest";

import { parseGitHubGitRepositoryURL, GitHubRepository } from "./github.js";

vitest.test("parseGitHubGitRepositoryURL()", () => {
	const expected: GitHubRepository = {
		gitURL: "https://github.com/foo/bar.git",
		owner: "foo",
		name: "bar"
	};
	vitest
		.expect(parseGitHubGitRepositoryURL("https://github.com/foo/bar.git"))
		.toStrictEqual(expected);

	vitest.expect(() => parseGitHubGitRepositoryURL("https://github.com/foo/bar")).toThrowError();
});
