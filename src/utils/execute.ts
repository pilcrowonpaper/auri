import childProcess from "child_process";

export const execute = (
	command: string,
	options?: {
		cwd?: string;
	}
) => {
	const stdout = childProcess.execSync(command, options);
	process.stdout.write(stdout);
};

export const pnpm = (
	command: string,
	options?: {
		cwd?: string;
	}
) => {
	execute(["pnpm", command].join(" "), options);
};
