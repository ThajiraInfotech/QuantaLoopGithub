"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes";
import {
  createAdminInsight,
  slugifyInsightTitle,
  updateAdminInsight,
} from "@/services/content-insights/content-insight.service";
import type {
  ContentInsight,
  ContentInsightInput,
  ContentInsightLanguage,
  ContentInsightSection,
  ContentInsightStatus,
} from "@/types/content-insight";

type SectionDraft = {
  heading: string;
  body: string;
};

function sectionsToDraft(sections: ContentInsightSection[]): SectionDraft[] {
  return sections.map((section) => ({
    heading: section.heading,
    body: section.paragraphs.join("\n\n"),
  }));
}

function draftToSections(drafts: SectionDraft[]): ContentInsightSection[] {
  return drafts
    .map((draft) => ({
      heading: draft.heading.trim(),
      paragraphs: draft.body
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
    }))
    .filter((section) => section.heading && section.paragraphs.length > 0);
}

function emptySection(): SectionDraft {
  return { heading: "", body: "" };
}

export function AdminInsightForm({
  initial,
}: {
  initial?: ContentInsight;
}) {
  const router = useRouter();
  const [insightId, setInsightId] = useState(initial?.id ?? null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [status, setStatus] = useState<ContentInsightStatus>(
    initial?.status ?? "draft"
  );
  const [language, setLanguage] = useState<ContentInsightLanguage>(
    initial?.language ?? "en"
  );
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [sections, setSections] = useState<SectionDraft[]>(
    initial?.sections?.length
      ? sectionsToDraft(initial.sections)
      : [emptySection()]
  );
  const [savingAction, setSavingAction] = useState<"draft" | "publish" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const previewSlug = useMemo(
    () => (slugTouched ? slug : slugifyInsightTitle(title)),
    [slug, slugTouched, title]
  );

  const isPublished = status === "published";
  const busy = savingAction !== null;

  function updateSection(index: number, patch: Partial<SectionDraft>) {
    setSections((prev) =>
      prev.map((section, i) => (i === index ? { ...section, ...patch } : section))
    );
  }

  function buildPayload(nextStatus: "draft" | "published"): ContentInsightInput | null {
    setError(null);

    if (!title.trim() || title.trim().length < 3) {
      setError("Add a clear title (at least 3 characters).");
      return null;
    }
    if (!description.trim() || description.trim().length < 20) {
      setError("Meta description should be at least 20 characters.");
      return null;
    }

    const parsedSections = draftToSections(sections);
    if (!parsedSections.length) {
      setError("Add at least one section with a heading and paragraph.");
      return null;
    }

    const finalSlug = (slugTouched ? slug : slugifyInsightTitle(title)).trim();
    if (!finalSlug) {
      setError("Slug is required.");
      return null;
    }

    return {
      title: title.trim(),
      slug: finalSlug,
      description: description.trim(),
      excerpt: excerpt.trim() || description.trim(),
      status: nextStatus,
      language,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      sections: parsedSections,
      publishedAt:
        nextStatus === "published" ? new Date().toISOString() : null,
    };
  }

  async function save(nextStatus: "draft" | "publish") {
    const payload = buildPayload(nextStatus === "publish" ? "published" : "draft");
    if (!payload) return;

    setSavingAction(nextStatus);
    try {
      const saved = insightId
        ? await updateAdminInsight(insightId, payload)
        : await createAdminInsight(payload);

      // Refresh public route cache in the background (non-blocking).
      startTransition(() => {
        void fetch("/api/revalidate-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: saved.slug }),
        }).catch(() => undefined);
      });

      if (saved.status === "published") {
        toast.success("Published — live on /insights now");
        router.push(ROUTES.adminInsights);
        return;
      }

      setInsightId(saved.id);
      setStatus(saved.status);
      setSlug(saved.slug);
      setSlugTouched(true);
      setTitle(saved.title);
      setDescription(saved.description);
      setExcerpt(saved.excerpt || "");

      if (!insightId) {
        // Stay editing draft — update URL without remounting.
        window.history.replaceState(null, "", ROUTES.adminInsightEdit(saved.id));
      }

      toast.success("Draft saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setError(message);
      toast.error(message);
    } finally {
      setSavingAction(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            <Link
              href={ROUTES.adminInsights}
              className="underline-offset-2 hover:underline"
            >
              ← All Insights
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            {insightId ? "Edit insight" : "New insight"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {isPublished ? (
              <>
                Live now —{" "}
                <Link
                  href={ROUTES.publicInsight(previewSlug)}
                  target="_blank"
                  className="font-medium text-zinc-900 underline underline-offset-2"
                >
                  open public page
                </Link>
              </>
            ) : (
              "Save as draft anytime, or Publish to make it live immediately."
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void save("draft")}
          >
            {savingAction === "draft" ? "Saving…" : "Save as draft"}
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => void save("publish")}
          >
            {savingAction === "publish" ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basics</CardTitle>
          <CardDescription>
            Title = Google blue link. Meta description = gray text under it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-800">Title</span>
            <Input
              value={title}
              onChange={(e) => {
                const next = e.target.value;
                setTitle(next);
                if (!slugTouched) setSlug(slugifyInsightTitle(next));
              }}
              maxLength={180}
              placeholder="How to Sell Factory Plastic Scrap in India"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-800">Slug (URL)</span>
            <Input
              value={previewSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugifyInsightTitle(e.target.value));
              }}
              maxLength={200}
            />
            <span className="text-xs text-zinc-500">
              Public URL: /insights/{previewSlug || "…"}
            </span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-800">
              Meta description
            </span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={320}
              rows={3}
              placeholder="Short summary Google can show under your title"
            />
            <span className="text-xs text-zinc-500">
              {description.length}/320
            </span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-800">
              Excerpt (optional)
            </span>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              maxLength={400}
              rows={2}
              placeholder="Short card text on /insights"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Language & tags</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-800">Language</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value as ContentInsightLanguage)
              }
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
            </select>
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-zinc-800">
              Tags (comma separated)
            </span>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="plastic scrap India, HDPE scrap"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Sections</CardTitle>
            <CardDescription>
              Blank line between paragraphs inside a section.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSections((prev) => [...prev, emptySection()])}
          >
            Add section
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {sections.map((section, index) => (
            <div
              key={`section-${index}`}
              className="space-y-3 rounded-xl border border-zinc-200 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-700">
                  Section {index + 1}
                </p>
                {sections.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSections((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <Input
                value={section.heading}
                onChange={(e) =>
                  updateSection(index, { heading: e.target.value })
                }
                placeholder="Section heading"
              />
              <Textarea
                value={section.body}
                onChange={(e) => updateSection(index, { body: e.target.value })}
                placeholder={"Paragraph one.\n\nParagraph two."}
                rows={6}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex flex-wrap justify-end gap-2 rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => router.push(ROUTES.adminInsights)}
        >
          Back to list
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void save("draft")}
        >
          {savingAction === "draft" ? "Saving…" : "Save as draft"}
        </Button>
        <Button
          type="button"
          disabled={busy}
          onClick={() => void save("publish")}
        >
          {savingAction === "publish" ? "Publishing…" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
