"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { fetchMyConversations } from "@/services/conversations/conversation.service";
import { fetchMyInterests } from "@/services/interests/interest.service";
import { fetchMaterials } from "@/services/materials/material.service";
import { fetchAdminParticipantDetail } from "@/services/admin/admin.service";
import type { Conversation } from "@/types/conversation";
import type { Interest } from "@/types/interest";
import type { Material } from "@/types/material";
import { formatMediumDate, formatRelativeWhen } from "@/utils/format-relative-time";

export type AdminParticipantRecordKind = "materials" | "interests" | "discussions";

type AdminParticipantRecordsPanelProps = {
  kind: AdminParticipantRecordKind;
  title: string;
  description: string;
};

function participantMatchesInterest(
  interest: Interest,
  participantId: string,
  scope: string | null
) {
  const isBuyer = interest.buyer?.id === participantId;
  const isProvider = interest.providerId === participantId;

  if (scope === "created") return isBuyer;
  if (scope === "received") return isProvider;
  if (scope === "completed") {
    return interest.status === "completed" && (isBuyer || isProvider);
  }

  return isBuyer || isProvider;
}

function participantMatchesConversation(
  conversation: Conversation,
  participantId: string,
  status: string | null
) {
  const involved =
    conversation.buyerId === participantId ||
    conversation.providerId === participantId;
  if (!involved) return false;
  if (status === "active") return conversation.status === "active";
  return true;
}

export function AdminParticipantRecordsPanel({
  kind,
  title,
  description,
}: AdminParticipantRecordsPanelProps) {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participant");
  const materialFilter = searchParams.get("material");
  const scope = searchParams.get("scope");
  const status = searchParams.get("status");

  const [participantName, setParticipantName] = useState<string | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!participantId && !materialFilter) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [detail, mats, ints, convs] = await Promise.all([
        participantId
          ? fetchAdminParticipantDetail(participantId).catch(() => null)
          : Promise.resolve(null),
        kind === "materials" ? fetchMaterials() : Promise.resolve([] as Material[]),
        kind === "interests" ? fetchMyInterests() : Promise.resolve([] as Interest[]),
        kind === "discussions"
          ? fetchMyConversations()
          : Promise.resolve([] as Conversation[]),
      ]);

      setParticipantName(detail?.profile.companyName ?? null);
      setMaterials(mats);
      setInterests(ints);
      setConversations(convs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load records");
    } finally {
      setLoading(false);
    }
  }, [kind, participantId, materialFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredMaterials = useMemo(() => {
    if (!participantId) return [];
    return materials.filter((m) => m.provider.id === participantId);
  }, [materials, participantId]);

  const filteredInterests = useMemo(() => {
    return interests.filter((i) => {
      if (materialFilter && i.materialId !== materialFilter) return false;
      if (!participantId) return true;
      return participantMatchesInterest(i, participantId, scope);
    });
  }, [interests, participantId, materialFilter, scope]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (materialFilter && c.materialId !== materialFilter) return false;
      if (!participantId) return true;
      return participantMatchesConversation(c, participantId, status);
    });
  }, [conversations, participantId, materialFilter, status]);

  const scopeLabel =
    scope === "created"
      ? "interests created"
      : scope === "received"
        ? "interests received"
        : scope === "completed"
          ? "completed deals"
          : null;

  const statusLabel = status === "active" ? "active discussions" : null;

  if (!participantId && !materialFilter) {
    return (
      <Card className="border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>Select a participant or material to view scoped records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={ROUTES.adminParticipants}
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
          >
            ← Back to participants
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="space-y-2">
        {participantId ? (
          <Link
            href={ROUTES.adminParticipantDetail(participantId)}
            className="inline-flex text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            ← Back to participant
          </Link>
        ) : materialFilter ? (
          <Link
            href={ROUTES.adminMaterialDetail(materialFilter)}
            className="inline-flex text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            ← Back to material
          </Link>
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {participantName
              ? `${description} for ${participantName}.`
              : description}
            {scopeLabel ? ` Showing ${scopeLabel}.` : ""}
            {statusLabel ? ` Showing ${statusLabel}.` : ""}
          </p>
        </div>
      </div>

      <Card className="border-zinc-200/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 animate-pulse rounded-lg bg-zinc-50" />
          ) : error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : kind === "materials" ? (
            filteredMaterials.length === 0 ? (
              <p className="text-sm text-zinc-500">No materials for this participant.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-100">
                {filteredMaterials.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900">{m.title}</p>
                      <p className="text-xs text-zinc-500">
                        {m.status} · {formatRelativeWhen(m.updatedAt)}
                      </p>
                    </div>
                    <Link
                      href={ROUTES.materialDetail(m.id)}
                      className="shrink-0 text-sm font-medium text-zinc-700 hover:text-zinc-900"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : kind === "interests" ? (
            filteredInterests.length === 0 ? (
              <p className="text-sm text-zinc-500">No interests for this participant.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-100">
                {filteredInterests.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900">
                        {i.materialTitle}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {i.status} · {formatMediumDate(i.updatedAt)} ·{" "}
                        {formatRelativeWhen(i.updatedAt)}
                      </p>
                    </div>
                    <Link
                      href={ROUTES.interestsOpen(i.id)}
                      className="shrink-0 text-sm font-medium text-zinc-700 hover:text-zinc-900"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : filteredConversations.length === 0 ? (
            <p className="text-sm text-zinc-500">No discussions for this participant.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-100">
              {filteredConversations.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">
                      {c.materialTitle}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {c.status} ·{" "}
                      {c.lastMessageAt
                        ? formatRelativeWhen(c.lastMessageAt)
                        : formatRelativeWhen(c.updatedAt)}
                    </p>
                  </div>
                  <Link
                    href={ROUTES.conversationDetail(c.id)}
                    className="shrink-0 text-sm font-medium text-zinc-700 hover:text-zinc-900"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Link href={ROUTES.adminParticipants}>
        <Button type="button" variant="outline" size="sm">
          All participants
        </Button>
      </Link>
    </div>
  );
}
