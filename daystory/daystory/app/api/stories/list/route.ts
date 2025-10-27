import { auth } from "@/auth";
import { getStoriesByUser } from "@/lib/firebase";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

function getUserIdFromSession(session: any): string | null {
  if (!session?.user) {
    return null;
  }
  const user = session.user;
  return user.email || user.id || user.sub || null;
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = getUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json({ error: "Unable to determine user" }, { status: 400 });
    }
    const stories = await getStoriesByUser(userId);

    return NextResponse.json({ stories });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}
