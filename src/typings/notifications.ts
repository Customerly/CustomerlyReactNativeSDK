/**
 * A notification as the SDK reads it back from the notification module (on a
 * press event or as the initial notification). Only `data` is used — it carries
 * the {@link import("./message").Message} the notification was built from.
 */
export type InjectedNotification = {
  data?: unknown;
};

/**
 * The slice of a notifee-compatible notification module that the SDK drives.
 *
 * The SDK deliberately does **not** import a notification package itself: the
 * host app installs one and passes its default export to `CustomerlyProvider`
 * via `notificationsModule`. That keeps the choice — and the New Architecture
 * requirement that comes with it — in the host app's hands:
 *
 * - `react-native-notify-kit` — maintained fork, **New Architecture only**.
 * - `@notifee/react-native` — archived, but the only option on the legacy
 *   architecture.
 *
 * Both satisfy this contract (their APIs are identical), and either can be
 * passed in unchanged. Omit the prop and the SDK simply never posts a
 * notification, which is what you want if the host app handles push itself.
 *
 * Methods are declared in shorthand syntax on purpose, so parameters stay
 * bivariant and the packages' narrower types remain assignable to this one.
 */
export type NotificationsModule = {
  requestPermission(): Promise<{ authorizationStatus: number }>;
  createChannel(channel: { id: string; name: string; importance?: number }): Promise<string>;
  displayNotification(notification: {
    title?: string;
    body?: string;
    data?: { [key: string]: string | number | object };
    android?: {
      channelId?: string;
      importance?: number;
      pressAction?: { id: string };
    };
  }): Promise<string>;
  onForegroundEvent(
    observer: (event: { type: number; detail: { notification?: InjectedNotification } }) => void,
  ): () => void;
  getInitialNotification(): Promise<{ notification: InjectedNotification } | null>;
};
