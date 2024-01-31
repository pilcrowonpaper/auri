import { publish } from "./scripts/publish.js";
import { prepareRelease } from "./scripts/prepare.js";
import { addChangeset } from "./scripts/add.js";

const nodeArgs = process.execArgv;
const args = process.argv.slice(nodeArgs.length + 2);

process.on("uncaughtException", (e) => {
	// show error in GitHub actions
	process.stderr.write(`::error ::${e.message}`);
	process.exit();
});

if (args[0] === "add") {
	const type = args.at(1) ?? null;
	if (type === null) {
		throw new Error("Missing arguments");
	}
	if (type !== "patch" && type !== "minor" && type !== "next") {
		throw new Error("Invalid argument");
	}
	await addChangeset(type);
}

if (args[0] === "prepare") {
	const branch = args.at(1) ?? null;
	if (branch === null) {
		throw new Error("Missing arguments");
	}
	await prepareRelease(branch);
}

if (args[0] === "publish") {
	const branch = args.at(1) ?? null;
	if (branch === null) {
		throw new Error("Missing arguments");
	}
	await publish(branch);
}

throw new Error(`Unknown command: ${args[0]}`);
