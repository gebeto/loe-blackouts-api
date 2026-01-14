import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parserSchema } from "../parsers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const validation = parserSchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json(validation.error.issues);
  }
  const { city, group } = validation.data;
  const data = await fetch(
    `https://gebeto.github.io/loe-blackouts-api/${city}/${group}.ics`
  ).then((r) => r.text());
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  return res.send(data);
}
