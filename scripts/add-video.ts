import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { uploadVideo } from "../lib/cloudflare-stream";
import type { Client } from "../app/generated/prisma/client";

const DEFAULT_PRICE_DOLLARS = 65;

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, "");
    const value = argv[i + 1];
    if (!key || value === undefined) {
      throw new Error(`Malformed argument near "${argv[i]}"`);
    }
    args[key] = value;
  }
  return args;
}

function usage(): never {
  console.error(`
Add a single video:
  npx tsx scripts/add-video.ts \\
    --client <slug> \\
    --client-name "<display name>" \\
    --title "<video title>" \\
    --file <path/to/video.mp4> \\
    --dropbox-link "<dropbox share link>" \\
    [--price <dollars, defaults to ${DEFAULT_PRICE_DOLLARS}>] \\
    [--description "<text>"]

Add many videos at once from a CSV file:
  npx tsx scripts/add-video.ts \\
    --client <slug> \\
    --client-name "<display name>" \\
    --csv videos.csv

  The CSV needs a header row with columns: title,file,dropboxLink,price,description
  (price and description are optional; price defaults to ${DEFAULT_PRICE_DOLLARS}).

--client-name is only required the first time you use a given --client slug.

--file is uploaded to Cloudflare Stream, which is what the client watches
for free on the page.

--dropbox-link / dropboxLink is the "Copy link" share URL for the same (or a
higher quality master) file in your Dropbox — this is what gets served when
the client pays to download. Get it by right-clicking the file in Dropbox
and choosing "Copy link" or "Share".
`);
  process.exit(1);
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...dataRows] = rows.filter((r) => r.some((c) => c.trim() !== ""));
  return dataRows.map((r) =>
    Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()]))
  );
}

async function addOneVideo(
  client: Client,
  input: {
    title: string;
    file: string;
    dropboxLink: string;
    price?: string;
    description?: string;
  }
) {
  const priceCents = Math.round(
    Number(input.price ?? DEFAULT_PRICE_DOLLARS) * 100
  );
  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    throw new Error(
      `Invalid price "${input.price}" for "${input.title}" — must be a positive number of dollars`
    );
  }
  if (!fs.existsSync(input.file)) {
    throw new Error(`File not found: ${input.file}`);
  }
  if (!input.dropboxLink) {
    throw new Error(`Missing Dropbox link for "${input.title}"`);
  }

  console.log(`Uploading ${input.file} to Cloudflare Stream…`);
  const uid = await uploadVideo(input.file, path.basename(input.file));
  console.log(`Uploaded "${input.title}". Cloudflare Stream UID: ${uid}`);

  await prisma.video.create({
    data: {
      clientId: client.id,
      title: input.title,
      description: input.description || null,
      cfStreamUid: uid,
      downloadUrl: input.dropboxLink,
      priceCents,
    },
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.client;
  if (!slug) usage();

  let client = await prisma.client.findUnique({ where: { slug } });
  if (!client) {
    if (!args["client-name"]) {
      console.error(
        `No client found for slug "${slug}". Pass --client-name to create it.`
      );
      process.exit(1);
    }
    client = await prisma.client.create({
      data: { slug, name: args["client-name"] },
    });
    console.log(`Created client "${client.name}" (${client.slug})`);
  }

  if (args.csv) {
    const rows = parseCsv(fs.readFileSync(args.csv, "utf8"));
    if (rows.length === 0) {
      console.error(`No rows found in ${args.csv}`);
      process.exit(1);
    }
    console.log(`Adding ${rows.length} videos for "${client.slug}"…\n`);
    let ok = 0;
    for (const [i, row] of rows.entries()) {
      try {
        await addOneVideo(client, {
          title: row.title,
          file: row.file,
          dropboxLink: row.dropboxLink,
          price: row.price,
          description: row.description,
        });
        ok++;
      } catch (err) {
        console.error(`Row ${i + 2}: ${(err as Error).message}`);
      }
    }
    console.log(`\nDone: ${ok}/${rows.length} videos added.`);
  } else {
    const { title, file } = args;
    const dropboxLink = args["dropbox-link"];
    if (!title || !file || !dropboxLink) usage();
    await addOneVideo(client, {
      title,
      file,
      dropboxLink,
      price: args.price,
      description: args.description,
    });
    console.log(`\nAdded "${title}" for client "${client.slug}".`);
  }

  console.log(
    `\nNote: Cloudflare Stream may take a few minutes to finish encoding newly uploaded videos before playback works.`
  );
  console.log(`Client link: /c/${client.slug}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
