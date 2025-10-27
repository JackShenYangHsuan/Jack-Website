import { auth } from "@/auth";
import { saveStory } from "@/lib/firebase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, characterId, characterName, script, events } = body;

    if (!date || !characterId || !characterName || !script || !events) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const storyId = await saveStory({
      userId: session.user.email || session.user.id || "",
      userName: session.user.name || "User",
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
