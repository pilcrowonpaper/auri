import { test, expect } from "vitest";
import { parseSemver } from "./semver.js";

import type { Semver } from "./semver.js";

test("parseSemver()", () => {
	let expected: Semver = {
		major: 2,
		minor: 0,
		patch: 0,
		next: null
	};
	expect(parseSemver("2.0.0")).toStrictEqual(expected);

	expected = {
		major: 0,
		minor: 1,
		patch: 2,
		next: null
	};
	expect(parseSemver("0.1.2")).toStrictEqual(expected);

	expected = {
		major: 10403,
		minor: 2043,
		patch: 850323,
		next: null
	};
	expect(parseSemver("10403.2043.850323")).toStrictEqual(expected);

	expected = {
		major: 2,
		minor: 0,
		patch: 0,
		next: 3
	};
	expect(parseSemver("2.0.0-next.3")).toStrictEqual(expected);

	expect(() => parseSemver("2.0")).toThrowError();
	expect(() => parseSemver("2")).toThrowError();
	expect(() => parseSemver("a.b.c")).toThrowError();
	expect(() => parseSemver("2.0.0-beta.1")).toThrowError();
	expect(() => parseSemver("2.0.0-next")).toThrowError();
	expect(() => parseSemver("2.0.0-next.")).toThrowError();
	expect(() => parseSemver("ff.ff.ff-next.1")).toThrowError();
	expect(() => parseSemver("1.1.1-next.ff")).toThrowError();
	expect(() => parseSemver("0xff.0xff.0xff-next.1")).toThrowError();
	expect(() => parseSemver("1.1.1-next.0xff")).toThrowError();
	expect(() => parseSemver("-1.-1.-1-next.1")).toThrowError();
	expect(() => parseSemver("1.1.1-next.-1")).toThrowError();
	expect(() => parseSemver("01.01.01-next.1")).toThrowError();
	expect(() => parseSemver("1.1.1-next.01")).toThrowError();
	expect(() => parseSemver("1a.1a.1a-next.1")).toThrowError();
	expect(() => parseSemver("1.1.1-next.1a")).toThrowError();
});
