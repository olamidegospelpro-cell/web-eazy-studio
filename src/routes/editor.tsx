import { createFileRoute } from "@tanstack/react-router";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "Editor — WebEazy" },
      { name: "description", content: "Build and edit a WebEazy website." },
    ],
  }),
  component: EditorRoute,
});

function EditorRoute() {
  return <EditorWorkspace />;
}
