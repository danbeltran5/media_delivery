# Client Video Portal

A small app for sending clients a private link where they can watch their
videos online, add the ones they like to a cart, and pay to unlock
full-quality downloads.

- **Video streaming (preview)**: [Cloudflare Stream](https://www.cloudflare.com/products/cloudflare-stream/)
- **File delivery (paid downloads)**: your existing Dropbox
- **Payments**: [Stripe Embedded Checkout](https://stripe.com/docs/payments/checkout/embedded)
  (renders right on the page — no redirect to Stripe's site)
- **Database**: Postgres, via [Prisma](https://www.prisma.io/)
- **Hosting**: [Vercel](https://vercel.com/)

Built to start with one client, and grow to many — each client gets their
own private page at `/c/<slug>` listing their videos.

## How it works

1. You upload a video for a client using the `add-video` script. It uploads
   the file to Cloudflare Stream (for free preview streaming) and records
   the video, along with a Dropbox link to the downloadable file, in the
   database.
2. You send the client their link: `https://yourapp.vercel.app/c/<slug>`.
3. They can watch any video for free, right on the page.
4. They add whichever videos they want to a cart — a sticky bar at the
   bottom shows the running total.
5. "Checkout" opens Stripe's checkout embedded directly on the page (no
   redirect away). After paying, they land back on the page with
   "Download" buttons unlocked for everything they bought — remembered via
   a cookie in their browser, so it's still unlocked next time they visit.

## One-time setup

You'll need two free/low-cost accounts, plus your existing Dropbox. None of
this can be done for you — each involves creating an account or entering
payment details.

### 1. Cloudflare Stream

Used only for free preview streaming — not for downloads.

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com) and open
   **Stream** in the sidebar (it has a small monthly cost based on storage +
   minutes delivered — no free tier, but it's cheap for a couple dozen
   short videos).
2. Copy your **Account ID** (shown on the right side of any Cloudflare
   dashboard page) into `CLOUDFLARE_ACCOUNT_ID`.
3. Go to **My Profile -> API Tokens -> Create Token**, and create a token
   with the "Edit Cloudflare Stream" permission. Put it in
   `CLOUDFLARE_STREAM_API_TOKEN`.
4. Upload any video once through the dashboard, open it, and copy the
   `customer-XXXXXXXX` code from its preview URL into
   `CLOUDFLARE_STREAM_CUSTOMER_CODE`. (You can delete that test video
   afterwards — this code is account-wide, not per-video.)

### 2. Stripe

1. Sign up at [dashboard.stripe.com](https://dashboard.stripe.com).
2. Copy your **secret key** (Developers -> API keys) into
   `STRIPE_SECRET_KEY`, and your **publishable key** into
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Use the test keys while developing,
   live keys once you're ready to take real payments.
3. Webhook setup — see the "Stripe webhook" section below (needed for
   reliability: it's what confirms a payment even if the customer closes
   their browser tab right after paying).

### 3. Dropbox

Nothing to configure — you just need each video's file uploaded to Dropbox
and its share link handy when you run `add-video` (see below).

### 4. Postgres database

For production, create a free/low-cost Postgres database — e.g.
[Neon](https://neon.tech), [Supabase](https://supabase.com), or
[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres). Copy its
connection string into `DATABASE_URL`.

For local development, install Postgres yourself (e.g.
`brew install postgresql@16 && brew services start postgresql@16`) and
create a database, or point `DATABASE_URL` at any Postgres you already have
running.

## Local development

```bash
npm install
cp .env.example .env   # then fill in the values described above
npx prisma migrate dev # creates the database tables
npm run dev
```

Visit `http://localhost:3000`.

To test payments locally, install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
and run `stripe listen --forward-to localhost:3000/api/stripe/webhook` in a
second terminal — it prints a webhook signing secret to put in
`STRIPE_WEBHOOK_SECRET`.

## Adding videos

For each video, you need: the video file (for streaming preview) and its
Dropbox share link (for the paid download) — right-click the file in
Dropbox and choose "Copy link". It can be the same file you uploaded for
preview, or a higher-quality master.

**One at a time:**

```bash
npm run add-video -- \
  --client smith-wedding \
  --client-name "The Smiths" \
  --title "Ceremony Highlights" \
  --file /path/to/video.mp4 \
  --dropbox-link "https://www.dropbox.com/scl/fi/.../ceremony.mp4?dl=0" \
  --description "A short highlight reel from the ceremony."
```

Price defaults to $65 if you omit `--price`.

**All 35 at once, from a spreadsheet:** save a CSV with a header row —
`title,file,dropboxLink,price,description` (`price` and `description` are
optional per row) — then run:

```bash
npm run add-video -- \
  --client smith-wedding \
  --client-name "The Smiths" \
  --csv videos.csv
```

Notes:

- `--client` is a URL slug — the client's link will be `/c/smith-wedding`.
- `--client-name` is only needed the first time you use a given `--client`
  slug (it creates the client). Adding more videos for the same client
  later, you can omit it.
- Cloudflare Stream takes a few minutes to finish encoding a freshly
  uploaded video before it's watchable.
- Cloudflare's simple upload endpoint (used here) tops out around 200MB per
  file. For longer videos, either compress first or ask and this can be
  swapped for Cloudflare's resumable (TUS) upload, which has no practical
  size limit.

**Already uploaded the videos to Cloudflare Stream directly (e.g. via the
dashboard), and the same files sit in a Dropbox folder?** Skip re-uploading
and link them by filename instead. Requires a Dropbox API app (see
`DROPBOX_ACCESS_TOKEN` in `.env.example`) with `files.metadata.read`,
`files.content.read`, `sharing.write`, and `sharing.read` permissions:

```bash
npm run link-existing-videos -- \
  --client paw-ritual \
  --client-name "Paw Ritual" \
  --dropbox-folder "/Video Delivery/2026/Paw Ritual" \
  --price 65
```

`--dropbox-folder` is a path relative to your Dropbox root (not a local
filesystem path). It matches each file in that folder to a Cloudflare
Stream video with the exact same filename, creates a Dropbox share link for
it, and titles the video from the filename (without extension). Safe to
re-run — already-linked videos are skipped, and it reports any files it
couldn't match.

## Deploying

1. Push this project to a GitHub repo.
2. Import it into [Vercel](https://vercel.com/new).
3. Add all the variables from `.env.example` as Vercel environment
   variables (with your real production values — a production `DATABASE_URL`,
   not the local one).
4. Deploy.

### Stripe webhook

After your first deploy, go to **Stripe Dashboard -> Developers -> Webhooks
-> Add endpoint**, set the URL to
`https://yourapp.vercel.app/api/stripe/webhook`, and subscribe to the
`checkout.session.completed` event. Stripe will show you a signing secret —
put that in the `STRIPE_WEBHOOK_SECRET` environment variable in Vercel and
redeploy.

## Current limitations / good next steps

This was built to get one client up and running quickly. Known gaps if you
want to extend it:

- **Purchase gating is cookie-based**, not tied to a login. If a client
  switches devices/browsers, they can use "Already purchased? Restore your
  downloads" on the page and type the email they paid with — any paid
  video tied to that email unlocks immediately. This is intentionally
  **not verified** (no confirmation email/magic link) — anyone who knows
  or guesses her email could unlock her purchases this way. That's an
  accepted trade-off for a low-stakes use case; if this is ever used for
  something more sensitive, swap it for an emailed magic link instead.
- **Dropbox links aren't access-controlled by this app** — anyone who gets
  hold of a download URL (e.g. it leaks from a browser history) could use
  it without paying, since Dropbox doesn't know about your purchase
  records. This is a reasonable trade-off for a small, trusted client base;
  if that risk matters more later, downloads could instead be proxied
  through the server or moved back to Cloudflare Stream's gated downloads.
- **No admin UI** — adding clients/videos is done via the `add-video`
  script. A simple password-protected `/admin` page would be a natural
  next step once you're managing more than a couple of clients.
- **Video playback is unsigned** — anyone with the direct Cloudflare Stream
  URL could embed it elsewhere. Cloudflare Stream supports signed URLs if
  you want to lock that down later.
