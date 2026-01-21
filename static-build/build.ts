import fs from "fs/promises";
import path from "path";
import { generateIcs, availableParsers, ParserKey } from "../parsers";
import Handlebars from "handlebars";
import { generateEvents } from "../parsers/ics";

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
      cities: (Object.keys(availableParsers) as ParserKey[])
        .filter((c) => availableParsers[c]?.visible === true)
        .map((city) => ({
          key: city,
          label: availableParsers[city]?.label ?? city,
        })),
    }),
    "utf-8",
  );

  for (const [parserKey, parser] of Object.entries(availableParsers)) {
    const cityDirectory = path.join(rootDir, parserKey);
    await fs.mkdir(cityDirectory, { recursive: true });

    const schedule = await parser.parser();
    fs.writeFile(
      path.join(cityDirectory, "schedule.json"),
      JSON.stringify(schedule, null, 2),
      "utf-8",
    );

    fs.writeFile(
      path.join(cityDirectory, "index.html"),
      groupsTemplate({
        title: parserKey,
        slots: schedule.today.map((g) => {
          return {
            title: g.group,
            url: `webcal://${HOST}/${parserKey}/${g.group}.ics`,
          };
        }),
      }),
      "utf-8",
    );

    for (const today of schedule.today) {
      const tomorrowGroup = schedule.tomorrow.find(
        (g) => g.group === today.group,
      );
      fs.writeFile(
        path.join(cityDirectory, `${today.group}.ics`),
        generateIcs(today.group, [
          ...generateEvents(today),
          ...(tomorrowGroup ? generateEvents(tomorrowGroup) : []),
        ]),
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
