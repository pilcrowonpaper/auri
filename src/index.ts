import { addChangeset } from "./changeset.js";
import { ready } from "./ready.js";
import { validateConfig } from "./config.js";

validateConfig();

const nodeArgs = process.execArgv;
const args = process.argv.slice(nodeArgs.length + 2);

const kill = () => process.exit();

if (!args[0]) kill();

if (args[0] === "add") {
	await addChangeset();
}
if (args[0] === "ready") {
	await ready();
}
kill();

export {};
