import childProcess from "child_process";

export const execute = (
	commands: string[],
	options?: {
		cwd?: string;
	}
) => {
	for (const command of commands) {
		childProcess.execSync(command, options);
	}
};
