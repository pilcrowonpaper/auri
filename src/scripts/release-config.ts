import fs from "fs";

import { AURI_RELEASE_CONFIG_FILE_PATH } from "../shared/constant.js";

export const addReleaseConfig = async () => {
	if (fs.existsSync(AURI_RELEASE_CONFIG_FILE_PATH)) return;
	const template = `{
	"stage": "stable"
}`;

	fs.writeFileSync(AURI_RELEASE_CONFIG_FILE_PATH, template);
};
