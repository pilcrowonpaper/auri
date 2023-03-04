import dotenv from "dotenv";
dotenv.config();

type EnvVar = "AURI_GITHUB_TOKEN";

export const env = (key: EnvVar) => {
	const value = process.env[key];
	if (!value) throw new Error(`Environment variable "${key}" is undefined`);
	return value;
};
