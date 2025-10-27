import { auth } from "@/auth";
import { saveStory } from "@/lib/firebase";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

function getUserIdFromSession(session: any): { id: string; name: string } | null {
  if (!session?.user) {
    return null;
  }
  const user = session.user;
  const id = user.email || user.id || user.sub;
  if (!id) {
    return null;
  }
  return { id, name: user.name || "User" };
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, characterId, characterName, script, events } = body;

    const userInfo = getUserIdFromSession(session);

    if (!userInfo) {
      return NextResponse.json({ error: "Unable to determine user" }, { status: 400 });
    }

    if (!date || !characterId || !characterName || !script || !events) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const storyId = await saveStory({
      userId: userInfo.id,
      userName: userInfo.name,
      date,
      characterId,
      characterName,
      script,
      events,
      videoProvider: null,
      videoJobId: null,
      status: "script_generated",
    });

    return NextResponse.json({ storyId });
  } catch (error) {
    console.error("Error saving story:", error);
    return NextResponse.json(
      { error: "Failed to save story" },
      { status: 500 }
    );
  }
}
