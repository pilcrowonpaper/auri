import fs from "fs";
import path from "path";
import { error } from "./error";

export type Package = {
	name: string;
	packageJsonPath: string;
	version: string;
	directoryPath: string;
	config: {
		name?: string;
		version?: string;
	};
};

export const getPackages = async (): Promise<Package[]> => {
	const workspaceFileRelativePaths = readdirRecursiveFileSync();
	const packageJsonRelativePaths = workspaceFileRelativePaths.filter(
		(relativePath) => {
			return relativePath.split("/").at(-1) === "package.json";
		}
	);
	return packageJsonRelativePaths.map((relativePath) => {
		const absolutePath = path.resolve(process.cwd(), relativePath);
		const file = fs.readFileSync(absolutePath);
		const parsedConfig = JSON.parse(file.toString()) as {
			name: string;
			version?: string;
		};
		return {
			packageJsonPath: absolutePath,
			directoryPath: absolutePath.split("/").slice(0, -1).join("/"),
			name: parsedConfig.name ?? "",
			version: parsedConfig.version ?? "",
			config: parsedConfig
		};
	});
};

const getGitignoreItemPaths = () => {
	const ignoreItemRelativePaths = [".git"];
	if (fs.existsSync(path.resolve(".gitignore"))) {
		const file = fs.readFileSync(path.resolve(".gitignore"));
		const fileText = file.toString();
		ignoreItemRelativePaths.push(...fileText.split("\n"));
	}
	return ignoreItemRelativePaths.map((relativePath) =>
		path.resolve(relativePath)
	);
};

const readdirRecursiveFileSync = (absolutePath = process.cwd()) => {
	const ignoreItemAbsolutePaths = getGitignoreItemPaths();
	const relativeFilePaths: string[] = [];
	const dirItemNames = fs.readdirSync(absolutePath);
	for (const itemName of dirItemNames) {
		const absoluteItemPath = path.resolve(absolutePath, itemName);
		const relativeItemPath = path.relative(process.cwd(), absoluteItemPath);
		const stat = fs.lstatSync(path.resolve(relativeItemPath));
		if (stat.isFile()) {
			relativeFilePaths.push(relativeItemPath);
		}
		const isDir = stat.isDirectory();
		const ignoreDir =
			isDir &&
			ignoreItemAbsolutePaths.some((itemPath) =>
				absoluteItemPath.startsWith(itemPath)
			);
		if (isDir && !ignoreDir) {
			const nestedItemPaths = readdirRecursiveFileSync(absoluteItemPath);
			relativeFilePaths.push(...nestedItemPaths);
		}
	}
	return relativeFilePaths;
};

export const getPackage = async (packageName: string) => {
	const packages = await getPackages();
	const searchResult = packages.find((pkg) => pkg.name === packageName) ?? null;
	if (!searchResult) return error(`Package ${packageName} does not exist`);
	return searchResult;
};
