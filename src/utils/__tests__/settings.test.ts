import { CustomerlySettings } from "../../typings/customerly-settings";
import { getInternalSettings } from "../settings";

describe("getInternalSettings", () => {
  describe("identity mapping", () => {
    it("maps user identity fields to snake_case", () => {
      const result = getInternalSettings({
        appId: "APP",
        userId: "42",
        emailHash: "hash",
        lastPageViewed: "/pricing",
        forceLead: true,
      });

      expect(result).toMatchObject({
        app_id: "APP",
        user_id: "42",
        email_hash: "hash",
        last_page_viewed: "/pricing",
        force_lead: true,
      });
    });

    it("does not leak the camelCase identity keys onto the wire object", () => {
      const result = getInternalSettings({ appId: "APP", userId: "42" }) as Record<string, unknown>;

      expect(result.appId).toBeUndefined();
      expect(result.userId).toBeUndefined();
      expect(result.emailHash).toBeUndefined();
      expect(result.lastPageViewed).toBeUndefined();
      expect(result.forceLead).toBeUndefined();
    });

    it("keeps appearance settings in camelCase (matching the web messenger)", () => {
      const result = getInternalSettings({
        appId: "APP",
        accentColor: "#fff",
        contrastColor: "#000",
        attachmentsAvailable: false,
        singleConversation: true,
      });

      expect(result).toMatchObject({
        accentColor: "#fff",
        contrastColor: "#000",
        attachmentsAvailable: false,
        singleConversation: true,
      });
    });

    it("passes through name, email and attributes untouched", () => {
      const result = getInternalSettings({
        appId: "APP",
        name: "Jane",
        email: "jane@example.com",
        attributes: { plan: "pro", seats: 10 },
      });

      expect(result.name).toBe("Jane");
      expect(result.email).toBe("jane@example.com");
      expect(result.attributes).toEqual({ plan: "pro", seats: 10 });
    });

    it("retains the getNotificationSetup callback for the RN side (not the wire)", () => {
      const getNotificationSetup = jest.fn();
      const result = getInternalSettings({ appId: "APP", getNotificationSetup });
      expect(result.getNotificationSetup).toBe(getNotificationSetup);
    });

    it("omits optional identity fields that are not provided", () => {
      const result = getInternalSettings({ appId: "APP" });
      expect(result.app_id).toBe("APP");
      expect(result.user_id).toBeUndefined();
      expect(result.email_hash).toBeUndefined();
    });
  });

  describe("events mapping", () => {
    it("converts event dates to Unix seconds (regression: Date vs number)", () => {
      const date = new Date("2026-01-02T03:04:05.000Z");
      const result = getInternalSettings({
        appId: "APP",
        events: [{ name: "signup", date }, { name: "no_date" }],
      });

      expect(result.events).toEqual([
        { name: "signup", date: Math.floor(date.getTime() / 1000) },
        { name: "no_date", date: undefined },
      ]);
    });

    it("handles the unix epoch (date 0) without treating it as missing", () => {
      const result = getInternalSettings({ appId: "APP", events: [{ name: "epoch", date: new Date(0) }] });
      expect(result.events).toEqual([{ name: "epoch", date: 0 }]);
    });

    it("guards against invalid Date instances instead of sending NaN", () => {
      const result = getInternalSettings({ appId: "APP", events: [{ name: "bad", date: new Date("not a date") }] });
      expect(result.events).toEqual([{ name: "bad", date: undefined }]);
    });

    it("maps an empty events array to an empty array", () => {
      const result = getInternalSettings({ appId: "APP", events: [] });
      expect(result.events).toEqual([]);
    });
  });

  describe("company mapping", () => {
    it("spreads additionalAttributes to the top level (regression: nested)", () => {
      const result = getInternalSettings({
        appId: "APP",
        company: { company_id: "c1", name: "Acme", additionalAttributes: { plan: "pro", seats: 10 } },
      });

      expect(result.company).toEqual({ company_id: "c1", name: "Acme", plan: "pro", seats: 10 });
      expect((result.company as Record<string, unknown>).additionalAttributes).toBeUndefined();
    });

    it("does not let additionalAttributes clobber company_id or name", () => {
      const result = getInternalSettings({
        appId: "APP",
        company: {
          company_id: "real",
          name: "Real Co",
          additionalAttributes: { company_id: "spoofed", name: "Spoofed", extra: 1 },
        },
      });

      expect(result.company).toMatchObject({ company_id: "real", name: "Real Co", extra: 1 });
    });

    it("handles a company with no additionalAttributes", () => {
      const result = getInternalSettings({ appId: "APP", company: { company_id: "c1", name: "Acme" } });
      expect(result.company).toEqual({ company_id: "c1", name: "Acme" });
    });
  });

  it("omits events and company when not provided", () => {
    const settings: CustomerlySettings = { appId: "APP" };
    const result = getInternalSettings(settings);

    expect(result.events).toBeUndefined();
    expect(result.company).toBeUndefined();
  });
});
