import { version } from "../../../package.json";
import { SDK_VERSION } from "../version";

describe("SDK_VERSION", () => {
  it("matches the published package version", () => {
    expect(SDK_VERSION).toBe(version);
  });
});
