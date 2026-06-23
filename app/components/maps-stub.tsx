/**
 * TEMPORARY Expo Go shim for react-native-maps.
 *
 * react-native-maps 1.27.2's native module (RNMapsAirModule) is NOT bundled in
 * Expo Go, so importing the real package crashes Expo Go on launch. This stub
 * lets the JS run in Expo Go by rendering a flat placeholder instead of a real
 * map — handy for developing the non-map UI (pills, sheets, wizards) quickly.
 *
 * The real map ONLY works in a dev/prod native build. Before building (eas build
 * / expo run:ios), restore the real imports — every file that imports this stub
 * has the original `from "react-native-maps"` line commented right above it.
 */
import React from "react";
import { View } from "react-native";

export type LatLng = { latitude: number; longitude: number };
export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = undefined;

// Class component so it works both as a VALUE and a TYPE (useRef<MapView>) just
// like the real library, and can expose imperative methods as no-ops.
export default class MapView extends React.Component<any> {
  animateToRegion(_region?: Region, _duration?: number) {}
  animateCamera(_camera?: any, _opts?: any) {}
  getCamera() {
    return Promise.resolve({});
  }
  getMapBoundaries() {
    return Promise.resolve({ northEast: {}, southWest: {} });
  }
  fitToCoordinates(_coords?: LatLng[], _opts?: any) {}
  render() {
    const { style, children } = this.props ?? {};
    return <View style={[{ backgroundColor: "#E5E3EC" }, style]}>{children}</View>;
  }
}

// Markers/overlays render nothing in the stub (no native map to anchor to).
export const Marker = (_props: any) => null;
export const Callout = (_props: any) => null;
export const Polygon = (_props: any) => null;
export const Polyline = (_props: any) => null;
export const Circle = (_props: any) => null;
