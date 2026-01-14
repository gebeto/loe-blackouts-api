import fs from "fs/promises";
import path from "path";
import { parsers, generateIcs } from "../parsers";
import Handlebars from "handlebars";

const HOST = process.env.HOST || "localhost:3000";

(async () => {
  const indexTemplate = Handlebars.compile(
    await fs.readFile(path.join(__dirname, "index.handlebars"), "utf-8")
  );
  const groupsTemplate = Handlebars.compile(
    await fs.readFile(path.join(__dirname, "groups.handlebars"), "utf-8")
  );

  const rootDir = path.resolve(__dirname, "..", "dist");
  await fs.mkdir(rootDir, { recursive: true });
  await fs.writeFile(
    path.join(rootDir, "index.html"),
    indexTemplate({ cities: Object.keys(parsers) }),
    "utf-8"
  );

  for (const [city, parser] of Object.entries(parsers)) {
    const cityDirectory = path.join(rootDir, city);
    await fs.mkdir(cityDirectory, { recursive: true });

    const response = await parser();
    fs.writeFile(
      path.join(cityDirectory, "schedule.json"),
      JSON.stringify(response, null, 2),
      "utf-8"
    );

    fs.writeFile(
      path.join(cityDirectory, "index.html"),
      groupsTemplate({
        title: city,
        groups: Object.keys(response.groups).map((g) => ({
          title: g,
          url: `webcal://${HOST}/${city}/${g}.ics`,
        })),
      }),
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
