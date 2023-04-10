import fs from "fs";
import path from "path";
import { error } from "./error.js";
import { config } from "../utils/config.js";
import ignore from "ignore";
import { AURI_DEPLOY_COMMAND, AURI_PUBLISH_COMMAND } from "./constant.js";

export type Package = {
	name: string;
	packageJsonPath: string;
	version: string;
	directoryPath: string;
	config: PackageConfig;
};

type PackageConfig = {
	name?: string;
	version?: string;
	scripts?: Record<string, string>;
};

const isDebugEnabled = config("debug") ?? false;

export const getPackages = (): Package[] => {
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
		const parsedConfig = JSON.parse(file.toString()) as PackageConfig;
		return {
			packageJsonPath: absolutePath,
			directoryPath: absolutePath.split("/").slice(0, -1).join("/"),
			name: parsedConfig.name ?? "",
			version: parsedConfig.version ?? "",
			config: parsedConfig
		};
	});
};

const ignoreConfig = config("ignore") ?? [];
const ignoreConfigAbsolutePaths = ignoreConfig.map((configPath) =>
	path.join(process.cwd(), configPath)
);

const readdirRecursiveFileSync = (
	workingAbsolutePath = process.cwd()
): string[] => {
	const ig = ignore();
	const defaultIgnoreAbsolutePaths = ["node_modules", ".git"].map((item) =>
		path.join(workingAbsolutePath, item)
	);
	const ignoreItemAbsolutePaths = [
		...ignoreConfigAbsolutePaths,
		...defaultIgnoreAbsolutePaths
	];
	// ignore only accepts relative paths :(
	ig.add(
		ignoreItemAbsolutePaths.map((val) => {
			if (val.includes("!"))
				return `!.${val.replace("/", "").replace("!", "")}`;
			return `.${val.replace("/", "")}`;
		})
	);
	const absoluteFilePaths: string[] = [];
	const dirItemNames = fs.readdirSync(workingAbsolutePath);
	for (const itemName of dirItemNames) {
		const absoluteItemPath = path.join(workingAbsolutePath, itemName);
		const stat = fs.lstatSync(absoluteItemPath);
		const ignoreItem = ig.ignores(`.${absoluteItemPath.replace("/", "")}`);
		if (ignoreItem) continue;
		if (stat.isFile()) {
			absoluteFilePaths.push(absoluteItemPath);
			continue;
		}
		if (stat.isDirectory()) {
			const nestedItemPaths = readdirRecursiveFileSync(absoluteItemPath);
			absoluteFilePaths.push(...nestedItemPaths);
		}
	}
	return absoluteFilePaths;
};

export const getPackage = (packageName: string) => {
	const packages = getPackages();
	const searchResult = packages.find((pkg) => pkg.name === packageName) ?? null;
	if (!searchResult) return error(`Package ${packageName} does not exist`);
	return searchResult;
};

export const getProjectPackageConfig = () => {
	const packageJsonPath = path.join(process.cwd(), "package.json");
	try {
		const file = fs.readFileSync(packageJsonPath);
		const parsedConfig = JSON.parse(file.toString()) as PackageConfig;
		return parsedConfig;
	} catch {
		return error(`package.json does not exist`);
	}
};

export const getPublicPackages = (packages: Package[]) => {
	return packages.filter((pkg) => {
		return AURI_PUBLISH_COMMAND in (pkg.config.scripts ?? {});
	});
};

export const getDocumentationPackages = (packages: Package[]) => {
	return packages.filter((pkg) => {
		return AURI_DEPLOY_COMMAND in (pkg.config.scripts ?? {});
	});
};
