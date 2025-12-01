import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parse } from "node-html-parser";

type TimeRange = {
  start: string;
  end: string;
};

const parseTimeRange = (timeRange: string): TimeRange => {
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

const parseLOEBlackoutsSchedule = async () => {
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
  return {
    title,
    details,
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await parseLOEBlackoutsSchedule();
  return res.json(response);
}
