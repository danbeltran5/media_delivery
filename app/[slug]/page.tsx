import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { streamPlaybackUrl, streamThumbnailUrl } from "@/lib/cloudflare-stream";
import { purchaseCookieName } from "@/lib/purchase-cookie";
import { VideoCard } from "@/components/VideoCard";
import { CartProvider } from "@/lib/cart-context";
import { CartBar } from "@/components/CartBar";
import { CreditProvider } from "@/lib/credit-context";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DEFAULT_TAGLINE } from "@/lib/tagline";

export default async function ClientWorkspacePage({
  params,
}: PageProps<"/[slug]">) {
  const { slug } = await params;

  const client = await prisma.client.findUnique({
    where: { slug },
    include: { videos: { orderBy: { title: "asc" } } },
  });

  if (!client) notFound();

  const cookieStore = await cookies();

  const purchasedIds = client.videos
    .filter((video) => cookieStore.get(purchaseCookieName(video.id))?.value === "1")
    .map((video) => video.id);

  return (
    <CartProvider clientSlug={slug} purchasedIds={purchasedIds}>
      <CreditProvider clientSlug={slug}>
        <SiteHeader slug={slug} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-16 sm:px-14">
        <header className="mb-16 flex flex-col items-center text-center">
          <h1 className="font-serif text-[60px] leading-[1.05] tracking-[-0.01em] text-primary">
            {client.name}
          </h1>
          <p className="mt-3 max-w-[68ch] text-[14px] leading-[1.75] text-secondary">
            {client.tagline || DEFAULT_TAGLINE}
          </p>
          <div className="mt-8 h-px w-full bg-hairline" />
        </header>

        {client.videos.length === 0 ? (
          <p className="text-secondary">No videos have been added yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {client.videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                description={video.description}
                priceCents={video.priceCents}
                currency={video.currency}
                playbackUrl={streamPlaybackUrl(video.cfStreamUid)}
                thumbnailUrl={streamThumbnailUrl(video.cfStreamUid)}
                purchased={purchasedIds.includes(video.id)}
                orientation={client.orientation === "landscape" ? "landscape" : "portrait"}
              />
            ))}
          </div>
        )}
      </main>
      <CartBar clientSlug={slug} />
      <SiteFooter />
    </CreditProvider>
    </CartProvider>
  );
}
