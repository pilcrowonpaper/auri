import { convertPositiveIntegerString } from "./int.js";

export function parseSemver(version: string): Semver {
	let parts = version.split("-");
	if (parts.length > 2) {
		throw new Error("Invalid version format");
	}
	const mainParts = parts[0].split(".");
	if (mainParts.length !== 3) {
		throw new Error("Invalid version format");
	}

	let major: number;
	try {
		major = convertPositiveIntegerString(mainParts[0]);
	} catch {
		throw new Error("Invalid version format");
	}
	let minor: number;
	try {
		minor = convertPositiveIntegerString(mainParts[1]);
	} catch {
		throw new Error("Invalid version format");
	}
	let patch: number;
	try {
		patch = convertPositiveIntegerString(mainParts[2]);
	} catch {
		throw new Error("Invalid version format");
	}

	if (parts.length === 1) {
		const semver: Semver = {
			major,
			minor,
			patch,
			next: null
		};
		return semver;
	}
	const nextParts = parts[1].split(".");
	if (nextParts.length !== 2) {
		throw new Error("Invalid version format");
	}
	if (nextParts[0] !== "next") {
		throw new Error("Invalid version format");
	}
	let next: number;
	try {
		next = convertPositiveIntegerString(nextParts[1]);
	} catch {
		throw new Error("Invalid version format");
	}
	const semver: Semver = {
		major,
		minor,
		patch,
		next
	};
	return semver;
}

export interface Semver {
	major: number;
	minor: number;
	patch: number;
	next: number | null;
}
