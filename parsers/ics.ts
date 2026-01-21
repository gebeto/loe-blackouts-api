import { dayjs } from "../parsers";

import * as ics from "ics";
import { BlackoutGroup, BlackoutTimeRange } from "./types";

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
    busyStatus: "FREE",
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

export function generateEvents(group: BlackoutGroup) {
  if (group.timeRanges.length === 0) {
    const startObj = dayjs(group.date, "YYYY-MM-DD");
    const start = startObj
      .format("YYYY-M-D")
      .split("-")
      .map((a) => parseInt(a)) as ics.DateArray;
    return [
      {
        uid: startObj.format("YYYY-MM-DD") + "@" + "loe-blackouts",
        startOutputType: "local",
        start: start,
        duration: { days: 1 },
        busyStatus: "FREE",
        transp: "TRANSPARENT",
        title: `${group.group} Світло НЕ відключається`,
      } satisfies ics.EventAttributes,
    ];
  }
  return group.timeRanges.map((timeRange) => {
    return createEventForGroup(timeRange);
  });
}

export function generateIcs(
  groupName: string,
  events: ics.EventAttributes[],
): string {
  const result = ics.createEvents(events, {
    calName: `${groupName} Відключення світла`,
  }).value;

  return result ?? "";
}
