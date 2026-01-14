import dayjs from "dayjs";
import dayjsAdvancedFormat from "dayjs/plugin/advancedFormat";
import dayjsCustomParsedFormat from "dayjs/plugin/customParseFormat";
import dayjsUtc from "dayjs/plugin/utc";
import dayjsTz from "dayjs/plugin/timezone";

dayjs.extend(dayjsAdvancedFormat);
dayjs.extend(dayjsCustomParsedFormat);
dayjs.extend(dayjsUtc);
dayjs.extend(dayjsTz);

export { dayjs };

export type TimeRange = {
  group: string;
  start: string;
  end: string;
};

export type ParserResponse = {
  date: string;
  slots: TimeRange[];
};
