export function convertPositiveIntegerString(s: string): number {
	if (s.length === 0) {
		throw new Error("Failed to parse string");
	}
	for (let i = 0; i < s.length; i++) {
		const code = s.charCodeAt(i);
		// is leading zero
		if (s.length > 1 && i === 0 && code === 0x30) {
			throw new Error("Failed to parse string");
		}
		if (code < 0x30 || code > 0x39) {
			throw new Error("Failed to parse string");
		}
	}
	return Number(s);
}
