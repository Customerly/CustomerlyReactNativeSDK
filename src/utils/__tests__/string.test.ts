import { generateRandomString } from "../string";

describe("generateRandomString", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns exactly the requested length", () => {
    expect(generateRandomString(10)).toHaveLength(10);
    expect(generateRandomString(1)).toHaveLength(1);
    expect(generateRandomString(64)).toHaveLength(64);
  });

  it("returns an empty string for length 0", () => {
    expect(generateRandomString(0)).toBe("");
  });

  it("returns an empty string for negative lengths", () => {
    expect(generateRandomString(-5)).toBe("");
  });

  it("only produces lowercase alphanumeric characters", () => {
    const value = generateRandomString(500);
    expect(value).toMatch(/^[0-9a-z]+$/);
  });

  it("still returns the full length when Math.random() hits its lower bound (regression: empty ids)", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const value = generateRandomString(10);
    expect(value).toHaveLength(10);
    expect(value).toBe("0000000000"); // index 0 of the alphabet
  });

  it("still returns the full length when Math.random() approaches 1", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.999999);
    const value = generateRandomString(10);
    expect(value).toHaveLength(10);
    expect(value).toBe("zzzzzzzzzz"); // last index of the alphabet
  });

  it("is practically collision-free across many calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) {
      seen.add(generateRandomString(10));
    }
    expect(seen.size).toBe(5000);
  });
});
