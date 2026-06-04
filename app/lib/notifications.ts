import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Controls how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Requests permission and returns the Expo push token.
 * Returns null if on a simulator, permission denied, or not a physical device.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications only work on physical devices.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Permission not granted for push notifications.");
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.error("No EAS project ID found in app config.");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

/**
 * Sends a local notification (shown immediately on this device).
 * Useful for testing or in-app alerts.
 */
export async function notifyNewMessage(
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {}, sound: "default" },
    trigger: null, // show immediately
  });
}

/**
 * Sends a push notification to one or more Expo push tokens via
 * Expo's push API. Call this from your server instead when possible.
 */
export async function sendPushNotification(
  expoPushTokens: string | string[],
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  const tokens = Array.isArray(expoPushTokens)
    ? expoPushTokens
    : [expoPushTokens];

  const messages = tokens.map((token) => ({
    to: token,
    sound: "default" as const,
    title,
    body,
    data: data ?? {},
  }));

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });
}
