import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Make material available",
};

export default function NewMaterialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
