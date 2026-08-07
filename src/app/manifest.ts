import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pension & opsparing",
    short_name: "Pension",
    description: "Husstandens overblik over pension, investeringer og budget",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F5F2",
    theme_color: "#1F7A6B",
    lang: "da",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
