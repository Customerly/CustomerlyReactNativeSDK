import { safelyParseNumber } from "../number";

describe("safelyParseNumber", () => {
  describe("valid numeric inputs", () => {
    it("parses numeric strings", () => {
      expect(safelyParseNumber("5")).toBe(5);
      expect(safelyParseNumber("3.14")).toBe(3.14);
      expect(safelyParseNumber("-8")).toBe(-8);
    });

    it("returns numbers as-is", () => {
      expect(safelyParseNumber(7)).toBe(7);
      expect(safelyParseNumber(0)).toBe(0);
    });

    it("trims surrounding whitespace", () => {
      expect(safelyParseNumber("  5  ")).toBe(5);
    });

    it("parses exponent and hex string forms (Number coercion)", () => {
      expect(safelyParseNumber("1e3")).toBe(1000);
      expect(safelyParseNumber("0x1F")).toBe(31);
    });

    it("coerces bigints", () => {
      expect(safelyParseNumber(10n)).toBe(10);
    });
  });

  describe("falls back to 0 for non-numeric input", () => {
    it("handles non-numeric strings", () => {
      expect(safelyParseNumber("not a number")).toBe(0);
      expect(safelyParseNumber("12abc")).toBe(0);
    });

    it('treats an empty string as 0 (Number("") === 0)', () => {
      expect(safelyParseNumber("")).toBe(0);
    });

    it("handles null, undefined and NaN", () => {
      expect(safelyParseNumber(null)).toBe(0);
      expect(safelyParseNumber(undefined)).toBe(0);
      expect(safelyParseNumber(NaN)).toBe(0);
    });

    it("handles objects and non-numeric arrays", () => {
      expect(safelyParseNumber({})).toBe(0);
      expect(safelyParseNumber([1, 2, 3])).toBe(0);
    });
  });

  describe("documented coercion quirks", () => {
    it("coerces booleans and single-element arrays via Number()", () => {
      expect(safelyParseNumber(true)).toBe(1);
      expect(safelyParseNumber(false)).toBe(0);
      expect(safelyParseNumber([5])).toBe(5);
      expect(safelyParseNumber([])).toBe(0);
    });

    it("passes through Infinity (isNaN is false for Infinity)", () => {
      expect(safelyParseNumber(Infinity)).toBe(Infinity);
      expect(safelyParseNumber("Infinity")).toBe(Infinity);
    });
  });

  describe("inputs that make Number() throw are caught", () => {
    let errorSpy: jest.SpyInstance;
    beforeEach(() => {
      errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(() => errorSpy.mockRestore());

    it("returns 0 for a Symbol (Number(symbol) throws TypeError)", () => {
      expect(safelyParseNumber(Symbol("x"))).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
    });

    it("returns 0 when valueOf throws", () => {
      const hostile = {
        valueOf() {
          throw new Error("boom");
        },
      };
      expect(safelyParseNumber(hostile)).toBe(0);
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
