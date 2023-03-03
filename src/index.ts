import { addChangeset } from "./changeset.js";
import { prepare } from "./prepare.js";
import { validateConfig } from "./config.js";

validateConfig();

const nodeArgs = process.execArgv;
console.log(nodeArgs)
const args = process.argv.slice(nodeArgs.length + 2);
console.log(args)

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
