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
		const result = e as {
			stderr: null | Buffer;
		};
		if (result.stderr) {
			throw new Error(result.stderr.toString());
		}
		throw new Error("An unknown error occurred");
	}
};