# AI Refine Provider Contract

WebEazy should keep AI integration provider-agnostic.

## Required flow

- The editor identifies the selected node.
- The UI sends a natural-language instruction plus a minimal, validated node snapshot.
- The provider returns a structured patch.
- The editor validates the patch against the node/document schema.
- The editor applies the patch through the normal editor store transaction so history, autosave, and export remain consistent.

## Suggested types

```ts
export type RefineRequest = {
  instruction: string;
  node: unknown;
  surroundingContext?: unknown;
};

export type RefinePatch = {
  nodeId: string;
  changes: Record<string, unknown>;
  explanation?: string;
};

export interface AIProvider {
  refine(request: RefineRequest): Promise<RefinePatch>;
}
```

## Security requirements

- Do not ship provider secrets in client-side bundles.
- Validate allowed fields and values before applying a patch.
- Reject unknown node IDs and unsupported property paths.
- Show configuration, loading, error, and retry states.
- Keep a mock provider for local UI testing.

## Initial supported operations

- Color/fill changes
- Border and radius changes
- Spacing changes
- Typography changes
- Text-content changes
- Position and size changes
- Section layout suggestions
