import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import {
  deleteUserOpenAIApiKey,
  getUserSettings,
  upsertUserSettings,
} from "@/lib/firebase";

function getUserIdFromSession(session: any): string | null {
  if (!session?.user) {
    return null;
  }
  const user = session.user;
  return user.email || user.id || user.sub || null;
}

export async function GET() {
  try {
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
  } catch (error) {
    console.error('Error fetching API key status:', error);
    return NextResponse.json(
      { error: "Failed to load API key status" },
      { status: 500 }
    );
  }
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

  try {
    await upsertUserSettings(userId, { openAIApiKey: apiKey });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving API key:', error);
    return NextResponse.json(
      { error: "Failed to save API key. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
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
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
