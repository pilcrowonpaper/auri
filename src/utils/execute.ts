import childProcess from "child_process";

export const execute = (
	command: string,
	options?: {
		cwd?: string;
	}
) => {
	try {
		childProcess.execSync(command, options);
	} catch (e) {
		const error = e as {
			stderr: null | Buffer;
		};
		if (error.stderr) {
			console.log(error.stderr.toString());
		}
		exit();
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
