import fs from "fs/promises";
import path from "path";
import { parsers, generateIcs, availableParsersLabels } from "../parsers";
import Handlebars from "handlebars";

const HOST = process.env.HOST || "localhost:3000";

const asyncWait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const handleRetries = async (
  callback: () => Promise<void>,
  delayMs: number,
  retriesCount: number,
) => {
  for (let attempt = 1; attempt <= retriesCount; attempt++) {
    try {
      await callback();
      break;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Attempt ${attempt} failed with error: ${error.message}`);
        if (attempt === retriesCount) {
          console.error("All retry attempts failed.");
          throw error;
        }
      }
    }
    console.log(`Waiting for ${delayMs}ms before retrying...`);
    await asyncWait(delayMs);
  }
};

const buildStaticFiles = async () => {
  const indexTemplate = Handlebars.compile(
    await fs.readFile(path.join(__dirname, "index.handlebars"), "utf-8"),
  );
  const groupsTemplate = Handlebars.compile(
    await fs.readFile(path.join(__dirname, "groups.handlebars"), "utf-8"),
  );

  const rootDir = path.resolve(__dirname, "..", "dist");
  await fs.rm(rootDir, { recursive: true, force: true });
  await fs.mkdir(rootDir, { recursive: true });
  await fs.writeFile(
    path.join(rootDir, "index.html"),
    indexTemplate({
      cities: Object.keys(parsers).map((city) => ({
        key: city,
        label: availableParsersLabels[city] ?? city,
      })),
    }),
    "utf-8",
  );

  for (const [city, parser] of Object.entries(parsers)) {
    const cityDirectory = path.join(rootDir, city);
    await fs.mkdir(cityDirectory, { recursive: true });

    const schedule = await parser();
    fs.writeFile(
      path.join(cityDirectory, "schedule.json"),
      JSON.stringify(
        {
          allGroups: schedule.allGroups,
          slotsForGroup: schedule.slotsForGroup,
        },
        null,
        2,
      ),
      "utf-8",
    );

    fs.writeFile(
      path.join(cityDirectory, "index.html"),
      groupsTemplate({
        title: city,
        slots: [
          { title: "All", url: `webcal://${HOST}/${city}/all.ics` },
          ...schedule.allGroups.map((g) => {
            return {
              title: g,
              url: `webcal://${HOST}/${city}/${g}.ics`,
            };
          }),
        ],
      }),
      "utf-8",
    );

    fs.writeFile(
      path.join(cityDirectory, `all.ics`),
      generateIcs(schedule.allSlots),
      "utf-8",
    );

    for (const group of schedule.allGroups) {
      fs.writeFile(
        path.join(cityDirectory, `${group}.ics`),
        generateIcs(schedule.slotsForGroup[group] ?? [], group),
        "utf-8",
      );
    }
  }
};

(async () => {
  await handleRetries(
    async () => {
      await buildStaticFiles();
    },
    20000,
    3,
  );
})();
