import dotenv from "dotenv";
import { error } from "./error";
dotenv.config();

type EnvVar = "AURI_GITHUB_TOKEN";

export const env = (key: EnvVar) => {
	const value = process.env[key];
	if (!value) error(`Environment variable "${key}" is undefined`);
	return value;
};
