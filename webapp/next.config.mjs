/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remote avatars / event covers come from Supabase storage + a few socials.
  // We use plain <img> for map pins (Leaflet divIcons) but allow these for any
  // next/image usage.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.hangoutstudios.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
