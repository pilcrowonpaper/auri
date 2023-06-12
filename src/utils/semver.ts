export const parseBetaVersion = (version: string) => {
	const [semver, betaFlag] = version.split("-");
	const betaVersion = Number(betaFlag.split(".")[1]);
	return {
		semver,
		betaVersion
	};
};

export const parseSemver = (version: string) => {
	return version.split(".").map((val) => Number(val)) as [
		number,
		number,
		number
	];
};
