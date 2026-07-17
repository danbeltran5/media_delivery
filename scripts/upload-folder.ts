import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { uploadVideo } from "../lib/cloudflare-stream";
import { getOrCreateSharedLink } from "../lib/dropbox";

const DEFAULT_PRICE_DOLLARS = 65;
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".m4v"]);

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
Uploads every video file in a local folder to Cloudflare Stream (fresh
uploads, not matched against anything existing) and creates a Video row
for each, using a Dropbox share link generated from the matching path in
your Dropbox folder.

  npx tsx scripts/upload-folder.ts \\
    --client <slug> \\
    --client-name "<display name>" \\
    --local-folder "/local/path/to/videos" \\
    --dropbox-folder "/path/in/dropbox" \\
    [--price <dollars, defaults to ${DEFAULT_PRICE_DOLLARS}>]

--client-name is only required if the client doesn't already exist.
--dropbox-folder is a Dropbox API path (relative to your Dropbox root),
and must contain files with the exact same names as --local-folder.
Titles are the filename without its extension.
`);
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.client;
  const localFolder = args["local-folder"];
  const dropboxFolder = args["dropbox-folder"];
  if (!slug || !localFolder || !dropboxFolder) usage();

  const priceCents = Math.round(Number(args.price ?? DEFAULT_PRICE_DOLLARS) * 100);
  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    console.error("--price must be a positive number of dollars, e.g. 55 or 55.00");
    process.exit(1);
  }

  let client = await prisma.client.findUnique({ where: { slug } });
  if (!client) {
    if (!args["client-name"]) {
      console.error(`No client found for slug "${slug}". Pass --client-name to create it.`);
      process.exit(1);
    }
    client = await prisma.client.create({ data: { slug, name: args["client-name"] } });
    console.log(`Created client "${client.name}" (${client.slug})`);
  }

  const files = fs
    .readdirSync(localFolder)
    .filter((f) => VIDEO_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.error(`No video files found in ${localFolder}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} video files. Uploading at $${(priceCents / 100).toFixed(2)} each…\n`);

  let ok = 0;
  for (const [i, file] of files.entries()) {
    const localPath = path.join(localFolder, file);
    const title = path.basename(file, path.extname(file));
    const dropboxPath = `${dropboxFolder}/${file}`;

    try {
      console.log(`[${i + 1}/${files.length}] ${file}: uploading to Cloudflare Stream…`);
      const uid = await uploadVideo(localPath, file);

      console.log(`[${i + 1}/${files.length}] ${file}: getting Dropbox share link…`);
      const shareUrl = await getOrCreateSharedLink(dropboxPath);

      await prisma.video.create({
        data: {
          clientId: client.id,
          title,
          cfStreamUid: uid,
          downloadUrl: shareUrl,
          priceCents,
        },
      });
      console.log(`[${i + 1}/${files.length}] ${file}: done (${uid})\n`);
      ok++;
    } catch (err) {
      console.error(`[${i + 1}/${files.length}] ${file}: FAILED — ${(err as Error).message}\n`);
    }
  }

  console.log(`\nDone: ${ok}/${files.length} videos added.`);
  console.log(`Client link: /${client.slug}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
