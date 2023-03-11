import path from "path";
import { config } from "./config.js";
import { execute } from "./execute.js";

export const deploy = () => {
	const documentationLocations = config("documentation") ?? [];
	const documentationAbsolutePaths = documentationLocations.map((location) =>
		path.join(process.cwd(), location)
	);
	for (const documentationAbsolutePath of documentationAbsolutePaths) {
		execute(["pnpm auri.deploy"], {
			cwd: documentationAbsolutePath
		});
	}
};
