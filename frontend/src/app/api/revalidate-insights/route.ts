import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/** Called after admin publish/save/delete so public Insights update immediately. */
export async function POST(request: Request) {
  let slug: string | undefined;
  try {
    const body = (await request.json()) as { slug?: string };
    slug = body?.slug?.trim() || undefined;
  } catch {
    // empty body is fine
  }

  revalidatePath("/insights");
  revalidatePath("/insights", "layout");
  revalidatePath("/sitemap.xml");
  if (slug) {
    revalidatePath(`/insights/${slug}`);
  }

  return NextResponse.json({
    revalidated: true,
    slug: slug ?? null,
    now: Date.now(),
  });
}
