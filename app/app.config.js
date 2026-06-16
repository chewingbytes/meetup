// Dynamic Expo config.
//
// Everything static still lives in app.json — this file only injects the Google
// Maps API key (used by react-native-maps with PROVIDER_GOOGLE) into the iOS and
// Android native config at build time, read from the GOOGLE_MAPS_API_KEY env var.
//
// app.json CANNOT read process.env (it's plain JSON), which is why the key has to
// be wired here. Put the key in `.env.local` (already gitignored):
//
//   GOOGLE_MAPS_API_KEY=AIza...your-key...
//
// Then rebuild the dev client (Google Maps does NOT work in Expo Go):
//   npx expo prebuild --clean
//   npx expo run:ios      # or: npx expo run:android
//
// The Google Cloud key must have "Maps SDK for iOS" and "Maps SDK for Android"
// enabled.

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export default ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: {
      ...(config.ios && config.ios.config),
      googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    ...config.android,
    config: {
      ...(config.android && config.android.config),
      googleMaps: {
        apiKey: GOOGLE_MAPS_API_KEY,
      },
    },
  },
});
