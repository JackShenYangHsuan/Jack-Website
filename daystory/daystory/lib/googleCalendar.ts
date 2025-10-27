import { google } from "googleapis";

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
}

function getOAuthClient(accessToken: string, refreshToken?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

export async function getCalendarEvents(
  accessToken: string,
  date: Date,
  refreshToken?: string
): Promise<GoogleCalendarEvent[]> {
  const oauth2Client = getOAuthClient(accessToken, refreshToken);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Set time range to the selected day (midnight to midnight)
  const timeMin = new Date(date);
  timeMin.setHours(0, 0, 0, 0);

  const timeMax = new Date(date);
  timeMax.setHours(23, 59, 59, 999);

  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    return events.map((event) => ({
      id: event.id || "",
      title: event.summary || "Untitled Event",
      description: event.description || undefined,
      startTime: new Date(event.start?.dateTime || event.start?.date || ""),
      endTime: new Date(event.end?.dateTime || event.end?.date || ""),
      location: event.location || undefined,
      attendees: event.attendees?.map((a) => a.email || "") || [],
    }));
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw new Error("Failed to fetch calendar events");
  }
}

export async function getCalendarDaysWithEvents(
  accessToken: string,
  month: Date,
  refreshToken?: string
): Promise<{ date: string; hasEvents: boolean; eventCount: number }[]> {
  const oauth2Client = getOAuthClient(accessToken, refreshToken);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Get the first and last day of the month
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: firstDay.toISOString(),
      timeMax: lastDay.toISOString(),
      singleEvents: true,
    });

    const events = response.data.items || [];

    // Group events by day
    const eventsByDay = new Map<string, number>();

    events.forEach((event) => {
      const eventDate = new Date(event.start?.dateTime || event.start?.date || "");
      const dateKey = eventDate.toISOString().split("T")[0];
      eventsByDay.set(dateKey, (eventsByDay.get(dateKey) || 0) + 1);
    });

    // Generate all days in the month
    const days = [];
    const currentDate = new Date(firstDay);

    while (currentDate <= lastDay) {
      const dateKey = currentDate.toISOString().split("T")[0];
      const eventCount = eventsByDay.get(dateKey) || 0;

      days.push({
        date: dateKey,
        hasEvents: eventCount > 0,
        eventCount,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  } catch (error) {
    console.error("Error fetching calendar overview:", error);
    throw new Error("Failed to fetch calendar overview");
  }
}
