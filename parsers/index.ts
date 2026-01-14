import { z } from "zod";
import { ParserResponse } from "./types";

import { parseLOEBlackoutsSchedule } from "./lviv";

export { dayjs } from "./types";
export { generateIcs } from "./ics";

export const availableParsers = ["test", "lviv"] as const;
export type ParserKey = (typeof availableParsers)[number];
export const parsers: Record<ParserKey, () => Promise<ParserResponse>> = {
  lviv: parseLOEBlackoutsSchedule,
  test: parseLOEBlackoutsSchedule,
};

export const parserSchema = z.object({
  group: z.string().optional().default("1.1"),
  city: z.enum(availableParsers).optional().default("lviv"),
});
