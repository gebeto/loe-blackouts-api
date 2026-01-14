import { parsers, dayjs, ParserKey } from "../parsers";

import * as ics from "ics";
import { ParserResponse } from "./types";

export function generateIcs(
  blackoutSchedule: ParserResponse,
  group: string
): string {
  const events: ics.EventAttributes[] = [];
  blackoutSchedule.groups[group].forEach((timeRange) => {
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

  const result = ics.createEvents(events, {
    calName: `${group} Відключення світла`,
  }).value;

  return result ?? "";
}
