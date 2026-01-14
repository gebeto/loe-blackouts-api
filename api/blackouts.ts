import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parsers, parserSchema } from "../parsers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { city } = parserSchema.parse(req.query);
  const response = await parsers[city]();
  return res.json(response);
}
