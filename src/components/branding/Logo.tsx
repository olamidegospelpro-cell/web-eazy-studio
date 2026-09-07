import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: number;
};

/** WebEazy white mark + wordmark for the dark product interface. */
export function Logo({ className, showWordmark = true, size = 28 }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <img
        src="/webeazy-logo.svg"
        alt="WebEazy"
        width={size}
        height={Math.round(size * 0.64)}
        className="shrink-0 object-contain object-center"
      />
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-[#f5f5e6]">
          WebEazy
        </span>
      )}
    </div>
  );
}
