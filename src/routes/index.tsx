import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/home/HomeScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WebEazy — Design Beautiful Websites Faster" },
      {
        name: "description",
        content:
          "WebEazy is a desktop-first visual website builder. Start a new project, open an existing one, or pick a template.",
      },
      { property: "og:title", content: "WebEazy — Design Beautiful Websites Faster" },
      {
        property: "og:description",
        content:
          "Desktop-first visual website builder. Local ownership, JSON export, no vendor lock-in.",
      },
    ],
  }),
  component: HomeScreen,
});
