import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parsers, parserSchema, dayjs } from "../parsers";

import * as ics from "ics";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const events: ics.EventAttributes[] = [];
  const validation = parserSchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json(validation.error.issues);
  }
  const { group, city } = validation.data;
  const response = await parsers[city]();
  response.groups[group].forEach((timeRange) => {
    const start = dayjs(timeRange.start)
      .format("YYYY-M-D-H-m")
      .split("-")
      .map((a) => parseInt(a)) as ics.DateArray;
    const end = dayjs(timeRange.end)
      .format("YYYY-M-D-H-m")
      .split("-")
      .map((a) => parseInt(a)) as ics.DateArray;

    const event: ics.EventAttributes = {
      uid: timeRange.start + "-" + timeRange.end + "@" + "loe-blackouts",
      startOutputType: "local",
      start: start,
      end: end,
      busyStatus: "BUSY",
      transp: "TRANSPARENT",
      title: `${group} Відключення світла`,
      alarms: [
        {
          action: "display",
          description: "Відключення світла скоро почнеться",
          trigger: { minutes: 30, before: true },
          repeat: 1,
          attach: "Glass",
        },
      ],
    };
    events.push(event);
  });

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  return res.send(
    ics.createEvents(events, {
      calName: `${group} Відключення світла`,
    }).value
  );
}
