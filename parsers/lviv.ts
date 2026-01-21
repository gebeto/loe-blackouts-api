import { parse } from "node-html-parser";
import {
  BlackoutTimeRange,
  dayjs,
  BlackoutSchedule,
  BlackoutGroup,
} from "./types";

class LOEParser {
  async parse(): Promise<BlackoutSchedule> {
    const { today, tomorrow } = await this.fetchData();
    const todayGroups = this.parseHtmlDataToObject(today);
    const tomorrowGroups = this.parseHtmlDataToObject(tomorrow);

    return {
      today: todayGroups,
      tomorrow: tomorrowGroups,
      // allSlots: groups.map((g) => g.timeRanges).flat(),
      // allGroups: groups.map((g) => g.group),
      // slotsForGroup: groups.reduce(
      //   (acc, group) => {
      //     if (!acc[group.group]) {
      //       acc[group.group] = [];
      //     }
      //     acc[group.group] = group.timeRanges;
      //     return acc;
      //   },
      //   {} as BlackoutSchedule["slotsForGroup"],
      // ),
    };
  }

  async fetchData() {
    const response = await fetch(
      "https://api.loe.lviv.ua/api/menus?page=1&type=photo-grafic",
    );
    const responseData = await response.json();

    try {
      if (Array.isArray(responseData)) {
        return {
          today: responseData[0]["menuItems"][0]["rawHtml"] ?? "",
          tomorrow: responseData[0]["menuItems"][2]["rawHtml"] ?? "",
        };
      } else if ("hydra:member" in responseData) {
        return {
          today:
            responseData["hydra:member"][0]["menuItems"][0]["rawHtml"] ?? "",
          tomorrow:
            responseData["hydra:member"][0]["menuItems"][2]["rawHtml"] ?? "",
        };
      }

      return {
        today: responseData["hydra:member"][0]["menuItems"][0]["rawHtml"] ?? "",
        tomorrow:
          responseData["hydra:member"][0]["menuItems"][2]["rawHtml"] ?? "",
      };
    } catch (error) {
      console.error(
        "Error parsing LOE API response:",
        JSON.stringify(responseData, undefined, 2),
      );
      throw error;
    }
  }

  parseHtmlDataToObject(htmlData: string): BlackoutGroup[] {
    const parsed = parse(htmlData);
    const parsedRows = [...parsed.querySelectorAll("p")].map(
      (p) => p.textContent,
    );
    if (!parsedRows.length) {
      return [];
    }
    const [title, _details, ...items] = parsedRows;
    const titleSplit = title.split(" ");
    const blackoutDate = dayjs(
      titleSplit[titleSplit.length - 1],
      "DD.MM.YYYY",
    ).format("YYYY-MM-DD");
    const groups = items.map((item) => {
      if (item.includes("Електроенергія є")) {
        const [groupRaw, _times] = item.split("Електроенергія є");
        const group = /\d\.\d/.exec(groupRaw)?.[0] ?? "";
        return {
          group: group,
          date: blackoutDate,
          timeRanges: [],
        } satisfies BlackoutGroup;
      }
      const [groupRaw, _times] = item.split("Електроенергії немає");
      const group = /\d\.\d/.exec(groupRaw)?.[0] ?? "";
      const times = _times
        .replace(/\./g, "")
        .trim()
        .split(", ")
        .map((time: string) =>
          this.parseTimeRange(group, blackoutDate, time.trim()),
        )
        .filter((i) => i.start && i.end);
      return {
        group: group,
        date: blackoutDate,
        timeRanges: times,
      } satisfies BlackoutGroup;
    });
    return groups;
  }

  parseTimeRange(
    group: string,
    date: string,
    timeRange: string,
  ): BlackoutTimeRange {
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
  }
}

export const parseLOEBlackoutsSchedule = () => {
  const parser = new LOEParser();
  return parser.parse();
};
