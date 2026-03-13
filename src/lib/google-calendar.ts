import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
);

export function getCalendarClient(accessToken: string, refreshToken?: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function createGoogleMeetEvent(
  accessToken: string,
  refreshToken: string | undefined,
  {
    summary,
    description,
    startTime,
    endTime,
    attendeeEmail,
    calendarId = "primary",
    timezone = "Europe/Rome",
  }: {
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendeeEmail: string;
    calendarId?: string;
    timezone?: string;
  }
) {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const event = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: timezone,
      },
      attendees: [{ email: attendeeEmail }],
      conferenceData: {
        createRequest: {
          requestId: `ddgbooking-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    },
  });

  return {
    eventId: event.data.id,
    meetLink: event.data.conferenceData?.entryPoints?.[0]?.uri || null,
    htmlLink: event.data.htmlLink,
  };
}

export async function getFreeBusy(
  accessToken: string,
  refreshToken: string | undefined,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
) {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: "Europe/Rome",
      items: [{ id: calendarId }],
    },
  });

  return res.data.calendars?.[calendarId]?.busy || [];
}
