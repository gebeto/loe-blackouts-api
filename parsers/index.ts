import { z } from "zod";
import { ParserResponse } from "./types";

import { parseLOEBlackoutsSchedule } from "./lviv";

export { dayjs } from "./types";

export const availableParsers = ["lviv"] as const;
export type ParserKey = (typeof availableParsers)[number];
export const parsers: Record<ParserKey, () => Promise<ParserResponse>> = {
  lviv: parseLOEBlackoutsSchedule,
};

export const parserSchema = z.object({
  group: z.string().optional().default("1.1"),
  city: z.enum(availableParsers).optional().default("lviv"),
});
