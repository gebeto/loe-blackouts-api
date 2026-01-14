import { parse } from "node-html-parser";
import { ParserResponse, TimeRange, dayjs } from "./types";

export const parseTimeRange = (
  group: string,
  date: string,
  timeRange: string
): TimeRange => {
  const matches = /з\s(\d\d:\d\d)\sдо\s(\d\d:\d\d)/.exec(timeRange);
  if (matches) {
    const start = dayjs.tz(`${date}T${matches[1]}:00`, "Europe/Kyiv").utc();
    const end = dayjs.tz(`${date}T${matches[2]}:00`, "Europe/Kyiv").utc();
    return {
      group: group,
      start: start.format(),
      end: end.format(),
    };
  }
  return {
    group: group,
    start: "",
    end: "",
  };
};

class LOPParser {
  async fetchData() {
    const response = await fetch(
      "https://api.loe.lviv.ua/api/menus?page=1&type=photo-grafic"
    );
    const responseData = await response.json();

    return {
      today: responseData["hydra:member"][0]["menuItems"][0]["rawHtml"] ?? "",
      tomorrow:
        responseData["hydra:member"][0]["menuItems"][2]["rawHtml"] ?? "",
    };
  }

  parseHtmlDataToObject(htmlData: string): ParserResponse {
    const parsed = parse(htmlData);
    const parsedRows = [...parsed.querySelectorAll("p")].map(
      (p) => p.textContent
    );
    if (!parsedRows.length) {
      return { date: dayjs().format("YYYY-MM-DD"), slots: [] };
    }
    const [title, _details, ...items] = parsedRows;
    const titleSplit = title.split(" ");
    const blackoutDate = dayjs(
      titleSplit[titleSplit.length - 1],
      "DD.MM.YYYY"
    ).format("YYYY-MM-DD");
    return {
      date: blackoutDate,
      slots: items
        .map((item) => {
          const [groupRaw, _times] = item.split("Електроенергії немає");
          const group = /\d\.\d/.exec(groupRaw)?.[0] ?? "";
          const times = _times
            .replace(/\./g, "")
            .trim()
            .split(", ")
            .map((time) => parseTimeRange(group, blackoutDate, time.trim()))
            .filter((i) => i.start && i.end);
          return times;
        })
        .flat(),
    };
  }

  async parse(): Promise<ParserResponse[]> {
    const { today, tomorrow } = await this.fetchData();

    return [
      this.parseHtmlDataToObject(today),
      this.parseHtmlDataToObject(tomorrow),
    ];
  }
}

export const parseLOEBlackoutsSchedule = () => {
  const parser = new LOPParser();
  return parser.parse();
};
