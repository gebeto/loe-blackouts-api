import { parsers, dayjs, ParserKey } from "../parsers";

import * as ics from "ics";
import { ParserResponse, TimeRange } from "./types";

function createEventForGroup(group: string, timeRange: TimeRange) {
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

  return event;
}

export function generateIcs(
  blackoutSchedule: ParserResponse,
  group?: string
): string {
  const events: ics.EventAttributes[] = [];
  if (group) {
    blackoutSchedule.groups[group].forEach((timeRange) => {
      events.push(createEventForGroup(group, timeRange));
    });
  } else {
    Object.keys(blackoutSchedule.groups).forEach((group) => {
      blackoutSchedule.groups[group].forEach((timeRange) => {
        events.push(createEventForGroup(group, timeRange));
      });
    });
  }

  const result = ics.createEvents(events, {
    calName: group ? `${group} Відключення світла` : "Відключення світла",
  }).value;

  return result ?? "";
}
