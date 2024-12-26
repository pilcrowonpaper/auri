import dotenv from "dotenv";

dotenv.config();

export function env(key: string): string {
	if (key in process.env && typeof process.env[key] === "string") {
		return process.env[key] as string;
	}
	throw new Error(`Environment variable "${key}" is undefined`);
}
