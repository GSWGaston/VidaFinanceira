import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ordinnum",
    short_name: "Ordinnum",
    description: "Sua vida financeira em perspectiva.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff8f6",
    theme_color: "#7a3e2b",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
