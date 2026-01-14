import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parsers, parserSchema } from "../parsers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const validation = parserSchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json(validation.error.issues);
  }
  const { city } = validation.data;
  const response = await parsers[city]();
  return res.json(response);
}
