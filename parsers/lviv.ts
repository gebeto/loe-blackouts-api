import { parse } from "node-html-parser";
import { ParserResponse, TimeRange, dayjs } from "./types";

export const parseTimeRange = (timeRange: string, date: string): TimeRange => {
  const matches = /з\s(\d\d:\d\d)\sдо\s(\d\d:\d\d)/.exec(timeRange);
  if (matches) {
    const start = dayjs.tz(`${date}T${matches[1]}:00`, "Europe/Kyiv").utc();
    const end = dayjs.tz(`${date}T${matches[2]}:00`, "Europe/Kyiv").utc();
    return {
      start: start.format(),
      end: end.format(),
    };
  }
  return {
    start: "",
    end: "",
  };
};

export const parseLOEBlackoutsSchedule = async (): Promise<ParserResponse> => {
  const response = await fetch(
    "https://api.loe.lviv.ua/api/menus?page=1&type=photo-grafic"
  );
  const responseData = await response.json();
  const htmlData = responseData["hydra:member"][0]["menuItems"][0]["rawHtml"];
  const parsed = parse(htmlData);
  const parsedRows = [...parsed.querySelectorAll("p")].map(
    (p) => p.textContent
  );
  const [title, _details, ...items] = parsedRows;
  const titleSplit = title.split(" ");
  const blackoutDate = dayjs(
    titleSplit[titleSplit.length - 1],
    "DD.MM.YYYY"
  ).format("YYYY-MM-DD");
  return {
    date: blackoutDate,
    groups: items
      .map((item) => {
        const [group, _times] = item.split("Електроенергії немає");
        const times = _times
          .replace(/\./g, "")
          .trim()
          .split(", ")
          .map((time) => parseTimeRange(time.trim(), blackoutDate))
          .filter((i) => i.start && i.end);
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
