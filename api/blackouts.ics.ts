import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseLOEBlackoutsSchedule } from "../parser";

import * as ics from "ics";
import dayjs from "dayjs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const events: ics.EventAttributes[] = [];

  const response = await parseLOEBlackoutsSchedule();
  response.data["1.1"].forEach((timeRange) => {
    const start = dayjs
      .tz(`${response.date}T${timeRange.start}:00`, "Europe/Kyiv")
      .format("YYYY-M-D-H-m")
      .split("-")
      .map((a) => parseInt(a)) as ics.DateArray;
    const end = dayjs
      .tz(`${response.date}T${timeRange.end}:00`, "Europe/Kyiv")
      .format("YYYY-M-D-H-m")
      .split("-")
      .map((a) => parseInt(a)) as ics.DateArray;

    const event: ics.EventAttributes = {
      uid: timeRange.start + "-" + timeRange.end + "@" + "loe-blackouts",
      startOutputType: "local",
      start: start,
      end: end,
      title: `Відключення 1.1`,
    };
    events.push(event);
  });

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  return res.send(ics.createEvents(events).value);
}
