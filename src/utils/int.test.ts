import { test, expect } from "vitest";
import { convertPositiveIntegerString } from "./int.js";

test("parsePositiveIntegerString()", () => {
	expect(convertPositiveIntegerString("0")).toBe(0);
	expect(convertPositiveIntegerString("7")).toBe(7);
	expect(convertPositiveIntegerString("1320832952")).toBe(1320832952);
	expect(() => convertPositiveIntegerString("")).toThrowError();
	expect(() => convertPositiveIntegerString("01")).toThrowError();
	expect(() => convertPositiveIntegerString("1.42")).toThrowError();
	expect(() => convertPositiveIntegerString("-1")).toThrowError();
	expect(() => convertPositiveIntegerString("a")).toThrowError();
	expect(() => convertPositiveIntegerString("0xff")).toThrowError();
	expect(() => convertPositiveIntegerString("ff")).toThrowError();
	expect(() => convertPositiveIntegerString("5e2")).toThrowError();
});
