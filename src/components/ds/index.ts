/**
 * Barrel export for the WebEazy design system.
 *
 * Future feature modules should import from `@/components/ds` — never
 * reach into individual files — so we can refactor internals freely.
 */
export * from "./typography";
export * from "./spinner";
export * from "./loading-overlay";
export * from "./empty-state";
export * from "./status-badge";
export * from "./icon-button";
export * from "./form-field";
export * from "./confirm-dialog";
export * from "./cards";
export * from "./toast";

// Re-export foundational shadcn primitives so consumers have a single
// import surface for common UI needs.
export { Button, buttonVariants } from "@/components/ui/button";
export { Input } from "@/components/ui/input";
export { Textarea } from "@/components/ui/textarea";
export { Checkbox } from "@/components/ui/checkbox";
export { Switch } from "@/components/ui/switch";
export { Slider } from "@/components/ui/slider";
export { Separator } from "@/components/ui/separator";
export { Badge } from "@/components/ui/badge";
export { Skeleton } from "@/components/ui/skeleton";
export { Progress } from "@/components/ui/progress";
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
