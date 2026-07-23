jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));
jest.mock("react-native-device-info", () => ({
  __esModule: true,
  default: {
    getApplicationName: () => "MyApp",
    getVersion: () => "2.3.4",
    getManufacturer: async () => "Apple",
    getModel: () => "iPhone15,2",
    getDevice: async () => "d2221",
    getSystemVersion: () => "17.4",
  },
}));

import { Platform } from "react-native";
import { InternalCustomerlySettings } from "../../typings/customerly-settings";
import { createHTML } from "../webview";

const setOS = (os: string) => {
  (Platform as { OS: string }).OS = os;
};

describe("createHTML", () => {
  afterEach(() => setOS("ios"));

  it("injects sdkMode, disableAutofocus and the settings", async () => {
    const html = await createHTML({ app_id: "APP123" });
    expect(html).toContain('"sdkMode":true');
    expect(html).toContain('"disableAutofocus":true');
    expect(html).toContain('"app_id":"APP123"');
  });

  it("includes device tech info", async () => {
    const html = await createHTML({ app_id: "APP" });
    expect(html).toContain('"app_name":"MyApp"');
    expect(html).toContain('"app_version":"2.3.4"');
    expect(html).toContain('"os_version":"17.4"');
    expect(html).toContain('"os":"ios"');
  });

  it("formats the iOS device string as '<manufacturer> <model>'", async () => {
    setOS("ios");
    const html = await createHTML({ app_id: "APP" });
    expect(html).toContain('"device":"Apple iPhone15,2"');
  });

  it("formats the Android device string with the build device in parentheses", async () => {
    setOS("android");
    const html = await createHTML({ app_id: "APP" });
    expect(html).toContain('"device":"Apple iPhone15,2 (d2221)"');
  });

  describe("script-tag safety (XSS)", () => {
    it("escapes </script> in a host-supplied value so it cannot break out of the tag", async () => {
      const settings: InternalCustomerlySettings = { app_id: "APP", name: "</script><script>alert(1)</script>" };
      const html = await createHTML(settings);

      // The raw breakout sequence must not survive.
      expect(html).not.toContain("</script><script>alert(1)");
      // It must be escaped instead.
      expect(html).toContain("\\u003c/script>");
      // Exactly one real closing </script> remains (the template's own).
      expect(html.match(/<\/script>/g) ?? []).toHaveLength(1);
    });

    it("escapes a lone < inside any string value", async () => {
      const settings: InternalCustomerlySettings = { app_id: "APP", name: "a < b" };
      const html = await createHTML(settings);
      expect(html).toContain('"name":"a \\u003c b"');
    });
  });
});
