import { auth } from "@/auth";
import { generatePixarScript } from "@/lib/openai";
import { CHARACTERS } from "@/lib/characters";
import { getUserSettings } from "@/lib/firebase";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

type SessionUser = (Session["user"] & { id?: string; sub?: string }) | null | undefined;

function getUserIdFromSession(session: Awaited<ReturnType<typeof auth>>): string | null {
  const typedSession = session as (Session & { user?: SessionUser }) | null;
  const user = typedSession?.user;
  if (!user) {
    return null;
  }
  return user.email || user.id || user.sub || null;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { events, characterId, date } = body;

    if (!events || !characterId || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const character = CHARACTERS.find((c) => c.id === characterId);

    if (!character) {
      return NextResponse.json({ error: "Invalid character" }, { status: 400 });
    }

    const typedSession = session as Session | null;
    const userName = typedSession?.user?.name || "User";
    const userId = getUserIdFromSession(session);

    if (!userId) {
      return NextResponse.json({ error: "Unable to determine user" }, { status: 400 });
    }

    const userSettings = await getUserSettings(userId);

    if (!userSettings?.openAIApiKey) {
      return NextResponse.json(
        { error: "Please enter your OpenAI API key using the header button before generating a script." },
        { status: 400 }
      );
    }

    const selectedDate = new Date(date);

    const script = await generatePixarScript(
      events,
      character,
      userName,
      selectedDate,
      userSettings.openAIApiKey
    );

    return NextResponse.json({ script });
  } catch (error) {
    console.error("Error generating script:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate script";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
