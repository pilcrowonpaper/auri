import childProcess from "child_process";

export const execute = (
	command: string,
	options?: {
		cwd?: string;
	}
) => {
	childProcess.execSync(command, options);
};

export const pnpm = (
	command: string,
	options?: {
		cwd?: string;
	}
) => {
	execute(["pnpm", command].join(" "), options);
};
