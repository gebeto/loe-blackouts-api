import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parse } from "node-html-parser";
import dayjs from "dayjs";
import dayjsAdvancedFormat from "dayjs/plugin/advancedFormat";
import dayjsCustomParsedFormat from "dayjs/plugin/customParseFormat";
import dayjsUtc from "dayjs/plugin/utc";
import dayjsTz from "dayjs/plugin/timezone";

dayjs.extend(dayjsAdvancedFormat);
dayjs.extend(dayjsCustomParsedFormat);
dayjs.extend(dayjsUtc);
dayjs.extend(dayjsTz);

type TimeRange = {
  start: string;
  end: string;
};

export const parseTimeRange = (timeRange: string): TimeRange => {
  const matches = /з\s(\d\d:\d\d)\sдо\s(\d\d:\d\d)/.exec(timeRange);
  if (matches) {
    return {
      start: matches[1],
      end: matches[2],
    };
  }
  return {
    start: "",
    end: "",
  };
};

export const parseLOEBlackoutsSchedule = async () => {
  const response = await fetch(
    "https://api.loe.lviv.ua/api/menus?page=1&type=photo-grafic"
  );
  const responseData = await response.json();
  const htmlData = responseData["hydra:member"][0]["menuItems"][0]["rawHtml"];
  const parsed = parse(htmlData);
  const parsedRows = [...parsed.querySelectorAll("p")].map(
    (p) => p.textContent
  );
  const [title, details, ...items] = parsedRows;
  const titleSplit = title.split(" ");
  const blackoutDate = dayjs(
    titleSplit[titleSplit.length - 1],
    "DD.MM.YYYY"
  ).format("YYYY-MM-DD");
  return {
    title: title,
    date: blackoutDate,
    details: details,
    data: items
      .map((item) => {
        const [group, _times] = item.split("Електроенергії немає");
        const times = _times
          .replace(/\./g, "")
          .trim()
          .split(", ")
          .map((time) => parseTimeRange(time.trim()))
          .filter(Boolean);
        return {
          group: /\d\.\d/.exec(group)?.[0] ?? "",
          times,
        };
      })
      .reduce((acc, curr) => {
        return {
          ...acc,
          [curr.group]: curr.times,
        };
      }, {} as Record<string, TimeRange[]>),
  };
};
