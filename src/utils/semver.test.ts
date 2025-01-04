import * as vitest from "vitest";

import { parseSemver, Semver } from "./semver.js";

vitest.test("parseSemver()", () => {
	let expected: Semver = {
		major: 2,
		minor: 0,
		patch: 0,
		next: null
	};
	vitest.expect(parseSemver("2.0.0")).toStrictEqual(expected);

	expected = {
		major: 0,
		minor: 1,
		patch: 2,
		next: null
	};
	vitest.expect(parseSemver("0.1.2")).toStrictEqual(expected);

	expected = {
		major: 10403,
		minor: 2043,
		patch: 850323,
		next: null
	};
	vitest.expect(parseSemver("10403.2043.850323")).toStrictEqual(expected);

	expected = {
		major: 2,
		minor: 0,
		patch: 0,
		next: 3
	};
	vitest.expect(parseSemver("2.0.0-next.3")).toStrictEqual(expected);

	vitest.expect(() => parseSemver("2.0")).toThrowError();
	vitest.expect(() => parseSemver("2")).toThrowError();
	vitest.expect(() => parseSemver("a.b.c")).toThrowError();
	vitest.expect(() => parseSemver("2.0.0-beta.1")).toThrowError();
	vitest.expect(() => parseSemver("2.0.0-next")).toThrowError();
	vitest.expect(() => parseSemver("2.0.0-next.")).toThrowError();
	vitest.expect(() => parseSemver("ff.ff.ff-next.1")).toThrowError();
	vitest.expect(() => parseSemver("1.1.1-next.ff")).toThrowError();
	vitest.expect(() => parseSemver("0xff.0xff.0xff-next.1")).toThrowError();
	vitest.expect(() => parseSemver("1.1.1-next.0xff")).toThrowError();
	vitest.expect(() => parseSemver("-1.-1.-1-next.1")).toThrowError();
	vitest.expect(() => parseSemver("1.1.1-next.-1")).toThrowError();
	vitest.expect(() => parseSemver("01.01.01-next.1")).toThrowError();
	vitest.expect(() => parseSemver("1.1.1-next.01")).toThrowError();
	vitest.expect(() => parseSemver("1a.1a.1a-next.1")).toThrowError();
	vitest.expect(() => parseSemver("1.1.1-next.1a")).toThrowError();
});
