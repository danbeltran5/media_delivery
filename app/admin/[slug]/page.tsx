import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { streamThumbnailUrl } from "@/lib/cloudflare-stream";
import { AdminLoginForm } from "@/components/AdminLoginForm";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

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
    },
  });

  if (!client) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 sm:px-10">
      <header className="mb-10">
        <Link
          href="/admin"
          className="font-label text-[12px] uppercase tracking-[0.1em] text-muted underline underline-offset-2 hover:text-accent"
        >
          &larr; All clients
        </Link>
        <p className="mt-4 font-label text-[14px] uppercase tracking-[0.22em] text-accent">
          Admin
        </p>
        <h1 className="mt-2 font-serif text-[32px] text-primary">
          {client.name}
        </h1>
        <Link
          href={`/c/${client.slug}`}
          target="_blank"
          className="text-[14px] text-accent underline underline-offset-2"
        >
          /c/{client.slug}
        </Link>
      </header>

      <div className="flex flex-col gap-6">
        {client.videos.map((video) => (
          <div
            key={video.id}
            className="overflow-hidden rounded-sm border border-line bg-card"
          >
            <div className="flex flex-wrap items-center gap-4 border-b border-hairline p-4">
              <img
                src={streamThumbnailUrl(video.cfStreamUid)}
                alt={video.title}
                className="h-16 w-12 rounded-xs border border-hairline object-cover"
              />
              <div className="flex-1">
                <h2 className="font-serif text-[18px] text-primary">
                  {video.title}
                </h2>
                <p className="text-[13px] text-muted">
                  {formatPrice(video.priceCents)}
                </p>
              </div>
              <span className="font-label text-[12px] uppercase tracking-[0.1em] text-muted">
                {video.purchases.length} purchase
                {video.purchases.length === 1 ? "" : "s"}
              </span>
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
