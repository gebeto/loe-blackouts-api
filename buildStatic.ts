import fs from "fs/promises";
import path from "path";
import { parsers, generateIcs } from "./parsers";

(async () => {
  const rootDir = path.resolve(__dirname, "dist");
  await fs.mkdir(rootDir, { recursive: true });

  for (const [city, parser] of Object.entries(parsers)) {
    const cityDirectory = path.join(rootDir, city);
    await fs.mkdir(cityDirectory, { recursive: true });

    const response = await parser();
    fs.writeFile(
      path.join(cityDirectory, "schedule.json"),
      JSON.stringify(response, null, 2),
      "utf-8"
    );

    for (const group of Object.keys(response.groups)) {
      fs.writeFile(
        path.join(cityDirectory, `${group}.ics`),
        generateIcs(response, group),
        "utf-8"
      );
    }
  }
})();
