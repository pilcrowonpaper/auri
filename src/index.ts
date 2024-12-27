#!/usr/bin/env node
import { publishScript } from "./scripts/publish.js";
import { generateScript } from "./scripts/generate.js";

// TODO: Add --github-actions flag to format errors
// TODO: Add --build-command parameter to pass custom build command
async function main(): Promise<void> {
	const nodeArgs = process.execArgv;
	const args = process.argv.slice(nodeArgs.length + 2);

	if (args[0] === "generate") {
		try {
			await generateScript();
		} catch (e) {
			let message = "An unknown error occurred";
			if (e instanceof Error) {
				message = e.message;
			}
			process.stderr.write(`::error ::${message}`);
			return process.exit();
		}
		return process.exit();
	}

	if (args[0] === "publish") {
		try {
			await publishScript();
		} catch (e) {
			let message = "An unknown error occurred";
			if (e instanceof Error) {
				message = e.message;
			}
			process.stderr.write(`::error ::${message}`);
			return process.exit();
		}
		return process.exit();
	}
}

main();
