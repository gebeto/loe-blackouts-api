import type { VercelRequest, VercelResponse } from "@vercel/node";

const parseLOEBlackoutsSchedule = async () => {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await parseLOEBlackoutsSchedule();
  return res.json(response);
}
