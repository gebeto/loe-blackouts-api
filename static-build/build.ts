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
    const allSlots = response.map((d) => d.slots).flat();
    const allGroups = Array.from(new Set(allSlots.map((s) => s.group)));
    fs.writeFile(
      path.join(cityDirectory, "schedule.json"),
      JSON.stringify(allSlots, null, 2),
      "utf-8"
    );

    fs.writeFile(
      path.join(cityDirectory, "index.html"),
      groupsTemplate({
        title: city,
        slots: [
          { title: "All", url: `webcal://${HOST}/${city}/all.ics` },
          ...allGroups.map((g) => {
            return {
              title: g,
              url: `webcal://${HOST}/${city}/${g}.ics`,
            };
          }),
        ],
      }),
      "utf-8"
    );

    fs.writeFile(
      path.join(cityDirectory, `all.ics`),
      generateIcs(allSlots),
      "utf-8"
    );

    for (const group of allGroups) {
      fs.writeFile(
        path.join(cityDirectory, `${group}.ics`),
        generateIcs(
          allSlots.filter((s) => s.group === group),
          group
        ),
        "utf-8"
      );
    }
  }
})();
