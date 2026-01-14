import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parsers, parserSchema } from "../parsers";
import { generateIcs } from "../parsers/ics";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const validation = parserSchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json(validation.error.issues);
  }
  const { city, group } = validation.data;
  const blackoutSchedule = await parsers[city]();

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  return res.send(generateIcs(blackoutSchedule, group));
}
