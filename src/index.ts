#!/usr/bin/env node
import { publishScript } from "./scripts/publish.js";
import { generateScript } from "./scripts/generate.js";

const nodeArgs = process.execArgv;
const args = process.argv.slice(nodeArgs.length + 2);

// TODO: Add --github-actions flag to format errors
// process.on("uncaughtException", (e) => {
// 	// show error in GitHub actions
// 	process.stderr.write(`::error ::${e.message}`);
// 	process.exit();
// });

if (args[0] === "generate") {
	await generateScript();
	process.exit();
}

if (args[0] === "publish") {
	await publishScript();
	process.exit();
}
