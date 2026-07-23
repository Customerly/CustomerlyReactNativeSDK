import { CustomerlySettings } from "../../typings/customerly-settings";
import { getInternalSettings } from "../settings";

describe("getInternalSettings", () => {
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

  it("spreads company additionalAttributes to the top level (regression: nested)", () => {
    const result = getInternalSettings({
      appId: "APP",
      company: {
        company_id: "c1",
        name: "Acme",
        additionalAttributes: { plan: "pro", seats: 10 },
      },
    });

    expect(result.company).toEqual({
      company_id: "c1",
      name: "Acme",
      plan: "pro",
      seats: 10,
    });
    expect((result.company as Record<string, unknown>).additionalAttributes).toBeUndefined();
  });

  it("omits events and company when not provided", () => {
    const settings: CustomerlySettings = { appId: "APP" };
    const result = getInternalSettings(settings);

    expect(result.events).toBeUndefined();
    expect(result.company).toBeUndefined();
  });
});
