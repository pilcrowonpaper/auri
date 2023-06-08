import fs from "fs";
import path from "path";
import { AURI_DIR } from "../shared/constant.js";

export const addReleaseConfig = async () => {
	const fileName = "release.config.json";
	if (fs.existsSync(path.join(process.cwd(), AURI_DIR, fileName))) return;
	const template = `{
	"stage": "stable"
}`;

	fs.writeFileSync(path.join(process.cwd(), AURI_DIR, fileName), template);
};
