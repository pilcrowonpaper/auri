import { addChangeset } from "./scripts/add.js";
import { prepare } from "./scripts/prepare.js";
import { config, validateConfig } from "./shared/config.js";
import { publish } from "./scripts/publish.js";
import { listPackages } from "./scripts/list.js";
import { addReleaseConfig } from "./scripts/release-config.js";

validateConfig();

const isDebugEnabled = config("debug") ?? false;

const nodeArgs = process.execArgv;
const args = process.argv.slice(nodeArgs.length + 2);

if (isDebugEnabled) {
	console.log("running auri");
	console.log(`args: ${args}`);
}

const kill = () => process.exit();

console.log(args);

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

if (baseArg === "release-config") {
	if (isDebugEnabled) {
		console.log("release-config");
	}
	await addReleaseConfig();
}

kill();
