jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: { requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })) },
}));

import notifee from "@notifee/react-native";
import { Customerly, messengerRef } from "../Customerly";
import { SdkMethods } from "../typings/sdk-methods";

const setRef = (impl: Partial<SdkMethods> | null) => {
  (messengerRef as { current: Partial<SdkMethods> | null }).current = impl;
};

describe("Customerly", () => {
  afterEach(() => {
    setRef(null);
    jest.clearAllMocks();
  });

  describe("guardInstance", () => {
    it("throws when the provider is not mounted (sync methods)", () => {
      setRef(null);
      expect(() => Customerly.show()).toThrow("CustomerlyProvider is not mounted.");
      expect(() => Customerly.hide()).toThrow(/not mounted/);
      expect(() => Customerly.event("x")).toThrow(/not mounted/);
      expect(() => Customerly.reset()).toThrow(/not mounted/);
      expect(() => Customerly.update({ appId: "x" })).toThrow(/not mounted/);
      expect(() => Customerly.showBookMeeting()).toThrow(/not mounted/);
    });

    it("throws synchronously for async-typed methods when not mounted", () => {
      setRef(null);
      // The guard runs before the wrapped async fn, so this throws rather than rejects.
      expect(() => Customerly.getUnreadMessagesCount()).toThrow(/not mounted/);
      expect(() => Customerly.getUnreadConversationsCount()).toThrow(/not mounted/);
    });
  });

  describe("forwarding to the mounted messenger", () => {
    it("forwards calls and arguments verbatim", () => {
      const impl = {
        show: jest.fn(),
        event: jest.fn(),
        reset: jest.fn(),
        attribute: jest.fn(),
        showArticle: jest.fn(),
        update: jest.fn(),
        registerLead: jest.fn(),
      };
      setRef(impl);

      Customerly.show(true);
      expect(impl.show).toHaveBeenCalledWith(true);

      Customerly.show();
      expect(impl.show).toHaveBeenLastCalledWith(undefined);

      Customerly.event("checkout");
      expect(impl.event).toHaveBeenCalledWith("checkout");

      Customerly.attribute("plan", 42);
      expect(impl.attribute).toHaveBeenCalledWith("plan", 42);

      Customerly.showArticle(123);
      expect(impl.showArticle).toHaveBeenCalledWith(123, undefined);

      Customerly.showArticle("collection", "article");
      expect(impl.showArticle).toHaveBeenLastCalledWith("collection", "article");

      Customerly.registerLead("a@b.com", { source: "app" });
      expect(impl.registerLead).toHaveBeenCalledWith("a@b.com", { source: "app" });

      Customerly.reset();
      expect(impl.reset).toHaveBeenCalledTimes(1);
    });

    it("resolves async methods with the messenger's returned value", async () => {
      setRef({ getUnreadMessagesCount: jest.fn(async () => 7) });
      await expect(Customerly.getUnreadMessagesCount()).resolves.toBe(7);
    });
  });

  describe("requestNotificationPermissionIfNeeded", () => {
    it("is not guarded and calls notifee even without a mounted provider", async () => {
      setRef(null);
      await expect(Customerly.requestNotificationPermissionIfNeeded()).resolves.toBeUndefined();
      expect(notifee.requestPermission).toHaveBeenCalledTimes(1);
    });
  });
});
