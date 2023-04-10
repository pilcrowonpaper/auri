import {
	Package,
	getDocumentationPackages,
	getPackages,
	getPublicPackages
} from "../shared/project.js";

export const listPackages = async () => {
	const logPackages = (packages: Package[]) => {
		for (const pkg of packages) {
			console.log({
				name: pkg.name,
				packageJson: pkg.packageJsonPath
			});
		}
	};
	const packages = getPackages();
	const publicPackages = getPublicPackages(packages);
	const documentationPackages = getDocumentationPackages(packages);
	console.log("Public packages");
	logPackages(publicPackages);
	console.log("Documentation packages");
	logPackages(documentationPackages);
};
