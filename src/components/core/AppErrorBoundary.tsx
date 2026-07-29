/**
 * AppErrorBoundary — friendly recovery screen for unexpected UI errors.
 *
 * Wrap any subtree: `<AppErrorBoundary scope="Editor">…</AppErrorBoundary>`.
 * Errors are logged through the core logger and forwarded to Lovable's
 * reporting hook, then the user is offered Retry / Reload / Go home instead of
 * a blank screen.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { log } from "@/lib/core/logger";
import { bus } from "@/lib/core/event-bus";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  children: ReactNode;
  /** Shown in the message and log scope, e.g. "Command palette". */
  scope?: string;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const scope = this.props.scope ?? "app";
    log.scoped(`boundary:${scope}`).error(error.message, info.componentStack);
    bus.emit("app:error", { message: error.message, source: scope });
    reportLovableError(error, { boundary: scope });
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className="flex h-full min-h-[320px] w-full items-center justify-center p-8">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="h-5 w-5 text-danger" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            {this.props.scope ? `${this.props.scope} hit a problem` : "Something went wrong"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            WebEazy kept the rest of the app running. Your project data is untouched.
          </p>
          <pre className="mt-4 max-h-28 overflow-auto rounded-md bg-muted p-3 text-left font-mono text-[11px] text-muted-foreground">
            {error.message}
          </pre>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={this.reset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Reload
            </Button>
            <Button size="sm" variant="ghost" onClick={() => (window.location.href = "/")}>
              <Home className="h-3.5 w-3.5" />
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
