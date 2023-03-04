import { addChangeset } from "./changeset.js";
import { prepare } from "./prepare.js";
import { config, validateConfig } from "./config.js";
import { publish } from "./publish.js";
import { listPackages } from "./list.js";

validateConfig();

const isDebugEnabled = config("debug") ?? false;

const nodeArgs = process.execArgv;
const args = process.argv.slice(nodeArgs.length + 2);

if (isDebugEnabled) {
	console.log("running auri");
	console.log(nodeArgs);
	console.log(args);
}

const kill = () => process.exit();

if (!args[0]) kill();

const baseArg = args[0];

if (baseArg === "add") {
	if (isDebugEnabled) {
		console.log("running add");
	}
	await addChangeset();
}
if (baseArg === "prepare") {
	if (isDebugEnabled) {
		console.log("running prepare");
	}
	await prepare();
}

if (baseArg === "publish") {
	if (isDebugEnabled) {
		console.log("running publish");
	}
	await publish();
}

if (baseArg === "list") {
	if (isDebugEnabled) {
		console.log("running list");
	}
	await listPackages();
}

kill();
