import { auth } from "@/auth";
import { getCalendarDaysWithEvents } from "@/lib/googleCalendar";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthStr = searchParams.get("month");

  if (!monthStr) {
    return NextResponse.json({ error: "Month parameter required" }, { status: 400 });
  }

  try {
    const month = new Date(monthStr);
    const days = await getCalendarDaysWithEvents(
      session.accessToken,
      month,
      session.refreshToken
    );

    return NextResponse.json({ days });
  } catch (error) {
    console.error("Error fetching calendar days:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar days" },
      { status: 500 }
    );
  }
}
