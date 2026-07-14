import "dotenv/config";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { listVideos } from "../lib/cloudflare-stream";
import { listFolderFiles, getOrCreateSharedLink } from "../lib/dropbox";

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
For videos already uploaded to Cloudflare Stream, with matching files
sitting in a Dropbox folder (matched by filename):

  npx tsx scripts/link-existing-videos.ts \\
    --client <slug> \\
    --client-name "<display name>" \\
    --dropbox-folder "/path/in/dropbox" \\
    [--price <dollars, defaults to ${DEFAULT_PRICE_DOLLARS}>]

--client-name is only required the first time you use a given --client
slug. --dropbox-folder is a Dropbox API path (relative to your Dropbox
root, e.g. "/Video Delivery/2026/Client Name"), not a local filesystem
path.

Matches Cloudflare Stream videos to Dropbox files by exact filename, and
creates/reuses a Dropbox share link for each. Titles are the filename
without its extension. Safe to re-run — skips videos already linked.
`);
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.client;
  const dropboxFolder = args["dropbox-folder"];
  if (!slug || !dropboxFolder) usage();

  const priceCents = Math.round(
    Number(args.price ?? DEFAULT_PRICE_DOLLARS) * 100
  );
  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    console.error("--price must be a positive number of dollars, e.g. 25 or 25.00");
    process.exit(1);
  }

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

  console.log("Listing Cloudflare Stream videos…");
  const streamVideos = await listVideos();
  const streamByName = new Map(
    streamVideos.filter((v) => v.name).map((v) => [v.name as string, v.uid])
  );
  console.log(`Found ${streamVideos.length} videos in Cloudflare Stream.`);

  console.log(`Listing Dropbox folder ${dropboxFolder}…`);
  const dropboxFiles = await listFolderFiles(dropboxFolder);
  console.log(`Found ${dropboxFiles.length} files in Dropbox.`);

  let linked = 0;
  let skipped = 0;
  const unmatched: string[] = [];

  for (const file of dropboxFiles) {
    const uid = streamByName.get(file.name);
    if (!uid) {
      unmatched.push(file.name);
      continue;
    }

    const existing = await prisma.video.findUnique({
      where: { cfStreamUid: uid },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const shareUrl = await getOrCreateSharedLink(file.pathLower);
    const title = path.basename(file.name, path.extname(file.name));

    await prisma.video.create({
      data: {
        clientId: client.id,
        title,
        cfStreamUid: uid,
        downloadUrl: shareUrl,
        priceCents,
      },
    });
    console.log(`Linked "${title}" (${uid})`);
    linked++;
  }

  console.log(`\nDone: ${linked} linked, ${skipped} already existed, ${unmatched.length} unmatched.`);
  if (unmatched.length > 0) {
    console.log("Unmatched Dropbox files (no Cloudflare Stream video with the same name):");
    for (const name of unmatched) console.log(`  - ${name}`);
  }
  console.log(`\nClient link: /c/${client.slug}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
