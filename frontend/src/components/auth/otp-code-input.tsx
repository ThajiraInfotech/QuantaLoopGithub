"use client";

import { cn } from "@/lib/utils";

type OtpCodeInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
};

export function OtpCodeInput({
  id,
  value,
  onChange,
  disabled = false,
  error = false,
  placeholder = "000000",
}: OtpCodeInputProps) {
  return (
    <input
      id={id}
      name="otp"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      pattern="[0-9]*"
      maxLength={6}
      enterKeyHint="done"
      autoFocus
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      aria-invalid={error}
      onChange={(event) =>
        onChange(event.target.value.replace(/\D/g, "").slice(0, 6))
      }
      className={cn(
        "flex h-14 w-full min-w-0 overflow-hidden rounded-xl border bg-white px-2 text-center text-[1.25rem] font-semibold tracking-[0.2em] text-zinc-900 shadow-none transition-[border-color,box-shadow] placeholder:font-medium placeholder:tracking-[0.2em] placeholder:text-zinc-300 focus-visible:border-[#22B573] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22B573]/20 disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:px-3 sm:text-2xl sm:tracking-[0.35em]",
        error ? "border-red-300" : "border-zinc-300",
      )}
    />
  );
}
