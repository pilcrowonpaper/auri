import { getPackages } from "./project.js";

export const listPackages = async () => {
	const packages = await getPackages();
	for (const pkg of packages) {
		console.log({
            name: pkg.name,
            packageJson: pkg.packageJsonPath
        });
	}
};
