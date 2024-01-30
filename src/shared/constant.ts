import path from "path";

export const AURI_DIR = ".auri";

export const AURI_FORMAT_SCRIPT = "auri.format";
export const AURI_PUBLISH_SETUP_SCRIPT = "auri.publish_setup";

export const AURI_BUILD_SCRIPT = "auri.build";
export const AURI_DEPLOY_SCRIPT = "auri.deploy";

export const AURI_RELEASE_CONFIG_FILENAME = "release.config.json";
export const AURI_RELEASE_CONFIG_FILE_PATH = path.join(
	process.cwd(),
	AURI_DIR,
	AURI_RELEASE_CONFIG_FILENAME
);

export const PNPM_PUBLISH_COMMAND = "publish --no-git-checks --access public";
export const PNPM_BETA_PUBLISH_COMMAND =
	"publish --no-git-checks --access public --tag beta";