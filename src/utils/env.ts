import dotenv from "dotenv";

dotenv.config();

export const env = (key: string) => {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Environment variable "${key}" is undefined`);
	}
	return value;
};
