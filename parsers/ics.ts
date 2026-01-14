import { dayjs } from "../parsers";

import * as ics from "ics";
import { BlackoutTimeRange } from "./types";

function createEventForGroup(timeRange: BlackoutTimeRange) {
  const start = dayjs(timeRange.start)
    .tz("Europe/Kyiv")
    .format("YYYY-M-D-H-m")
    .split("-")
    .map((a) => parseInt(a)) as ics.DateArray;
  const end = dayjs(timeRange.end)
    .tz("Europe/Kyiv")
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
    title: `${timeRange.group} Відключення світла`,
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

  return event;
}

export function generateIcs(
  blackoutSchedule: BlackoutTimeRange[],
  groupTitle?: string
): string {
  const events: ics.EventAttributes[] = [];
  blackoutSchedule.forEach((timeRange) => {
    events.push(createEventForGroup(timeRange));
  });

  const result = ics.createEvents(events, {
    calName: groupTitle
      ? `${groupTitle} Відключення світла`
      : "Відключення світла",
  }).value;

  return result ?? "";
}
