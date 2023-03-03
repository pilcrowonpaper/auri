import fs from "fs";
import path from "path";
import { CELA_DIR } from "./constant.js";

type Config = {
	repository: string;
	format_command?: string
};

const configFilePath = path.resolve(path.join(CELA_DIR, "config.json"));

export const config = <K extends keyof Config>(key: K) => {
	const configJsonFile = fs.readFileSync(configFilePath);
	const configJson = configJsonFile.toString();
	const parseConfig = JSON.parse(configJson) as Config;
	return parseConfig[key];
};

export const validateConfig = () => {
	if (!fs.existsSync(configFilePath))
		throw new Error(".cela/config.json does not exist");
	const configJsonFile = fs.readFileSync(configFilePath);
	const configJson = configJsonFile.toString();
	const parsedConfig = JSON.parse(configJson) as Partial<Config>;
	if (!("repository" in parsedConfig))
		throw new Error(`"repository" is not defined in .cela/config.json`);
};
