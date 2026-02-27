import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Glupp — Every gulp counts",
    short_name: "Glupp",
    description:
      "Collectionne, classe et partage tes bières préférées. Chaque gorgée compte !",
    start_url: "/duel",
    display: "standalone",
    background_color: "#16130E",
    theme_color: "#E08840",
    orientation: "portrait",
    categories: ["food", "lifestyle", "social"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
  };
}
