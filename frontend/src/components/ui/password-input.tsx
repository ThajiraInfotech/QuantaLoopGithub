import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

const defaultInputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-11 text-small text-foreground shadow-subtle transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  inputClassName?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, inputClassName, id, disabled, ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className={cn("relative w-full", className)}>
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn(defaultInputClass, inputClassName)}
          {...props}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-50"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
    );
  }
);
