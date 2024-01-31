import fs from "fs/promises";

export async function dirExists(path: string): Promise<boolean> {
	return await fs
		.stat(path)
		.then((stat) => stat.isDirectory())
		.catch(() => false);
}

export async function fileExists(path: string): Promise<boolean> {
	return await fs
		.stat(path)
		.then((stat) => stat.isFile())
		.catch(() => false);
}
