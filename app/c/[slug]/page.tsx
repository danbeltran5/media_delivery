import Image from "next/image";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { streamPlaybackUrl } from "@/lib/cloudflare-stream";
import { purchaseCookieName } from "@/lib/purchase-cookie";
import { VideoCard } from "@/components/VideoCard";
import { CartProvider } from "@/lib/cart-context";
import { CartBar } from "@/components/CartBar";
import { CreditProvider } from "@/lib/credit-context";
import { CreditBar } from "@/components/CreditBar";
import { RestoreAccessForm } from "@/components/RestoreAccessForm";
import { RedeemCreditsForm } from "@/components/RedeemCreditsForm";
import { SiteFooter } from "@/components/SiteFooter";

export default async function ClientWorkspacePage({
  params,
}: PageProps<"/c/[slug]">) {
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
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 sm:px-10">
        <header className="mb-12">
          <Image
            src="/brand/logo.png"
            alt="Dan & Tyler Photography"
            width={180}
            height={48}
            className="mb-8"
          />
          <p className="font-label font-bold text-[14px] uppercase tracking-[0.26em] text-accent">
            Your videos
          </p>
          <h1 className="mt-2 font-serif text-[36px] leading-[1.1] tracking-[-0.01em] text-primary">
            {client.name}&rsquo;s videos
          </h1>
          <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.75] text-secondary">
            Watch online anytime. Add videos to your cart to purchase
            full-quality downloads.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <RestoreAccessForm slug={slug} />
            <RedeemCreditsForm />
          </div>
          <div className="mt-8 h-px w-full bg-hairline" />
        </header>

        {client.videos.length === 0 ? (
          <p className="text-secondary">No videos have been added yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {client.videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                description={video.description}
                priceCents={video.priceCents}
                currency={video.currency}
                playbackUrl={streamPlaybackUrl(video.cfStreamUid)}
                purchased={purchasedIds.includes(video.id)}
              />
            ))}
          </div>
        )}
      </main>
      <CartBar />
      <CreditBar clientSlug={slug} />
      <SiteFooter />
    </CreditProvider>
    </CartProvider>
  );
}
