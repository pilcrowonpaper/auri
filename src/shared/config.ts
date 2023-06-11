import fs from "fs";
import path from "path";
import { AURI_DIR } from "./constant.js";
import { error } from "./error.js";

type Config = {
	repository: string;
	debug?: boolean;
};

type ReleaseConfig = {
	stage: "stable" | "beta";
};

const configFilePath = path.resolve(path.join(AURI_DIR, "config.json"));
const releaseConfigFilePath = path.resolve(
	path.join(AURI_DIR, "release.config.json")
);

type FlatKey<T extends {}> = {
	[K in keyof Required<T>]: K extends string
		? T[K] extends string | boolean | undefined | any[]
			? K
			: Required<T>[K] extends {}
			? `${K}.${FlatKey<Required<Required<T>[K]>>}`
			: never
		: never;
}[keyof Required<T>];

type ExtractValueFromFlatKey<
	Obj extends any,
	FK extends string
> = FK extends `${infer KeyA}.${infer KeyRest}`
	? KeyA extends keyof Obj
		? Exclude<Obj[KeyA], {}> extends never
			? ExtractValueFromFlatKey<Required<Obj>[KeyA], KeyRest>
			: ExtractValueFromFlatKey<Required<Obj>[KeyA], KeyRest> | undefined
		: never
	: FK extends keyof Obj
	? Obj[FK]
	: never;

export const config = <K extends FlatKey<Config>>(key: K) => {
	const configJsonFile = fs.readFileSync(configFilePath);
	const configJson = configJsonFile.toString();
	const parseConfig = JSON.parse(configJson) as Config;
	const pathSegments = key.split(".");
	let result = parseConfig as Record<string, any>;
	for (const segment of pathSegments) {
		result = result[segment];
		if (result === undefined || typeof result === "string") break;
	}

	return result as any as ExtractValueFromFlatKey<Config, K>;
};
export const releaseConfig = <K extends FlatKey<ReleaseConfig>>(key: K) => {
	const configJsonFile = readReleaseConfigFile();
	if (!configJsonFile) return undefined;
	const configJson = configJsonFile.toString();
	const parseConfig = JSON.parse(configJson) as ReleaseConfig;
	const pathSegments = key.split(".");
	let result = parseConfig as Record<string, any>;
	for (const segment of pathSegments) {
		result = result[segment];
		if (result === undefined || typeof result === "string") break;
	}

	return result as any as ExtractValueFromFlatKey<ReleaseConfig, K>;
};

export const validateConfig = () => {
	if (!fs.existsSync(configFilePath)) error(".auri/config.json does not exist");
	const configJsonFile = fs.readFileSync(configFilePath);
	const configJson = configJsonFile.toString();
	const parsedConfig = JSON.parse(configJson) as Partial<Config>;
	if (!("repository" in parsedConfig)) {
		return error(`"repository" is not defined in .auri/config.json`);
	}
};

const readReleaseConfigFile = () => {
	try {
		const releaseConfigJsonFile = fs.readFileSync(releaseConfigFilePath);
		const configJson = releaseConfigJsonFile.toString();
		return configJson;
	} catch {
		return null;
	}
};

export const validateReleaseConfig = () => {
	if (!fs.existsSync(releaseConfigFilePath)) return;
	const configJson = readReleaseConfigFile();
	if (!configJson) return;
	const parsedConfig = JSON.parse(configJson) as Partial<ReleaseConfig>;
	if (parsedConfig.stage !== "stable" && parsedConfig.stage !== "beta") {
		return error(`Invalid "stage" value in .auri/release.config.json`);
	}
};
