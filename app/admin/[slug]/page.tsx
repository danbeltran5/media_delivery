import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { streamThumbnailUrl } from "@/lib/cloudflare-stream";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminGrantCreditsForm } from "@/components/AdminGrantCreditsForm";
import { AdminTaglineForm } from "@/components/AdminTaglineForm";
import { AdminVideoPriceForm } from "@/components/AdminVideoPriceForm";
import { AdminBulkPriceForm } from "@/components/AdminBulkPriceForm";
import { AdminReplaceVideoForm } from "@/components/AdminReplaceVideoForm";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminClientDetailPage({
  params,
}: PageProps<"/admin/[slug]">) {
  if (!(await isAdminAuthed())) {
    return <AdminLoginForm />;
  }

  const { slug } = await params;

  const client = await prisma.client.findUnique({
    where: { slug },
    include: {
      videos: {
        orderBy: { title: "asc" },
        include: {
          purchases: {
            where: { status: "paid" },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      credits: {
        orderBy: { createdAt: "desc" },
        include: {
          purchases: {
            where: { status: "paid" },
            include: { video: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!client) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 sm:px-10">
      <header className="mb-10">
        <Link
          href="/admin"
          className="font-label font-bold text-[12px] uppercase tracking-[0.18em] text-muted underline underline-offset-2 hover:text-accent"
        >
          &larr; All clients
        </Link>
        <p className="mt-4 font-label font-bold text-[14px] uppercase tracking-[0.26em] text-accent">
          Admin
        </p>
        <h1 className="mt-2 font-serif text-[32px] text-primary">
          {client.name}
        </h1>
        <Link
          href={`/${client.slug}`}
          target="_blank"
          className="text-[14px] text-accent underline underline-offset-2"
        >
          /{client.slug}
        </Link>
      </header>

      <section className="mb-12">
        <h2 className="mb-4 font-serif text-[22px] text-primary">
          Gallery description
        </h2>
        <AdminTaglineForm clientId={client.id} tagline={client.tagline} />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-serif text-[22px] text-primary">
          Free download credits
        </h2>
        <div className="mb-6 border border-line bg-card p-4">
          <AdminGrantCreditsForm clientId={client.id} />
        </div>
        {client.credits.length === 0 ? (
          <p className="text-[14px] text-secondary">
            No credits granted yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {client.credits.map((credit) => {
              const used = credit.purchases.length;
              const remaining = credit.totalCredits - used;
              return (
                <div
                  key={credit.id}
                  className="overflow-hidden border border-line bg-card"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline p-4">
                    <span className="text-[15px] text-primary">{credit.email}</span>
                    <span className="font-label font-bold text-[12px] uppercase tracking-[0.18em] text-muted">
                      {used} of {credit.totalCredits} used &middot; {remaining} remaining
                    </span>
                  </div>
                  {used > 0 && (
                    <div className="divide-y divide-hairline">
                      {credit.purchases.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[14px]"
                        >
                          <span className="font-label font-bold text-[12px] uppercase tracking-[0.1em] text-secondary">
                            {purchase.video.title}
                          </span>
                          <span className="text-muted">
                            Redeemed {formatDate(purchase.createdAt)}
                          </span>
                          <span
                            className={purchase.downloadedAt ? "text-accent" : "text-muted"}
                          >
                            {purchase.downloadedAt
                              ? `Downloaded ${formatDate(purchase.downloadedAt)}`
                              : "Not downloaded yet"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-4 font-serif text-[22px] text-primary">
          Bulk price update
        </h2>
        <AdminBulkPriceForm clientId={client.id} />
      </section>

      <div className="flex flex-col gap-6">
        {client.videos.map((video) => (
          <div
            key={video.id}
            className="overflow-hidden border border-line bg-card"
          >
            <div className="flex flex-wrap items-center gap-4 border-b border-hairline p-4">
              <img
                src={streamThumbnailUrl(video.cfStreamUid, video.thumbnailSec)}
                alt={video.title}
                className="h-16 w-12 border border-hairline object-cover"
              />
              <div className="flex-1">
                <h2 className="font-label font-bold text-[15px] uppercase tracking-[0.1em] text-primary">
                  {video.title}
                </h2>
                <AdminVideoPriceForm videoId={video.id} priceCents={video.priceCents} />
              </div>
              <span className="font-label font-bold text-[12px] uppercase tracking-[0.18em] text-muted">
                {video.purchases.length} purchase
                {video.purchases.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="border-b border-hairline p-4">
              <AdminReplaceVideoForm
                videoId={video.id}
                cfStreamUid={video.cfStreamUid}
                downloadUrl={video.downloadUrl}
                thumbnailSec={video.thumbnailSec}
                thumbnailBaseUrl={streamThumbnailUrl(video.cfStreamUid)}
              />
            </div>
            {video.purchases.length > 0 && (
              <div className="divide-y divide-hairline">
                {video.purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[14px]"
                  >
                    <span className="text-secondary">
                      {purchase.email ?? "(no email)"}
                      {purchase.creditId && (
                        <span className="ml-2 text-accent">(free — credit)</span>
                      )}
                    </span>
                    <span className="text-muted">
                      Purchased {formatDate(purchase.createdAt)}
                    </span>
                    <span
                      className={
                        purchase.downloadedAt ? "text-accent" : "text-muted"
                      }
                    >
                      {purchase.downloadedAt
                        ? `Downloaded ${formatDate(purchase.downloadedAt)}`
                        : "Not downloaded yet"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
