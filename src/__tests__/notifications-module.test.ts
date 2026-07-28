import type notifee from "@notifee/react-native";
import type notifyKit from "react-native-notify-kit";
import { NotificationsModule } from "../typings/notifications";

describe("NotificationsModule", () => {
  /**
   * Compile-time proof that both supported notification packages still satisfy
   * the contract the host app injects through `CustomerlyProvider`. The imports
   * are type-only, so neither package is loaded at runtime — the assignments
   * below are the assertion, and `yarn test` fails to compile if either
   * package's API drifts.
   */
  it("is satisfied by both supported notification packages", () => {
    // New Architecture: the maintained notifee fork.
    const notifyKitModule: NotificationsModule = null as unknown as typeof notifyKit;
    // Legacy architecture: the archived notifee package.
    const notifeeModule: NotificationsModule = null as unknown as typeof notifee;

    expect(notifyKitModule).toBeNull();
    expect(notifeeModule).toBeNull();
  });

  it("is satisfied by a minimal hand-rolled implementation", () => {
    const custom: NotificationsModule = {
      requestPermission: async () => ({ authorizationStatus: 1 }),
      createChannel: async ({ id }) => id,
      displayNotification: async () => "notification-id",
      onForegroundEvent: () => () => {},
      getInitialNotification: async () => null,
    };

    expect(custom).toBeDefined();
  });
});
