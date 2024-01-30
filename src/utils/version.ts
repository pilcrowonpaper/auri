export function parseVersion(version: string): VersionMeta {
	if (version.includes("-next.")) {
		const [semver, nextTag] = version.split("-");
		const [major, minor, patch] = parseSemver(semver);
		const next = Number(nextTag.replace("next.", ""));
		if (isNaN(next) || Math.trunc(next) !== next) {
			throw new Error("Invalid version");
		}
		const meta: VersionMeta = {
			major,
			minor,
			patch,
			next
		};
		return meta;
	}
	const [major, minor, patch] = parseSemver(version);
	const meta: VersionMeta = {
		major,
		minor,
		patch,
		next: null
	};
	return meta;
}

function parseSemver(
	semver: string
): [major: number, minor: number, patch: number] {
	const parts = semver.split(".").map((part) => Number(part));
	if (parts.length !== 3) {
		throw new Error("Invalid semver");
	}
	for (const part of parts) {
		if (isNaN(part) || Math.trunc(part) !== part) {
			throw new Error("Invalid semver");
		}
	}
	return parts as [number, number, number];
}

interface VersionMeta {
	major: number;
	minor: number;
	patch: number;
	next: number | null;
}
