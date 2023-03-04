import { addChangeset } from "./changeset.js";
import { prepare } from "./prepare.js";
import { config, validateConfig } from "./config.js";
import { publish } from "./publish.js";

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

if (args[0] === "add") {
	if (isDebugEnabled) {
		console.log("running add");
	}
	await addChangeset();
}
if (args[0] === "prepare") {
	if (isDebugEnabled) {
		console.log("running prepare");
	}
	await prepare();
}

if (args[0] === "publish") {
	if (isDebugEnabled) {
		console.log("running publish");
	}
	await publish();
}

kill();
