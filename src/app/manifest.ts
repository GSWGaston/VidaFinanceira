import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VidaFinanceira",
    short_name: "Vida",
    description: "Sua vida financeira em perspectiva.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f8f5",
    theme_color: "#176e55",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
