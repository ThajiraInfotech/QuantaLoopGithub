import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ParticipantProfilePage } from "@/components/participants/participant-profile-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.participants");
  return { title: t("title") };
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ParticipantProfileRoute({ params }: PageProps) {
  const { id } = await params;
  return <ParticipantProfilePage participantId={id} />;
}
