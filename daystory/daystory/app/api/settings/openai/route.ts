import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import {
  deleteUserOpenAIApiKey,
  getUserSettings,
  upsertUserSettings,
} from "@/lib/firebase";

type SessionUser = (Session["user"] & { id?: string; sub?: string }) | null | undefined;

function getUserIdFromSession(session: Awaited<ReturnType<typeof auth>>) {
  const typedSession = session as (Session & { user?: SessionUser }) | null;
  const user = typedSession?.user;
  if (!user) {
    return null;
  }
  return user.email || user.id || user.sub || null;
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ hasKey: false }, { status: 200 });
  }

  const userId = getUserIdFromSession(session);
  if (!userId) {
    return NextResponse.json({ hasKey: false }, { status: 200 });
  }

  const settings = await getUserSettings(userId);
  return NextResponse.json({ hasKey: Boolean(settings?.openAIApiKey) });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = getUserIdFromSession(session);
  if (!userId) {
    return NextResponse.json({ error: "Unable to determine user" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  if (!apiKey.startsWith("sk-")) {
    return NextResponse.json(
      { error: "OpenAI keys should start with 'sk-'" },
      { status: 400 }
    );
  }

  await upsertUserSettings(userId, { openAIApiKey: apiKey });
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = getUserIdFromSession(session);
  if (!userId) {
    return NextResponse.json({ error: "Unable to determine user" }, { status: 400 });
  }

  await deleteUserOpenAIApiKey(userId);
  return NextResponse.json({ success: true });
}
