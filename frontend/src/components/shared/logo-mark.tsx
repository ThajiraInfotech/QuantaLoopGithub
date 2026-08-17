import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  size?: number;
};

/**
 * Quanta Loop mark — circular recovery network, minimal industrial.
 */
export function LogoMark({ className, size = 32 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect
        width="32"
        height="32"
        rx="8"
        className="fill-muted stroke-border"
        strokeWidth="1"
      />
      <circle
        cx="16"
        cy="16"
        r="9"
        className="stroke-foreground/20"
        strokeWidth="1"
      />
      <path
        d="M16 7a9 9 0 0 1 7.8 13.5"
        className="stroke-accent"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 25a9 9 0 0 1-7.8-13.5"
        className="stroke-accent/60"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="7" r="1.75" className="fill-accent" />
      <circle cx="23.5" cy="20" r="1.5" className="fill-foreground/70" />
      <circle cx="8.5" cy="20" r="1.5" className="fill-foreground/40" />
    </svg>
  );
}
