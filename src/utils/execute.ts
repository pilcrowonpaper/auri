import childProcess from "child_process";

import { error } from "../shared/error.js";

export const execute = (
	command: string,
	options?: {
		cwd?: string;
	}
) => {
	try {
		childProcess.execSync(command, options);
	} catch (e) {
		const result = e as {
			stderr: null | Buffer;
		};
		if (result.stderr) {
			return error(result.stderr.toString());
		}
		return error("An unknown error occurred");
	}
};

export const pnpm = (
	command: string,
	options?: {
		cwd?: string;
	}
) => {
	execute(["pnpm", command].join(" "), options);
};

export const exit = () => {
	process.exitCode = 0;
};
