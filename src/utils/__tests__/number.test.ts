import { safelyParseNumber } from "../number";

describe("safelyParseNumber", () => {
  it("parses numeric strings", () => {
    expect(safelyParseNumber("5")).toBe(5);
    expect(safelyParseNumber("3.14")).toBe(3.14);
  });

  it("returns the number as-is", () => {
    expect(safelyParseNumber(7)).toBe(7);
  });

  it("falls back to 0 for non-numeric input", () => {
    expect(safelyParseNumber("not a number")).toBe(0);
    expect(safelyParseNumber(undefined)).toBe(0);
    expect(safelyParseNumber(null)).toBe(0);
    expect(safelyParseNumber({})).toBe(0);
  });
});
