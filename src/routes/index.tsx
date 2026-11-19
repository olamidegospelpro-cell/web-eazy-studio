import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/home/HomeScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WebEazy — Design Beautiful Websites Faster" },
      {
        name: "description",
        content:
          "WebEazy is a visual website builder for designing, customizing and exporting modern websites.",
      },
      { property: "og:title", content: "WebEazy — Design Beautiful Websites Faster" },
      {
        property: "og:description",
        content:
          "Design, customize and export modern websites with WebEazy.",
      },
    ],
  }),
  component: HomeScreen,
});
