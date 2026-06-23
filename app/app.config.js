// Dynamic Expo config.
//
// Wires the Google Maps API keys (read from env) into the react-native-maps
// CONFIG PLUGIN. react-native-maps >= ~1.18 ships its own Expo config plugin
// (app.plugin.js) that, given a key, adds the `react-native-maps/Google` pod,
// sets GMSApiKey, injects GMSServices.provideAPIKey into the AppDelegate, and
// wires the Android manifest key.
//
// IMPORTANT: do NOT also set the legacy `ios.config.googleMapsApiKey` /
// `android.config.googleMaps.apiKey`. Those trigger Expo's *built-in* maps
// handling, which tries to add the old standalone `react-native-google-maps`
// pod — a podspec that react-native-maps 1.27.2 no longer ships, causing
// `pod install` to fail with "No podspec found for react-native-google-maps".
//
// Keys live in `.env.local` (local builds) and EAS env vars (cloud builds):
//   GOOGLE_MAPS_API_KEY_IOS=AIza...
//   GOOGLE_MAPS_API_KEY_ANDROID=AIza...

const iosGoogleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY_IOS;
const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY_ANDROID;

export default ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    [
      "react-native-maps",
      {
        iosGoogleMapsApiKey,
        androidGoogleMapsApiKey,
      },
    ],
  ],
});
