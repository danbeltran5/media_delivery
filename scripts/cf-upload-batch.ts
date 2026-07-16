import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { uploadLargeVideo } from "../lib/cloudflare-stream";

function usage(): never {
  console.error(`
Uploads one or more local video files to Cloudflare Stream via resumable
(TUS) upload -- safe for files well beyond the ~200MB simple-upload limit.
Writes a JSON manifest mapping filename -> Cloudflare Stream UID.

  npx tsx scripts/cf-upload-batch.ts \\
    --out <path/to/manifest.json> \\
    <file1.mp4> <file2.mp4> ...
`);
  process.exit(1);
}

function formatBytes(n: number) {
  return `${(n / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

async function main() {
  const argv = process.argv.slice(2);
  const outIdx = argv.indexOf("--out");
  if (outIdx === -1 || !argv[outIdx + 1]) usage();
  const outPath = argv[outIdx + 1];
  const files = argv.filter((_, i) => i !== outIdx && i !== outIdx + 1);
  if (files.length === 0) usage();

  const manifest: Record<string, string> = fs.existsSync(outPath)
    ? JSON.parse(fs.readFileSync(outPath, "utf8"))
    : {};

  for (const file of files) {
    const name = path.basename(file);
    if (manifest[name]) {
      console.log(`Skipping ${name} (already uploaded: ${manifest[name]})`);
      continue;
    }
    if (!fs.existsSync(file)) {
      console.error(`File not found: ${file}`);
      continue;
    }
    const size = fs.statSync(file).size;
    console.log(`Uploading ${name} (${formatBytes(size)})…`);
    const started = Date.now();
    const uid = await uploadLargeVideo(file, name, (uploaded, total) => {
      const pct = ((uploaded / total) * 100).toFixed(1);
      const elapsed = (Date.now() - started) / 1000;
      const mbps = uploaded / 1024 / 1024 / elapsed;
      process.stdout.write(
        `\r  ${name}: ${pct}% (${formatBytes(uploaded)}/${formatBytes(total)}, ${mbps.toFixed(1)} MB/s)   `
      );
    });
    process.stdout.write("\n");
    console.log(`Done: ${name} -> ${uid}`);
    manifest[name] = uid;
    fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  }

  console.log(`\nManifest written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
