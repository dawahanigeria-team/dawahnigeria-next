import { NextResponse } from "next/server";
import { ApiError, api } from "@/lib/api";

type ViewType = "album" | "lecture" | "lecturer" | "video";
type ViewResponse = {
  status: "success";
  type: ViewType;
  id: number;
  views: number;
};

const VIEW_TYPES = new Set<ViewType>(["album", "lecture", "lecturer", "video"]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A JSON request body is required" }, { status: 400 });
  }

  const raw = body as { type?: unknown; id?: unknown };
  const type = typeof raw?.type === "string" ? raw.type.toLowerCase() : "";
  const id = Number(raw?.id);

  if (!VIEW_TYPES.has(type as ViewType) || !Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "A valid view type and id are required" }, { status: 400 });
  }

  try {
    const result = await api.post<ViewResponse>("/view_counter.php", { type, id });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const status = error instanceof ApiError && error.status === 404 ? 404 : 502;
    return NextResponse.json({ error: "Unable to record view" }, { status });
  }
}
