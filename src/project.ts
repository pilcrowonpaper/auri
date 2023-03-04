import fs from "fs";
import path from "path";
import { error } from "./error.js";
import { config } from "./config.js";

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

const isDebugEnabled = config("debug") ?? false;

export const getPackages = async (): Promise<Package[]> => {
	const workspaceFileRelativePaths = readdirRecursiveFileSync();
	const packageJsonRelativePaths = workspaceFileRelativePaths.filter(
		(relativePath) => {
			return relativePath.split("/").at(-1) === "package.json";
		}
	);
	if (isDebugEnabled) {
		console.log("package.json in repository");
		console.log(packageJsonRelativePaths);
	}

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

const readdirRecursiveFileSync = (
	workingAbsolutePath = process.cwd()
): string[] => {
	const ignoreItemRelativePaths = [".git"];
	const gitignoreFilePath = path.join(workingAbsolutePath, ".gitignore");

	if (fs.existsSync(gitignoreFilePath)) {
		const file = fs.readFileSync(gitignoreFilePath);
		const fileText = file.toString();
		ignoreItemRelativePaths.push(
			...fileText.split("\n").filter((val) => !!val && !val.startsWith("#"))
		);
	}
	const ignoreItemAbsolutePaths = ignoreItemRelativePaths
		.map((relativePath) => path.join(workingAbsolutePath, relativePath))
		.map((filePath) => {
			if (!filePath.endsWith("/")) return filePath;
			return filePath.slice(0, -1);
		})
		.filter((path) => path !== workingAbsolutePath);
	const absoluteFilePaths: string[] = [];
	const dirItemNames = fs.readdirSync(workingAbsolutePath);
	for (const itemName of dirItemNames) {
		const absoluteItemPath = path.join(workingAbsolutePath, itemName);
		const stat = fs.lstatSync(absoluteItemPath);
		if (stat.isFile() && !ignoreItemAbsolutePaths.includes(absoluteItemPath)) {
			absoluteFilePaths.push(absoluteItemPath);
			continue;
		}
		if (stat.isFile()) continue;
		const isDir = stat.isDirectory();
		const ignoreDir =
			isDir &&
			ignoreItemAbsolutePaths.some((itemPath) =>
				absoluteItemPath.startsWith(itemPath)
			);
		if (isDir && !ignoreDir) {
			const nestedItemPaths = readdirRecursiveFileSync(absoluteItemPath);
			absoluteFilePaths.push(...nestedItemPaths);
		}
	}
	return absoluteFilePaths;
};

export const getPackage = async (packageName: string) => {
	const packages = await getPackages();
	const searchResult = packages.find((pkg) => pkg.name === packageName) ?? null;
	if (!searchResult) return error(`Package ${packageName} does not exist`);
	return searchResult;
};
