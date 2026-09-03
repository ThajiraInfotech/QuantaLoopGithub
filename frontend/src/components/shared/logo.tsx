"use client";

import Image from "next/image";
import Link from "next/link";

import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { getAppHomeHref } from "@/lib/auth-routing";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const LOGO_SRC = "/quantaloop logo.png";

type LogoProps = {
  className?: string;
  withLink?: boolean;
};

export function Logo({ className, withLink = true }: LogoProps) {
  const hydrated = useAuthHydration();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const href =
    hydrated && accessToken ? getAppHomeHref(user) : getAppHomeHref(null);

  const mark = (
    <Image
      src={LOGO_SRC}
      alt="Quanta Loop"
      width={180}
      height={56}
      className={cn("h-9 w-auto", className)}
      priority
    />
  );

  if (!withLink) return mark;

  return (
    <Link href={href} className="inline-flex">
      {mark}
    </Link>
  );
}
