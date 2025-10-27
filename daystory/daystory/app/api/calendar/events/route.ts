import { auth } from "@/auth";
import { getCalendarEvents } from "@/lib/googleCalendar";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json({ error: "Date parameter required" }, { status: 400 });
  }

  try {
    const date = new Date(dateStr);
    const events = await getCalendarEvents(
      session.accessToken,
      date,
      session.refreshToken
    );

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
