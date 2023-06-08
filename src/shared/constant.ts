import path from "path";

export const AURI_DIR = ".auri";
export const AURI_PUBLISH_COMMAND = "auri.publish";
export const AURI_DEPLOY_COMMAND = "auri.deploy";
export const AURI_FORMAT_COMMAND = "auri.format";
export const AURI_PUBLISH_SETUP_COMMAND = "auri.project_setup";

export const AURI_RELEASE_CONFIG_FILENAME = "release.config.json";
export const AURI_RELEASE_CONFIG_FILE_PATH = path.join(
	process.cwd(),
	AURI_DIR,
	AURI_RELEASE_CONFIG_FILENAME
);
