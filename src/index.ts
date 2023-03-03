import { addChangeset } from "./changeset.js";
import { prepare } from "./prepare.js";
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
	await prepare();
}
kill();

export {};
