import { publish } from "./scripts/publish.js";
// import { listPackages } from "./scripts/list.js";
// import { addReleaseConfig } from "./scripts/release-config.js";
import { prepareRelease } from "./scripts/prepare.js";
import { addChangeset } from "./scripts/add.js";

const nodeArgs = process.execArgv;
const args = process.argv.slice(nodeArgs.length + 2);

const kill = () => process.exit();

if (!args[0]) kill();

const baseArg = args[0];

if (baseArg === "add") {
	const type = args.at(1) ?? null;
	if (type === null) {
		throw new Error("Missing arguments");
	}
	if (type !== "patch" && type !== "minor" && type !== "next") {
		throw new Error("Invalid argument");
	}
	await addChangeset(type);
}

if (baseArg === "prepare") {
	const branch = args.at(1) ?? null;
	if (branch === null) {
		throw new Error("Missing arguments");
	}
	await prepareRelease(branch);
}

if (baseArg === "publish") {
	await publish();
}

kill();
