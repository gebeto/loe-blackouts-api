import { z } from "zod";
import { UnionToTuple } from "type-fest";

import { parseLOEBlackoutsSchedule } from "./lviv";

export { dayjs } from "./types";
export { generateIcs } from "./ics";

export const availableParsers = {
  lviv: {
    key: "lviv",
    label: "Львів",
    parser: parseLOEBlackoutsSchedule,
    visible: true,
  },
  test: {
    key: "test",
    label: "Тестовий парсер",
    parser: parseLOEBlackoutsSchedule,
    visible: false,
  },
};
export type ParserKey = keyof typeof availableParsers;

export const availableParserKeys = Object.keys(
  availableParsers,
) as UnionToTuple<ParserKey>;

export const parserSchema = z.object({
  group: z.string().optional().default("1.1"),
  city: z.enum(availableParserKeys).optional().default("lviv"),
});
