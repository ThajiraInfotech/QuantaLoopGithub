import Image from "next/image";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/quantaloop logo.png";

type LogoProps = {
  className?: string;
  withLink?: boolean;
};

export function Logo({ className, withLink = true }: LogoProps) {
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
    <Link href={ROUTES.home} className="inline-flex">
      {mark}
    </Link>
  );
}
